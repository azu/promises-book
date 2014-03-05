#!/bin/sh

if [[ "$TRAVIS_PULL_REQUEST" == "true" ]]; then
    echo "This is a pull request. No deployment will be done.";
    exit 0;
fi

git checkout -B gh-pages

make html

lastCommit=$(git log --oneline | head -n 1)
echo "=COMMIT="
echo "MESSAGE :" $lastCommit

git config --global user.email "travis@travis-ci.org"
git config --global user.name "travis-ci"
git add -A .
git commit -m "Travis build $TRAVIS_BUILD_NUMBER"
git push --force --quiet "https://${GH_TOKEN}@${GH_REF}" gh-pages > /dev/null