#!/bin/bash

export LANG=en_US.UTF-8
RETRIES=${KW_RETRIES:-"3"}
USEFOLLOW=${KW_USEFOLLOW:-"-f"} # ""
USEJS=${KW_USEJS:-""} # "-j"
USEPROXY=${KW_USEPROXY:-"-p 192.168.0.1:8080"} # "-p host:port" or "-p \"\""
NOPIC=${KW_NOPIC:-""} # "-s"
USEGRID=${KW_USEGRID:-""} # "-g"

function usage
{
    echo -e "Usage: $(basename $0)" \
        "file1.ggx ..." \
        "(list of files of url lists ending in .ggx) \n\
Wrapper for $(dirname $0)/grab.sh: Grab URLs listed in files.\n\
(See the beginning of the file for some parameters you might want to change.)
\n\
    status output:
         c:apitulated
         f:ailed
         h:TTP response status error
         k:illed
         l:ocked
         .:found in inital sweep - file existed then
         *:xists - recently added
         +:success"
    exit 1
}

while getopts ":h" opt
do
    case $opt in
        h|\?) usage
            ;;
    esac
done
shift $(($OPTIND - 1))

function cleanup
{
    if [ -n ${FN} ]
    then
        echo cleaning up...
        # if [ -e ${LOG} ]; then rm -v ${LOG}; fi
        if [ -e ${FN} ]; then rm -v ${FN}; fi
        if [ -e ${FN}.awk ]; then rm -v ${FN}.awk; fi
        if [ -e ${FN}.lock ]; then rmdir -v ${FN}.lock; fi
    fi
    exit
}

function settrap
{
    trap cleanup INT TERM
}

for g in $@
do
    echo $g
    # sanity check
    if [ "$( sort ${g} | uniq -d | tee /dev/stderr )" ]
    then 
        echo "...has duplicate lines - omitting."
        break
    fi

    i=0
    cat=$(basename $g .ggx)

    # create directory for the output files
    [ -d ${cat} ] || mkdir ${cat} || exit 1
    
    # build a list of already processed files for later look-up
    processed=
    for num in \
        $(sort \
        <(seq -f "%05g" 1 $(( $(wc -l $g | cut -d ' ' -f1) )) ) \
        <(find ./${cat}/ -maxdepth 1 -name '*.html' -printf '%f\n' 2>/dev/null | sed -e 's#\.html##') | uniq -d | sed -e 's#^0\+##')
    do
        processed[${num}]=y
    done

    settrap

    for url in $(cat $g)
    do
        let i++

        # be verbose from time to time - print acutal file and count
        if ! (( $i % 5000 ))
        then 
            echo -e "\n${cat}/${i}"
        fi

        # look up current file in built list - and skip if already seen...
        [ -n "${processed[${i}]}" ] && echo -n "." && continue

        printf -v ind "%05d" $i
        FN=${cat}/${ind}.html
        LOG=${cat}/${ind}.log

        # skip if file exists
        # skip if too many tries
        # create lock while processing
        if [[ -f ${FN} ]]
        then
            echo "DATE: "$(date) >> $LOG
            echo "EXISTS" >> $LOG
            # exists
            echo -n "*"
            continue
        elif [[ -f $LOG && $(grep -cE "^FAILED( - .)?$" ${LOG}) -ge ${RETRIES} ]]
        then 
            # capitulated
            echo -n "c"
            continue
        else
            if mkdir ${FN}.lock > /dev/null 2>&1
            then
                echo "DATE: "$(date) >> $LOG
            else
                # locked
                echo -n "l"
                continue
            fi
        fi
        
        # download
        # echo $(dirname $0)/grab.sh $USEGRID $USEFOLLOW $USEJS $USEPROXY $NOPIC "$url" $(pwd)/$cat.$ind
        $(dirname $0)/grab.sh $USEGRID $USEFOLLOW $USEJS $USEPROXY $NOPIC "$url" $(pwd)/$cat/$ind 1>&1 >> $LOG
        _RES=$?

        # this gives us the URL as the app printed it
        APPURL=$(awk '/URL:/ { print $2; }' $LOG | tail -n 1 | sed 's|^\(.*/\).*$|\1|')

        # remove lock
        rmdir ${FN}.lock
        
        if [[ "$(grep -E "^HRS:" "${LOG}" | tail -n1 | cut -c1-8)" = "HRS: ERR" || ${_RES} != 0 || ! -f ${FN} ]]
        then
            rm ${FN} 2>/dev/null
            echo "NOT: '$url'" >> $LOG
            echo -n "FAILED" >> $LOG

            if [ ${_RES} = 10 ]
            then 
                # timeout -> killed
                echo -n "k"
                echo " - k" >> $LOG
            elif [ ${_RES} = 20 ]
            then
                # failed
                echo -n "f"
                echo " - f" >> $LOG
            elif [ ${_RES} = 30 ] 
            then
                # stopped - page load timeout
                echo -n "s"
                echo " - s" >> $LOG
            elif [ "$(grep -E "^HRS:" "${LOG}" | tail -n1 | cut -c1-8)" = "HRS: ERR" ]
            then
                # HTTP Response Status
                # not any of: 200 301 302 303 304 307
                echo -n "h"
                echo " - h" >> $LOG
            else
                # unknown failure
                echo -n "u"
                echo " - u" >> $LOG
            fi
            continue
        fi

        # SKIP: determine encoding
        # 1. try content-type in html
        #ENC=`sed -n 's/^.*charset=\([0-9a-zA-Z_-]*\)".*$/\1/p' $FN | head -n1`
        # 2. try detectin via file
        #test -n "$ENC" || ENC=`file -i $FN | sed -n 's/.*=\(.*$\)$/\1/p' `
        #test "$ENC" == "unknown" && ENC="utf-8"
        # 3. fall back to utf8
        #test -n "$ENC" || ENC="utf-8"
        #ENC=`echo $ENC | sed 's/latin-\([0-8]\)/latin\1/'`
        #echo "ENC: $ENC"
        # convert to utf8
        #cp $FN $FN.orig
        #iconv -c -t utf8 -f $ENC $FN.orig -o $FN >> $LOG

        # following http://www.w3.org/International/tutorials/tutorial-char-enc/
        # replace previous charset definition
        sed -i 's/<meta http-equiv\ *=\ *"content-type"[^>]*>//i' $FN
        sed -i '1 s/<?xml[^>]*?>/<?xml version="1.0" encoding="utf-8"?>/' $FN
        # fix base url, insert encoding info - hoping that '|' is not part of thr URL
        sed -i "s|<head\([^>]\+\?\)>|<head\1><base href=\"${APPURL}\" /><meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" />|i" $FN
        
        # split pre tags into single lines
        mv $FN $FN.awk
        awk '/<pre>/,/<\/pre>/ { gsub("$", "</pre><pre>"); } {print}' $FN.awk > $FN
        rm ${FN}.awk
        echo "DONE" >> $LOG
        echo -n "+"
    done
    echo
done
