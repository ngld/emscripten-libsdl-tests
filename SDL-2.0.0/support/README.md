Support files for SDL2's tests
==============================

The header files are part of libSDL's source code and can be found inside the ```include``` directory
of the source distribution. The ```libsdl2_test.bc``` file is also part of libSDL's source code
and can be compiled using the following steps:

NOTE: ```$EMSCRIPTEN``` is supposed to be the path to your emscripten directory.
1. Install the package ```libxext-dev``` and copy the directory ```/usr/include/X11``` in ```$EMSCRIPTEN/system/include```.
2. Download http://libsdl.org/release/SDL2-2.0.0.tar.gz and extract it.
3. Run ```emconfigure ./configure```.
4. Remove ```$EMSCRIPTEN/system/include/X11```.
5. Run ```emmake make build/libSDL2_test.a```.
6. Switch inside the ```build``` directory ```make``` created and run ```clang -shared -o libsdl2_test.bc *.o```.
7. There's your ```libsdl2_test.bc``` file.