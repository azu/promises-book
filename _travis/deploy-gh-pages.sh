#!/bin/bash

if [[ "$TRAVIS_PULL_REQUEST" == "true" ]]; then
    echo "This is a pull request. No deployment will be done.";
    exit 0;
fi

git checkout -B gh-pages

asciidoctor -a icons=font -a source-highlighter=pygments --backend html5 -o index.html index.adoc
(
 lastCommit=$(git log --oneline | head -n 1)
 echo "=COMMIT="
 echo "MESSAGE :" $lastCommit

 git config --global user.email "travis@travis-ci.org"
 git config --global user.name "travis-ci"
 git add -A .
 git commit -m "Travis build $TRAVIS_BUILD_NUMBER"
 git push --force --quiet "https://${GH_TOKEN}@${GH_REF}" master:gh-pages > /dev/null 2>&1
)