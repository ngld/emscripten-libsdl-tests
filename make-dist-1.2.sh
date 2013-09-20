#!/bin/bash

cd "$(dirname "$0")"

if [ ! -d build ]; then
    sh ./test-1.2.sh --no-web
fi

[ -f dist-1.2.tar.gz ] && rm dist-1.2.tar.gz

echo "Compressing files..."
ln -s SDL-1.2.* tests

cd SDL-1.2.*
../test_server.py &
serv="$!"
sleep 0.3

cd ..
curl -s "http://localhost:8080/build/index.json" > build/index.json
kill "$serv"

tar --exclude '*.c' --exclude-vcs -hcf dist-1.2.tar tests build LICENSE README*
rm build/index.json
unlink tests

cd web
tar --exclude-vcs -rf ../dist-1.2.tar *
gzip ../dist-1.2.tar

echo "Done"