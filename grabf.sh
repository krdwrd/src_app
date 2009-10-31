#!/bin/bash

CONFIG=$(dirname $0)/config.app
CMD=$(basename $0)

if [ ! -f ${CONFIG} ]; then
    echo ${CMD}: Adapt FILE:config.dist and save it as $(basename ${CONFIG}) 
    exit 1
else
    . ${CONFIG}
fi

waitforapp() {
    until [[ ${line} == "APP: READY" ]]
    do 
        read -t ${KW_TMOUT} line < ${FIFO}; 
        if [[ $? != 0 ]]; then 
            ${KILLALL}
            break; 
        fi
        echo ${line};
    done
    line=""
}

URL=$1
OUT=$2
DIR=$(dirname $0)

if [[ -z "$URL" || -z "$OUT" ]];
then
    echo "Usage: ${CMD} http://url /absolute/output/path"
    exit 1
fi

# the app directory NEEDs a link to the lock file in the app's profile
KILLALL="kill $(readlink $(readlink $(dirname ${KW_CMD})/lock) | sed -e 's/.*+//')"
#KW_CMD="xulrunner-1.9.2 application.ini"
RUNCMD="$KW_CMD -kwtags -text -grab -url $URL -out $OUT -follow"

FIFO=${APP}/krdwrd.fifo
if [[ ! -p $FIFO ]]; then
    #echo "#that#"
    mkfifo $FIFO
fi

$RUNCMD > $FIFO &
waitforapp
