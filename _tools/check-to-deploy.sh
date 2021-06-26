#!/bin/bash

# deploy-*.shを行う際に必要なファイルが生成されているかをチェックする
declare parentDir=$(cd $(dirname $(cd $(dirname $0);pwd));pwd)
if [ ! -e "${parentDir}/javascript-promise-book.pdf" ]; then
    echo "Not found javascript-promise-book.pdf"
    exit 1
fi
if [ ! -e "${parentDir}/index.html" ]; then
    echo "Fail build index.html"
    exit 1
fi
