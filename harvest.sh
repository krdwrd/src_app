#!/bin/bash

# takes: list of files of url lists (ending in .ggx)

export LANG=en_US.UTF-8
RETRIES=3

function cleanup
{
    if [ -n ${FN} ]
    then
        echo cleaning up...
        if [ -e ${LOG} ]; then rm -v ${LOG}; fi
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
    if [ $(sort ${g} | uniq -d) ]
    then 
        echo "...has duplicate lines - omitting."
        break
    fi

    i=0
    cat=$(basename $g .ggx)
    
    # build a list of already processed files for later look-up
    processed=
    for num in \
        $(sort \
        <(seq -f "%05g" 1 $(( $(wc -l $g | cut -d ' ' -f1) )) ) \
        <(ls -1 ${cat}.*.html 2>/dev/null | sed -e "s#${cat}\.##" -e 's#\.html##') | uniq -d | sed -e 's#^0\+##')
    do
        processed[${num}]=y
    done

    settrap

    for url in $(cat $g)
    do
        let i++

        # look up current file in built list - and skip if already seen...
        [ -n "${processed[${i}]}" ] && echo -n "." && continue

        printf -v ind "%05d" $i
        echo -e "\n***************"
        echo "COR: $cat"
        echo "IND: $ind"
        FN=$cat.$ind.html
        LOG=$cat.$ind.log

        # skip if file exists
        # skip if too many tries
        # create lock while processing
        if [[ -f $FN ]]
        then
            echo "DATE: "$(date) >> $LOG
            echo "EXISTS" >> $LOG
            echo "EXISTS"
            continue
        elif [[ -f $LOG && $(grep -cE "^FAILED$" ${LOG}) -ge ${RETRIES} ]]
        then 
            echo "CAPITULATED"
            continue
        else
            if mkdir ${FN}.lock
            then
                # rm -f $LOG 2> /dev/null
                echo "DATE: "$(date) >> $LOG
            else
                # echo "${FN} locked"
                continue
            fi
        fi
        
        URL=$(awk '/URL:/ { print $2; }' $LOG)
        EURL=$(echo $URL | sed 's/^\(.*\/\).*$/\1/' | sed 's/\//\\\\\//g')

        # download
        $(dirname $0)/grabf.sh "$url" $(pwd)/$cat.$ind 2>&1 >> $LOG

        # remove lock
        rmdir ${FN}.lock
        
        if [[ ! -f $FN ]]
        then
            echo "FAILED" >> $LOG
            echo "FAILED"
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

        # replace previous charset definition
        sed -i 's/<meta http-equiv\ *=\ *"content-type"[^>]*>//i' $FN
        sed -i '1 s/<?xml[^>]*?>/<?xml version="1.0" encoding="utf-8"?>/' $FN

        # fix base url, insert encoding info
        sed -i 's/<head\([^>]\+\?\)>/<head\1><base href="'$EURL'"\/><meta http-equiv="Content-Type" content="text\/html; charset=utf-8">/i' $FN 
        
        # split pre tags into single lines
        mv $FN $FN.awk
        awk '/<pre>/,/<\/pre>/ { gsub("$", "</pre><pre>"); } {print}' $FN.awk > $FN
        rm ${FN}.awk
        echo "DONE" >> $LOG
        echo "DONE"
    done
done
