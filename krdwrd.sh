#!/bin/sh

URL=$1
OUT=$2

if [[ -z "$URL" || -z "$OUT" ]];
then
	echo "Usage: ./krdwrd http://url /absolute/output/path"
	exit 1
fi

xvfb-run -s '-screen 0 1024x768x24' xulrunner application.ini -url $URL -out $OUT

