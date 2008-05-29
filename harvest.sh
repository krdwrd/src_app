#!/bin/sh

# takes: list of files of url lists (ending in .ggx)

export LANG=en_US.UTF-8

for g in $@;
do
    echo $g
    i=0
    for url in `cat $g`;
    do
        cat=`basename $g .ggx`
        ind=`echo $i | awk '{ printf("%03d", $1);}'`
        b=`echo $url | sed 's/^\(.*\/\).*$/\1/' | sed 's/\//\\\\\//g' `
        let i++
        echo "$cat - $ind"
        # skip if file exists
        test -f $cat.$ind.html && continue
        FN=$cat.$ind.txt
        # download
        ./krdwrd.sh "$url" `pwd`/$cat.$ind
        if [[ ! -f $cat.$ind.txt ]]; then
            rm $FN
            echo "FAILED" >> $cat.$ind.log
            echo "SKIPPED"
            continue;
        fi
        # determine encoding
        # 1. try content-type in html
        ENC=`sed -n 's/^.*charset=\([0-9a-zA-Z_-]*\)".*$/\1/p' $FN | head -n1`
        # 2. try detectin via file
        test -n "$ENC" || ENC=`file -i $FN | sed -n 's/.*=\(.*$\)$/\1/p' `
        test "$ENC" == "unknown" && ENC="utf-8"
        # 3. fall back to utf8
        test -n "$ENC" || ENC="utf-8"
        ENC=`echo $ENC | sed 's/latin-\([0-8]\)/latin\1/'`
        echo "Encoding: $ENC"
        # convert to utf8
        cp $FN $FN.orig
        iconv -c -t utf8 -f $ENC $FN.orig -o $FN >> $cat.$ind.log
        # replace previous charset definition
        sed -i 's/<meta http-equiv\ *=\ *"content-type"[^>]*>//i' $FN
        sed -i '1 s/<?xml[^>]*?>/<?xml version="1.0" encoding="utf-8"?>/' $FN
        # fix base url, insert encoding info
        sed -i 's/<head>/<head><base href="'$b'"\/><meta http-equiv="Content-Type" content="text\/html; charset=utf-8">/i' $FN 

    done
done
