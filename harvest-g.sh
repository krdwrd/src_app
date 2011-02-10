#!/bin/bash
#$-M egon.stemle@uos.de
#$-m n 
#$-S /bin/bash
#$-N metabatch 
#$-o $HOME/mkruwac.$JOB_ID-$TASK_ID.out -j y
#$-q *@dolly*

. /etc/profile
. $HOME/.bash_profile

# $-l vf=900M

# start with: 
# qsub -notify -t 1-20 ./NAME.sh
# followd by:
# qsub -hold_jid FORMER_JOB_ID ~/tmp/mail.sh

HOSTNAME=$(hostname -s)

APPDIR=~/krdwrd/app
GRID=${SGE_TASK_ID}${HOSTNAME}
GR_DISPLAY=${SGE_TASK_ID}

i=0

while true 
do
    readarray -t next < <( curl --silent --insecure -u krdwrd: https://krdwrd.org/pages/harvest/next) 
    page_id=${next[0]}
    url=${next[1]}
    if [ ${#next[@]} != "2" ]
    then
        echo -e "${HOSTNAME}/${SGE_TASK_ID}:done."
        continue
    fi

    let i++
    printf -v ind "%05d" $i
    OUTBASE=${TMPDIR:-"/tmp"}/kw_${JOB_ID}.${SGE_TASK_ID}-${ind}
    FN=${OUTBASE}.html
    LOG=${OUTBASE}.log

    # be verbose from time to time - print acutal file and count
    if ! (( $i % 5000 ))
    then 
        echo -e "${HOSTNAME}/${SGE_TASK_ID}:${ind}"
    fi

    export GRID=${GRID} GR_DISPLAY=${GR_DISPLAY}
    USEGRID="-g"
    USEFOLLOW="-f"
    USEJS=""
    USEPROXY="-p proxy.krdwrd.org:8081"
    NOPIC="-s"

    ${HOME}/krdwrd/app/grab.sh $USEGRID $USEFOLLOW $USEJS $USEPROXY $NOPIC "$url" "${OUTBASE}" 1>&1 >> $LOG
    _RES=$?

    # this gives us the URL as the app printed it
    APPURL=$(awk '/^URL:/ { sub("^URL: ","");print $0; }' $LOG | tail -n 1)
    APPCHARS=$(awk '/TXT:.*chars/ { print $2; }' $LOG)
    APPBTETOKS=$(awk '/TXT:.*btetoks/ { print $2; }' $LOG)

    if [[ "$(grep -E "^HRS:" "${LOG}" | tail -n1 | cut -c1-8)" = "HRS: ERR" || ${_RES} != 0 || ! -f ${FN} ]]
    then
        echo "NOT: '$url'" >> $LOG
        echo -n "FAILED" >> $LOG

        #echo "NOT: '$url'" 
        #echo -n "FAILED with ${_RES} on ${HOSTNAME}:"

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
    else
        curl --fail --silent --insecure -u krdwrd: -F "page_id=${page_id}" -F "url=${APPURL}" -F "chars=${APPCHARS}" -F "btetoks=${APPBTETOKS}" https://krdwrd.org/pages/harvest/success \
        && echo -n "+" \
        || echo -n "ERR: posting success failed - page_id=${page_id}, url=${APPURL}, chars=${APPCHARS}, btetoks=${APPBTETOKS}"
        rm ${OUTBASE}.{html,txt}
    fi
    #rm ${OUTBASE}.log
done
