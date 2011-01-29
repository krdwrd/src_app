#!/bin/bash

if [[ -z "$1" || -z "$2" || -n "$3" ]]
then
 cat <<-EOH

 Usage:
 `basename $0` SOURCEDIR FILELIST

 create list urls and filenames of harvested pages in SOURCEDIR
 suitable for usage in addcorpus.py
 add a file given:
 a) the png exists
 b) the txt has between 500 and 6000 'wc -w' words 

 debug output:
 not a and not b -> no output
 a and not b -> !
 a and b -> filename

EOH
 exit 1
fi

GT=${KW_GT:-"500"}
LT=${KW_LT:-"6000"}

SRC=$1
FILELIST=$2
c=0

test -f $FILELIST && rm $FILELIST

for i in $SRC/*.png
do
    B=`basename $i .png`
    test -f $SRC/$B.txt || continue
    W=`wc -w < $SRC/$B.txt`
    
    # for chinese:
    # if [[ "$W" -gt 100 && "$W" -lt 1200 ]]
    
    # for en, de, it
    if [[ "$W" -gt ${GT} && "$W" -lt ${LT} ]]
    then
        URL=$(awk '/^URL:/ { print $2; }' < $SRC/$B.log | tail -n 1)
        if [ "${URL:0:4}" = "http" ] 
        then
            echo -n "$B "
            echo "$URL `pwd`/$SRC/$B.html" >> $FILELIST
            let c++
        else
            echo -n "!${B}:url "
        fi
    else
        echo -n "!${B}:$W "
    fi
done

cut -f 1 -d ' ' $FILELIST | sort | uniq -c | grep -v " 1 http" \
&& echo "URLs appear more than once!"

total=`ls $SRC/*.log | wc -l`
per=`echo "scale = 1; 100 * $c / $total;" | bc`
echo
echo
echo "$c of $total ($per%) copied."
