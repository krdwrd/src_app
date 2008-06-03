#!/bin/sh

if [[ -z "$1" || -z "$2" || -n "$3" ]]
then
 cat <<-EOH

 Usage:
 `basename $0` SOURCEDIR DESTINATIONDIR

 copy harvested data from SOURCEDIR to DESTINATIONDIR if
 a) png exists
 b) the txt is bigger than 1000 bytes

 output:
 not a and not b -> no output
 a and not b -> !
 a and b -> filename

EOH
 exit 1
fi

SRC=$1
DST=$2
c=0

for i in $SRC/*.png
do
    B=`basename $i .png`
    W=`wc -c < $SRC/$B.txt`
    if [[ "$W" -gt 1000 ]]
    then
        echo -n "$B "
        cp $SRC/$B.png $DST
        cp $SRC/$B.txt $DST/$B.html
        let c++
    else
        echo -n "! "
    fi
done

total=`ls $SRC/*.log | wc -l`
per=`echo "scale = 1; 100 * $c / $total;" | bc`
echo
echo
echo "$c of $total ($per%) copied."
