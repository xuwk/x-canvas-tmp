#!/bin/sh

if command -v node >/dev/null 2>&1
then
    node minifier/minify.js package.js -root ../src -output xc.min.js
else
    echo "No node executable found!"
    exit 1
fi
