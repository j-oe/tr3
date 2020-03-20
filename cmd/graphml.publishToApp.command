#!/bin/sh
# get current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
# copy graphml file in edit folder to temporary file
cp ../edit/*.graphml src.graphml &
# start import tranformation
echo "converting..."
java -jar ../tr3/xsl/transform/saxon9he.jar -s:src.graphml -xsl:../tr3/xsl/import.graphml.xsl -o:out.xml
echo "publishing tree..."
# publish tree to frontend
cp -f out.xml ../../Frontend/logic/smarthelp.xml
## tranformation out of CMS
# publish content of cms to frontend
echo "publishing contents..."
cp -R -f ../tr3x/content ../../Frontend/content/
# remove temp files
rm src.graphml
rm out.xml
echo "starting application"
# start webserver and open browser
osascript -e 'tell application "Terminal" to do script "cd '$DIR' && cd ../../Frontend && python -m SimpleHTTPServer 8001"'
open 'http://localhost:8001'
echo "hooray!"
exit