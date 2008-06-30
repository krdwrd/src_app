#!/bin/sh

URL=$1
OUT=$2
DIR=`dirname $0`

if [[ -z "$URL" || -z "$OUT" ]];
then
	echo "Usage: ./grab.sh http://url /absolute/output/path"
	exit 1
fi

$DIR/krdwrd -kwtags -text -grab -url $URL -out $OUT

