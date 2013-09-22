#!/bin/bash

if ! which emcc > /dev/null; then
    echo "Couldn't find Emscripten!"
    exit 1
fi

cd "$(dirname "$0")"

[ -d build ] && rm -r build
mkdir build
cd build
echo "Compiling..."
emcc --version | head -1 > emcc_version.txt

sdl_path=../SDL-2.0.*
for path in $sdl_path/*.{c,cpp}; do
    [ ! -f "$path" ] && continue
    
    file="$(basename "$path")"
    [ -f "$file.js" ] && rm "$file.js"
    [ -f "$file.log" ] && rm "$file.log"
    [ -f "$file.js.map" ] && rm "$file.js.map"
    
    echo "$file"
    emcc -g4 -O2 -Xclang -fcolor-diagnostics -o "$file.js" -I${sdl_path}/support "$path" ${sdl_path}/support/libsdl2_test.bc 2>&1 | tee "$file.log"
done

if [ ! "$1" = "--no-web" ]; then
    echo "Starting web server..."
    cd ..

    ./test_server.py -l SDL-2.0.* "$@"
fi
