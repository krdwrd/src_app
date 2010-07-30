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
        "[-f] [-g] [-j] [-p ARG] [-s] http://url /absolute/output/path\n\
Wrapper for $(dirname $0)/krdwrd: grab mode.\n\
(Implements logic to have multiple Apps run in parallel.)\n\
\n\
        -f: use the app's follow feature\n\
        -g: use grid logic\n\
        -j: activate JavaScript\n\
        -p ARG: use ARG as http(s) proxy\n\
        -s: DISABLE screenshot"
    exit 1
}

unset USEFOLLOW USEGRID USEJS USEPROXY NOPIC
while getopts ":fgjp:s" opt
do
    case $opt in
        f ) USEFOLLOW="-follow"
            ;;
        g ) USEGRID=true
            ;;
        j ) USEJS="-js"
            ;;
        p ) USEPROXY="-proxy $OPTARG"
            ;;
        s ) NOPIC="-pic"
            ;;
        \?) usage
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

CARGS="-kwtags -text -grab -url "$URL" -out "$OUT" $USEFOLLOW $USEJS $USEPROXY $NOPIC"

if [ -n "$USEGRID" ]
then
    $APP/krdwrd-g $CARGS 2>/dev/null
elif [ -n "$USEFOLLOW" ]
then
    $APP/krdwrd-f $CARGS 2>/dev/null
else
    $APP/krdwrd $CARGS
fi
