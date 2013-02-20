rem you need http://closure-compiler.googlecode.com/files/compiler-latest.zip
copy /b lib\*.js tmplib.js
copy /b header + glpdebug.js + tmplib.js + footer dist\glpk.js
copy /b glprelease.js + tmplib.js tmp1.js
java -jar compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --js tmp1.js --js_output_file tmp2.js
copy /b header + tmp2.js + footer dist\glpk.min.js
del tmp1.js
del tmp2.js
del tmplib.js