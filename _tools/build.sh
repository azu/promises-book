#!/bin/bash

SRC_FILE=index.adoc
OUTPUT_FILE=index.html

buildResult=$(asciidoctor -a bookversion=`node ./_tools/cli-book-version.js` \
    -a icons=font -a iconfont-cdn=public/css/font-awesome.min.css -a source-highlighter=coderay --backend html5 \
    -o ${OUTPUT_FILE} ${SRC_FILE} 2>&1)

echo -n "${buildResult}"

grepResult=$(echo ${buildResult} | grep "WARNING")
if [ $? -eq 0 ]
then
    exit 1
fi