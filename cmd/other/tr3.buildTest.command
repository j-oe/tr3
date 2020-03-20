#!/bin/sh
# get current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
# copy graphml file in edit folder to temporary file
cp ../../edit/*.xml src.xml &
# start import tranformation
echo "preprocessing..."
java -jar ../../tr3/xsl/transform/saxon9he.jar -s:src.xml -xsl:../../tr3/xsl/tr3.preprocessing.xsl -o:tr3.pp.xml
echo "layouting..."
java -jar ../../tr3/xsl/transform/saxon9he.jar -s:tr3.pp.xml -xsl:../../tr3/xsl/tr3.layouting.xsl -o:tr3.layout.xml
echo "rendering..."
java -jar ../../tr3/xsl/transform/saxon9he.jar -s:tr3.layout.xml -xsl:../../tr3/xsl/tr3.rendering.xsl -o:out.html
# publish to backend
cp out.html ../../tr3x/index.html
# remove temp files
rm src.xml
rm tr3.pp.xml
rm tr3.layout.xml
rm out.html
echo "starting test environment"
# start webserver and open browser
osascript -e 'tell application "Terminal" to do script "cd '$DIR' && cd ../../tr3x && python -m SimpleHTTPServer 8000"'
open 'http://localhost:8000'
echo "hooray!"
exit