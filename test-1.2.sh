#!/bin/bash

if ! which emcc > /dev/null; then
    echo "Couldn't find Emscripten!"
    exit 1
fi

cd "$(dirname "$0")"

[ ! -d build ] && mkdir build
cd build
echo "Compiling..."

for path in ../SDL-1.2.*/*.c; do
    file="$(basename "$path")"
    [ -f "$file.js" ] && rm "$file.js"
    [ -f "$file.log" ] && rm "$file.log"
    [ -f "$file.map" ] && rm "$file.map"
    
    echo "$file"
    emcc -g4 -O2 -Xclang -fcolor-diagnostics -o "$file.js" "$path" 2>&1 | tee "$file.log"
done

if [ ! "$1" = "--no-web" ]; then
    echo "Starting web server..."
    cd ../SDL-1.2.*

    ../test_server.py -l "$@"
fi
