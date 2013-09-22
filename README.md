emscripten-libsdl-tests
=======================

Run libSDL's tests against emscripten to test SDL support.
Most of the 1.2 tests are changed to work with emscripten (the changes are inside ```#ifdef EMSCRIPTEN``` blocks).
Work on the 2.0 tests has begun.


Usage
=====

Just run ```./test_server.py -l SDL-1.2.15``` to start the test framework for SDL 1.2.15.
If you replace ```SDL-1.2.15``` with ```SDL-2.0.0``` you can run the tests for SDL 2.0.0.
Then click "Compile tests" and "Run tests" afterwards.

If you move your mouse over a stacktrace and it turns into a pointer, you can click to see
the related source code.


Writing a test
==============

A test consists of a .c or .cpp which will be compiled with emcc and run in the browser.
All files needed by the test have to be listed in file. One path per line. The file gets
the same name as the test with an added ".files" suffix.
Just look in SDL-1.2.15/ for some examples.