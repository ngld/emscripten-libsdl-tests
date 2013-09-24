#!/bin/bash

if ! which emcc > /dev/null; then
    echo "Couldn't find Emscripten!"
    exit 1
fi

cd "$(dirname "$0")"

[ -d build ] && rm -r build
mkdir build

emcc --version | head -1 > build/emcc_version.txt
./test_server.py -c SDL-2.0.*

if [ ! "$1" = "--no-web" ]; then
    echo "Starting web server..."

    ./test_server.py -l SDL-1.2.* "$@"
fi
