#!/bin/bash

CONFIG=$(dirname $0)/config.app
if [ ! -f ${CONFIG} ]; then
    echo $(basename $0): Adapt FILE:config.dist and save it as $(basename ${CONFIG}) 
    exit 1
else
    . ${CONFIG}
fi

URL=$1
OUT=$2
DIR=$(dirname $0)

if [[ -z "$URL" || -z "$OUT" ]];
then
    echo "Usage: $(basename $0) http://url /absolute/output/path"
    exit 1
fi

#KW_CMD="xulrunner-1.9.2 application.ini"
RUNCMD="$KW_CMD -kwtags -text -grab -url "$URL" -out "$OUT" -follow"

$RUNCMD > $FIFO &
waitforapp
