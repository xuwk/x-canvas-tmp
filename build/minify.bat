@ECHO OFF

node minifier\minify.js package.js -root ..\src -output xc.min.js

PAUSE
