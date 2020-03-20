#!/bin/sh
# get current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
# copy graphml file in edit folder to temporary file
cp ../../edit/*.xml src.xml &
# start import tranformation
echo "preprocessing..."
java -jar ../../tr3/xsl/transform/saxon9he.jar -s:src.xml -xsl:../../tr3/xsl/tr3.preprocessing.xsl -o:../../edit/tr3.pp.xml

# remove temp files
rm src.xml