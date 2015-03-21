#!/bin/bash

set -e

declare parentDir=$(cd $(dirname $(cd $(dirname $0);pwd));pwd)
declare currentDir=$(cd $(dirname $0);pwd)
SRC_FILE=${parentDir}/$1

# CHANGE Working directory
cd ${currentDir}

# config for fopub
CUSTOM_CONFIG_PATH="${currentDir}/fopub-config/custom-config.xml"
# WTF http://d.hatena.ne.jp/hkobayash/20111106/1320560290
ESCAPE_CONFIG_PATH=`echo $CUSTOM_CONFIG_PATH | sed "s/\//\\\\\\\\\//g"`
# hack rewrite fopub/fopub
sed -i.bak "s/\$DOCBOOK_XSL_DIR\/fop-config.xml/$ESCAPE_CONFIG_PATH/" "${currentDir}/fopub/fopub"

${currentDir}/fopub/fopub "${SRC_FILE}" \
-param body.font.family GenShinGothic-P-Regular \
-param dingbat.font.family GenShinGothic-P-Regular \
-param monospace.font.family GenShinGothic-Monospace-Regular \
-param sans.font.family GenShinGothic-P-Regular \
-param title.font.family GenShinGothic-P-Regular \
-param alignment left

# back .bak to fopub
mv -f ${currentDir}/fopub/fopub.bak ${currentDir}/fopub/fopub