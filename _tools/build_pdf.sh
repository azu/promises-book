#!/bin/bash

declare parentDir=$(cd $(dirname $(cd $(dirname $0);pwd));pwd)
declare currentDir=$(cd $(dirname $0);pwd)
SRC_FILE=${parentDir}/index.xml
OUTPUT_FILE_NAME=javascript-promise-book.pdf

${currentDir}/fopub/fopub "${SRC_FILE}" \
-param body.font.family VL-Gothic-Regular \
-param dingbat.font.family VL-Gothic-Regular \
-param monospace.font.family VL-Gothic-Regular \
-param sans.font.family VL-Gothic-Regular \
-param title.font.family VL-Gothic-Regular \
-param alignment left

mv ${parentDir}/index.pdf ${parentDir}/${OUTPUT_FILE_NAME}