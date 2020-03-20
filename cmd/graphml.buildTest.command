#!/bin/sh
# get current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
# copy graphml file in edit folder to temporary file
cp ../edit/*.graphml src.graphml &
# start import tranformation
echo "converting..."
java -jar ../tr3/xsl/transform/saxon9he.jar -s:src.graphml -xsl:../tr3/xsl/import.graphml.xsl -o:tr3.xml
echo "preprocessing..."
java -jar ../tr3/xsl/transform/saxon9he.jar -s:tr3.xml -xsl:../tr3/xsl/tr3.preprocessing.xsl -o:tr3.pp.xml
echo "layouting..."
java -jar ../tr3/xsl/transform/saxon9he.jar -s:tr3.pp.xml -xsl:../tr3/xsl/tr3.layouting.xsl -o:tr3.layout.xml
echo "rendering..."
java -jar ../tr3/xsl/transform/saxon9he.jar -s:tr3.layout.xml -xsl:../tr3/xsl/tr3.rendering.xsl -o:out.html
# publish to backend
cp out.html ../tr3x/index.html
# remove temp files
rm src.graphml
rm tr3.xml
rm tr3.pp.xml
rm tr3.layout.xml
rm out.html
echo "starting test environment"
# start webserver and open browser
osascript -e 'tell application "Terminal" to do script "cd '$DIR' && cd ../tr3x && python -m SimpleHTTPServer 8000"'
open 'http://localhost:8000'
echo "hooray!"
exit