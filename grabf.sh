#!/bin/bash

CONFIG=$(dirname $0)/config.app
if [ ! -f ${CONFIG} ]; then
    echo $(basename $0): Adapt FILE:config.dist and save it as $(basename ${CONFIG}) 
    exit 1
else
    . ${CONFIG}
fi

function usage
{
    echo -e "Usage: $(basename $0)" \
        "[-f] [-j] [-p ARG] http://url /absolute/output/path\n\
        -f: use the app's follow feature\n\
        -j: activate JavaScript\n\
        -p ARG: usr ARG as http(s) proxy\n\
        -s: DISABLE screenshot"
    exit 1
}

unset USEFOLLOW USEJS USEPROXY
while getopts ":fjp:s" opt
do
    case $opt in
        f ) USEFOLLOW="-follow"
            ;;
        j ) USEJS="-js"
            ;;
        p ) USEPROXY="-proxy \"$OPTARG\""
            ;;
        s ) NOPIC="-pic"
            ;;
        /?) usage
            ;;
    esac
done
shift $(($OPTIND - 1))

URL=$1
OUT=$2
DIR=$(dirname $0)

if [[ -z "$URL" || -z "$OUT" ]];
then
    usage
fi

RUNCMD="$KW_CMD -kwtags -text -grab -url "$URL" -out "$OUT" $USEFOLLOW $USEJS $USEPROXY $NOPIC"

if [ -n "$USEFOLLOW" ]
then
    $RUNCMD 1>$FIFO 2>/dev/null &
    waitforapp
else
    $RUNCMD
fi
