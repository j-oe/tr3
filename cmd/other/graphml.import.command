#!/bin/sh
# get current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

echo "importing..."
cp ../../edit/*.graphml src.graphml &
java -jar ../../tr3/xsl/transform/saxon9he.jar -s:src.graphml -xsl:../../tr3/xsl/import.graphml.xsl -o:../../edit/tr3.xml

rm src.graphml