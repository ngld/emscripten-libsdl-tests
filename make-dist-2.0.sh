#!/bin/bash

set -e
cd "$(dirname "$0")"
sh ./test-2.0.sh --no-web

[ -f dist-2.0.tar.gz ] && rm dist-2.0.tar.gz
echo "Compressing files..."

cd build
ls -1 > index.txt
emcc --version | head -1 > emcc_version.txt
echo -n nope >> emcc_version.txt
cd ..

ln -s SDL-2.0.* tests
tar --exclude '*.c' --exclude '*.cpp' --exclude support --exclude-vcs -hcf dist-2.0.tar tests build LICENSE README*
rm build/index.txt
unlink tests

cd web
tar --exclude-vcs -rf ../dist-2.0.tar *
gzip ../dist-2.0.tar

echo "Done"