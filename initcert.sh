#!/bin/sh

PROFILE=$1

if [[ ! -f "$PROFILE/cert8.db" ]]
then
	echo "Usage: ./`basename $0` <krdwrd.org profile directory>"
	exit 1
fi

# import cacert.org ca root
test -f class3.der || wget http://www.cacert.org/certs/class3.der
md5sum -c extensions/krdwrd@krdwrd.org/cert/class3.der.md5 && certutil -A -i class3.der -n "CAcert Class 3 Root - Root CA" -t CT,C,C -d $PROFILE
