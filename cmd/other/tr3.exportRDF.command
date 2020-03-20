#!/bin/sh
# get current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

cp ../../edit/*.xml src.xml &
java -jar ../../tr3/xsl/transform/saxon9he.jar -s:src.xml -xsl:../../tr3/xsl/export.rdf.xsl -o:../../edit/tr3.rdf

rm src.xml