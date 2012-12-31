#!/bin/sh
cat header glpdebug.js lib/*.js footer > dist/glpk.js
cat glprelease.js lib/*.js > tmp1.js
java -jar compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --js tmp1.js --js_output_file tmp2.js
cat header tmp2.js footer > dist/glpk.min.js
rm tmp1.js
rm tmp2.js
