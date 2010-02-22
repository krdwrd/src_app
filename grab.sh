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
    [ -z ${GRID} ] && (echo "$(basename $0): missing value for GRID"; exit 10)
    [ -z ${GR_DISPLAY} ] && (echo "$(basename $0): missing value for GR_DISPLAY"; exit 10)

    if [[ ! -e $APP/application-${GRID}.ini ]]
    then
        echo "$(basename $0): creating file $APP/application-${GRID}.ini"
        sed -e "s#^ID\(.*\)#ID\1\nProfile=krdwrd.org.${GRID}#" ${APP}/application.ini > ${APP}/application-${GRID}.ini
    fi
    
    KILLALL="pkill -f 'xulrunner-bin.*krdwrd.*-${GRID}'"
    
    FIFO=${APP}/krdwrd-${GRID}.fifo
    if [[ ! -p $FIFO ]]; then
        echo "$(basename $0): created FIFO ${FIFO}"
        mkfifo $FIFO
    fi

    DISPLAY=:${GR_DISPLAY}.${KW_SCREEN} ${XULRUNNER} $APP/application-${GRID}.ini -kwtags -text -grab -url "$URL" -out "$OUT" $USEFOLLOW $USEJS $USEPROXY $NOPIC 1>$FIFO 2>/dev/null &
    KW_TMOUT=10
    waitforapp 2>&1 
elif [ -n "$USEFOLLOW" ]
then
    $APP/krdwrd-f $CARGS
else
    $APP/krdwrd $CARGS
fi
