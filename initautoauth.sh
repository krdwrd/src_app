#!/bin/sh

# make the app take advantage of autoauth to get rid of:
# waiting to ack pre-filled proxy server authentication dialogues
#
# the app might get struck by bug https://bugzilla.mozilla.org/show_bug.cgi?id=230190 
# using (code of the) autoauth extension 
#  - http://code.google.com/p/autoauth/
#  - http://code.google.com/p/autoauth/
# helps as a hack!

svn checkout http://autoauth.googlecode.com/svn/trunk/ extensions/autoauth-read-only
ln -s ../../extensions/autoauth-read-only/autoauth/defaults/preferences/autoauth-prefs.js defaults/preferences/
ln -ns ../extensions/autoauth-read-only/autoauth/chrome/content/ ./chrome/autoauth

cat > chrome/autoauth.manifest << EOF
content autoauth autoauth/
overlay chrome://global/content/commonDialog.xul    chrome://autoauth/content/overlay.xul
EOF
