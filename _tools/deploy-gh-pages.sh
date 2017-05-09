#!/bin/bash
set -e

declare currentDir=$(cd $(dirname $0);pwd)

if [ "$TRAVIS_BRANCH" != "master" ] ; then
    exit 0;
fi

if [ $TRAVIS_PULL_REQUEST != 'false' ]; then
    echo "This is a pull request. No deployment will be done.";
    exit 0;
fi

git checkout -B gh-pages
${currentDir}/check-to-deploy.sh

lastCommit=$(git log --oneline | head -n 1)
echo "=COMMIT="
echo "MESSAGE :" $lastCommit

git add -f -A .
git commit --quiet -m "[ci skip] Travis build $TRAVIS_BUILD_NUMBER"
git push --force origin gh-pages
