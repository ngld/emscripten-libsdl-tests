#!/bin/bash

if ! which emcc > /dev/null; then
    echo "Couldn\'t find Emscripten!"
    exit 1
fi

[ ! -d build ] && mkdir build
cd build
echo "Compiling..."

rm *.js *.log
for path in ../SDL-1.2.*/*.c; do
    file="$(basename "$path")"
    echo "$file"
    emcc -O2 -o "$file.js" "$path" 2>&1 | tee "$file.log"
done

echo "Starting web server..."
../test_server.py -l
