#!/bin/bash

set -e
cd "$(dirname "$0")"

[ -d build ] && rm -r build
sh ./test-1.2.sh --no-web

[ -f dist-1.2.tar.gz ] && rm dist-1.2.tar.gz
echo "Compressing files..."

cd build
ls -1 > index.txt
emcc --version | head -1 > emcc_version.txt
echo -n nope >> emcc_version.txt
cd ..

ln -s SDL-1.2.* tests
tar --exclude '*.c' --exclude '*.cpp' --exclude-vcs -hcf dist-1.2.tar tests build LICENSE README*
rm build/index.txt
unlink tests

cd web
tar --exclude-vcs -rf ../dist-1.2.tar *
gzip ../dist-1.2.tar

echo "Done"