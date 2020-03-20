#!/bin/sh
# get current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
# copy to target folder
echo "starting test environment"
cp ../../edit/*.xml ../../tr3x/vis/src/tr3.xml &

# start webserver and open browser
osascript -e 'tell application "Terminal" to do script "cd '$DIR' && cd ../../tr3x && python -m SimpleHTTPServer 8000"'
open 'http://localhost:8000/vis'
echo "hooray!"
exit