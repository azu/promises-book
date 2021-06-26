#!/bin/bash

set -e

declare parentDir=$(cd $(dirname $(cd $(dirname $0);pwd));pwd)
declare currentDir=$(cd $(dirname $0);pwd)
declare projectDir=$(git rev-parse --show-toplevel);
declare SCRIPT_DIR="${projectDir}/_tools"
SRC_FILE=${parentDir}/$1

# CHANGE Working directory
cd ${SCRIPT_DIR}

# config for fopub
CUSTOM_CONFIG_PATH="${SCRIPT_DIR}/fopub-config/custom-config.xml"
# WTF http://d.hatena.ne.jp/hkobayash/20111106/1320560290
ESCAPE_CONFIG_PATH=`echo $CUSTOM_CONFIG_PATH | sed "s/\//\\\\\\\\\//g"`
# hack rewrite fopub/fopub
sed -i.bak "s/\$DOCBOOK_XSL_DIR\/fop-config.xml/$ESCAPE_CONFIG_PATH/" "${SCRIPT_DIR}/fopub/fopub"

${SCRIPT_DIR}/fopub/fopub "${SRC_FILE}" \
-param body.font.family GenShinGothic-P-Regular \
-param dingbat.font.family GenShinGothic-P-Regular \
-param monospace.font.family GenShinGothic-Monospace-Regular \
-param sans.font.family GenShinGothic-P-Regular \
-param title.font.family GenShinGothic-P-Regular \
-param alignment left

# back .bak to fopub
mv -f ${SCRIPT_DIR}/fopub/fopub.bak ${SCRIPT_DIR}/fopub/fopub
