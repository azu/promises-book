#!/bin/bash

if [[ "$TRAVIS_PULL_REQUEST" == "true" ]]; then
    echo "This is a pull request. No deployment will be done.";
    exit 0;
fi

asciidoctor -a icons=font -a source-highlighter=pygments --backend html5 -o index.html index.adoc
(
 lastCommit=$(git log --oneline | head -n 1)
 echo "=COMMIT="
 echo "MESSAGE :" $lastCommit

 git checkout -B gh-pages
 git config --global user.email "$GIT_EMAIL"
 git config --global user.name "$GIT_NAME"
 git add --all .
 git commit -q -m "Travis build $TRAVIS_BUILD_NUMBER"
 git push --force --quiet "https://${GH_TOKEN}@${GH_REF}" gh-pages /dev/null 2>&1

 rm index.html
)