#!/bin/bash

declare parentDir=$(cd $(dirname $(cd $(dirname $0);pwd));pwd)
declare currentDir=$(cd $(dirname $0);pwd)
SRC_FILE=${parentDir}/$1

${currentDir}/fopub/fopub "${SRC_FILE}" \
-param body.font.family VL-Gothic-Regular \
-param dingbat.font.family VL-Gothic-Regular \
-param monospace.font.family VL-Gothic-Regular \
-param sans.font.family VL-Gothic-Regular \
-param title.font.family VL-Gothic-Regular \
-param alignment left
