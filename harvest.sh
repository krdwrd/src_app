#!/bin/sh

# takes: list of files of url lists (ending in .ggx)

export LANG=en_US.UTF-8

for g in $@;
do
    echo $g
    i=0
    for url in `cat $g`;
    do
		echo "***************"
        cat=`basename $g .ggx`
        ind=`echo $i | awk '{ printf("%03d", $1);}'`
        let i++
        echo "COR: $cat"
		echo "IND: $ind"
        FN=$cat.$ind.txt
        LOG=$cat.$ind.log
		echo "DATE: "`date` >> $LOG
        # skip if file exists
		if [[ -f $FN ]]; then
            echo "EXISTS" >> $LOG
			echo "EXISTS"
			continue
		fi
        # download
        ./krdwrd.sh "$url" `pwd`/$cat.$ind 2>&1 >> $LOG
        if [[ ! -f $FN ]]; then
            echo "FAILED" >> $LOG
            echo "FAILED"
            continue;
        fi
		URL=`awk '/URL:/ { print $2; }' $LOG`
        EURL=`echo $URL | sed 's/^\(.*\/\).*$/\1/' | sed 's/\//\\\\\//g' `
        # determine encoding
        # 1. try content-type in html
        ENC=`sed -n 's/^.*charset=\([0-9a-zA-Z_-]*\)".*$/\1/p' $FN | head -n1`
        # 2. try detectin via file
        test -n "$ENC" || ENC=`file -i $FN | sed -n 's/.*=\(.*$\)$/\1/p' `
        test "$ENC" == "unknown" && ENC="utf-8"
        # 3. fall back to utf8
        test -n "$ENC" || ENC="utf-8"
        ENC=`echo $ENC | sed 's/latin-\([0-8]\)/latin\1/'`
        echo "ENC: $ENC"
        # convert to utf8
        cp $FN $FN.orig
        iconv -c -t utf8 -f $ENC $FN.orig -o $FN >> $LOG
        # replace previous charset definition
        sed -i 's/<meta http-equiv\ *=\ *"content-type"[^>]*>//i' $FN
        sed -i '1 s/<?xml[^>]*?>/<?xml version="1.0" encoding="utf-8"?>/' $FN
        # fix base url, insert encoding info
        sed -i 's/<head>/<head><base href="'$EURL'"\/><meta http-equiv="Content-Type" content="text\/html; charset=utf-8">/i' $FN 
        # split pre tags into single lines
        mv $FN $FN.awk
        awk '/<pre>/,/<\/pre>/ { gsub("$", "</pre><pre>"); } {print}' $FN.awk > $FN
        rm $FN.awk
		echo "DONE" >> $LOG
		echo "DONE"

    done
done

