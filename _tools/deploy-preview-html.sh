#!/bin/bash

echo "=COMMIT="
echo "MESSAGE :" $lastCommit

git checkout -B preview-html
make html
cat ./index.html | _tools/cli-rel-to-abs.js | _tools/cli-inject-meta.js > $TRAVIS_JOB_NUMBER.html

git pull
git add -A $TRAVIS_JOB_NUMBER.html
git commit -m "Preview HTML $TRAVIS_BUILD_NUMBER"
git push --quiet --force "https://${GH_TOKEN}@${GH_REF}" preview-html > /dev/null

curl -d message="http://htmlpreview.github.io/?https://github.com/azu/promises-book/blob/preview-html/$TRAVIS_JOB_NUMBER.html" https://webhooks.gitter.im/e/${GITTER_TOKEN}