// Note: Some Emscripten settings will significantly limit the speed of the generated code.
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module.exports = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function(x) {
      console.log(x);
    };
    Module['printErr'] = function(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      assert(args.length == sig.length-1);
      return FUNCTION_TABLE[ptr].apply(null, args);
    } else {
      assert(sig.length == 1);
      return FUNCTION_TABLE[ptr]();
    }
  },
  addFunction: function (func) {
    var table = FUNCTION_TABLE;
    var ret = table.length;
    table.push(func);
    table.push(0);
    return ret;
  },
  removeFunction: function (index) {
    var table = FUNCTION_TABLE;
    table[index] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+7)>>3)<<3);(assert((STACKTOP|0) < (STACK_MAX|0))|0); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + (assert(!staticSealed),size))|0;STATICTOP = ((((STATICTOP)+7)>>3)<<3); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + (assert(DYNAMICTOP > 0),size))|0;DYNAMICTOP = ((((DYNAMICTOP)+7)>>3)<<3); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? (((low)>>>(0))+(((high)>>>(0))*4294967296)) : (((low)>>>(0))+(((high)|(0))*4294967296))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? Math.min(Math.floor((tempDouble)/4294967296), 4294967295)>>>0 : (~~(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296)))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    assert(ptr + i < TOTAL_MEMORY);
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    assert(ptr + i < TOTAL_MEMORY);
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0
}
Module['stringToUTF32'] = stringToUTF32;
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    assert(str.charCodeAt(i) === str.charCodeAt(i)&0xff);
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i)
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 10000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 5384;
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });
var _stderr;
var _stderr = _stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([255,255,255,255,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,67,111,117,108,100,110,39,116,32,99,114,101,97,116,101,32,115,117,114,102,97,99,101,58,32,37,115,10,0,0,0,0,76,97,115,116,32,109,111,117,115,101,32,112,111,115,105,116,105,111,110,0,0,0,0,0,40,37,105,44,32,37,105,41,44,32,114,101,108,32,40,37,105,44,32,37,105,41,10,0,89,111,117,39,114,101,32,97,119,101,115,111,109,101,33,0,84,101,115,116,32,77,101,115,115,97,103,101,0,0,0,0,67,108,105,112,98,111,97,114,100,32,105,115,32,101,109,112,116,121,10,0,0,0,0,0,67,108,105,112,98,111,97,114,100,58,32,37,115,10,0,0,45,45,108,111,103,0,0,0,67,111,112,105,101,100,32,116,101,120,116,32,116,111,32,99,108,105,112,98,111,97,114,100,10,0,0,0,0,0,0,0,83,68,76,32,114,111,99,107,115,33,10,89,111,117,32,107,110,111,119,32,105,116,33,0,67,111,117,108,100,110,39,116,32,111,112,101,110,32,97,117,100,105,111,58,32,37,115,10,0,0,0,0,0,0,0,0,45,45,105,116,101,114,97,116,105,111,110,115,0,0,0,0,65,117,100,105,111,32,100,114,105,118,101,114,58,32,37,115,10,0,0,0,0,0,0,0,67,111,117,108,100,110,39,116,32,105,110,105,116,105,97,108,105,122,101,32,97,117,100,105,111,32,100,114,105,118,101,114,58,32,37,115,10,0,0,0,66,117,105,108,116,45,105,110,32,97,117,100,105,111,32,100,114,105,118,101,114,115,58,0,78,111,32,98,117,105,108,116,45,105,110,32,97,117,100,105,111,32,100,114,105,118,101,114,115,10,0,0,0,0,0,0,67,117,114,114,101,110,116,32,114,101,110,100,101,114,101,114,58,10,0,0,0,0,0,0,67,111,117,108,100,110,39,116,32,99,114,101,97,116,101,32,114,101,110,100,101,114,101,114,58,32,37,115,10,0,0,0,67,111,117,108,100,110,39,116,32,102,105,110,100,32,114,101,110,100,101,114,32,100,114,105,118,101,114,32,110,97,109,101,100,32,37,115,0,0,0,0,101,118,101,110,116,0,0,0,67,97,110,39,116,32,115,101,116,32,117,112,32,102,117,108,108,115,99,114,101,101,110,32,100,105,115,112,108,97,121,32,109,111,100,101,58,32,37,115,10,0,0,0,0,0,0,0,87,105,110,100,111,119,32,114,101,113,117,101,115,116,101,100,32,115,105,122,101,32,37,100,120,37,100,44,32,103,111,116,32,37,100,120,37,100,10,0,67,111,117,108,100,110,39,116,32,99,114,101,97,116,101,32,119,105,110,100,111,119,58,32,37,115,10,0,0,0,0,0,109,111,100,0,0,0,0,0,37,115,32,37,100,0,0,0,79,117,116,32,111,102,32,109,101,109,111,114,121,33,10,0,66,117,105,108,116,45,105,110,32,114,101,110,100,101,114,32,100,114,105,118,101,114,115,58,10,0,0,0,0,0,0,0,78,111,32,98,117,105,108,116,45,105,110,32,114,101,110,100,101,114,32,100,114,105,118,101,114,115,10,0,0,0,0,0,32,32,32,32,32,32,32,32,65,108,112,104,97,32,77,97,115,107,32,61,32,48,120,37,46,56,120,10,0,0,0,0,32,32,32,32,32,32,32,32,66,108,117,101,32,77,97,115,107,32,32,61,32,48,120,37,46,56,120,10,0,0,0,0,32,32,32,32,32,32,32,32,71,114,101,101,110,32,77,97,115,107,32,61,32,48,120,37,46,56,120,10,0,0,0,0,45,45,118,105,100,101,111,0,32,32,32,32,32,32,32,32,82,101,100,32,77,97,115,107,32,32,32,61,32,48,120,37,46,56,120,10,0,0,0,0,114,101,110,100,101,114,0,0,32,32,32,32,77,111,100,101,32,37,100,58,32,37,100,120,37,100,64,37,100,72,122,44,32,37,100,32,98,105,116,115,45,112,101,114,45,112,105,120,101,108,32,40,37,115,41,10,0,0,0,0,0,0,0,0,32,32,70,117,108,108,115,99,114,101,101,110,32,118,105,100,101,111,32,109,111,100,101,115,58,10,0,0,0,0,0,0,97,100,100,0,0,0,0,0,78,111,32,97,118,97,105,108,97,98,108,101,32,102,117,108,108,115,99,114,101,101,110,32,118,105,100,101,111,32,109,111,100,101,115,10,0,0,0,0,32,32,32,32,32,32,65,108,112,104,97,32,77,97,115,107,32,61,32,48,120,37,46,56,120,10,0,0,0,0,0,0,32,32,32,32,32,32,66,108,117,101,32,77,97,115,107,32,32,61,32,48,120,37,46,56,120,10,0,0,0,0,0,0,32,32,32,32,32,32,71,114,101,101,110,32,77,97,115,107,32,61,32,48,120,37,46,56,120,10,0,0,0,0,0,0,32,32,32,32,32,32,82,101,100,32,77,97,115,107,32,32,32,61,32,48,120,37,46,56,120,10,0,0,0,0,0,0,32,32,67,117,114,114,101,110,116,32,109,111,100,101,58,32,37,100,120,37,100,64,37,100,72,122,44,32,37,100,32,98,105,116,115,45,112,101,114,45,112,105,120,101,108,32,40,37,115,41,10,0,0,0,0,0,66,111,117,110,100,115,58,32,37,100,120,37,100,32,97,116,32,37,100,44,37,100,10,0,68,105,115,112,108,97,121,32,37,100,58,32,37,115,10,0,109,111,100,101,115,0,0,0,78,117,109,98,101,114,32,111,102,32,100,105,115,112,108,97,121,115,58,32,37,100,10,0,86,105,100,101,111,32,100,114,105,118,101,114,58,32,37,115,10,0,0,0,0,0,0,0,98,108,101,110,100,0,0,0,67,111,117,108,100,110,39,116,32,105,110,105,116,105,97,108,105,122,101,32,118,105,100,101,111,32,100,114,105,118,101,114,58,32,37,115,10,0,0,0,10,0,0,0,0,0,0,0,32,37,115,0,0,0,0,0,44,0,0,0,0,0,0,0,66,117,105,108,116,45,105,110,32,118,105,100,101,111,32,100,114,105,118,101,114,115,58,0,78,111,32,98,117,105,108,116,45,105,110,32,118,105,100,101,111,32,100,114,105,118,101,114,115,10,0,0,0,0,0,0,91,45,45,118,105,100,101,111,32,100,114,105,118,101,114,93,32,91,45,45,114,101,110,100,101,114,101,114,32,100,114,105,118,101,114,93,32,91,45,45,103,108,100,101,98,117,103,93,32,91,45,45,105,110,102,111,32,97,108,108,124,118,105,100,101,111,124,109,111,100,101,115,124,114,101,110,100,101,114,124,101,118,101,110,116,93,32,91,45,45,108,111,103,32,97,108,108,124,101,114,114,111,114,124,115,121,115,116,101,109,124,97,117,100,105,111,124,118,105,100,101,111,124,114,101,110,100,101,114,124,105,110,112,117,116,93,32,91,45,45,100,105,115,112,108,97,121,32,78,93,32,91,45,45,102,117,108,108,115,99,114,101,101,110,32,124,32,45,45,102,117,108,108,115,99,114,101,101,110,45,100,101,115,107,116,111,112,32,124,32,45,45,119,105,110,100,111,119,115,32,78,93,32,91,45,45,116,105,116,108,101,32,116,105,116,108,101,93,32,91,45,45,105,99,111,110,32,105,99,111,110,46,98,109,112,93,32,91,45,45,99,101,110,116,101,114,32,124,32,45,45,112,111,115,105,116,105,111,110,32,88,44,89,93,32,91,45,45,103,101,111,109,101,116,114,121,32,87,120,72,93,32,91,45,45,109,105,110,45,103,101,111,109,101,116,114,121,32,87,120,72,93,32,91,45,45,109,97,120,45,103,101,111,109,101,116,114,121,32,87,120,72,93,32,91,45,45,108,111,103,105,99,97,108,32,87,120,72,93,32,91,45,45,115,99,97,108,101,32,78,93,32,91,45,45,100,101,112,116,104,32,78,93,32,91,45,45,114,101,102,114,101,115,104,32,82,93,32,91,45,45,118,115,121,110,99,93,32,91,45,45,110,111,102,114,97,109,101,93,32,91,45,45,114,101,115,105,122,101,93,32,91,45,45,109,105,110,105,109,105,122,101,93,32,91,45,45,109,97,120,105,109,105,122,101,93,32,91,45,45,103,114,97,98,93,32,91,45,45,114,97,116,101,32,78,93,32,91,45,45,102,111,114,109,97,116,32,85,56,124,83,56,124,85,49,54,124,85,49,54,76,69,124,85,49,54,66,69,124,83,49,54,124,83,49,54,76,69,124,83,49,54,66,69,93,32,91,45,45,99,104,97,110,110,101,108,115,32,78,93,32,91,45,45,115,97,109,112,108,101,115,32,78,93,0,0,118,105,100,101,111,0,0,0,91,45,45,114,97,116,101,32,78,93,32,91,45,45,102,111,114,109,97,116,32,85,56,124,83,56,124,85,49,54,124,85,49,54,76,69,124,85,49,54,66,69,124,83,49,54,124,83,49,54,76,69,124,83,49,54,66,69,93,32,91,45,45,99,104,97,110,110,101,108,115,32,78,93,32,91,45,45,115,97,109,112,108,101,115,32,78,93,0,0,0,0,0,0,0,0,91,45,45,118,105,100,101,111,32,100,114,105,118,101,114,93,32,91,45,45,114,101,110,100,101,114,101,114,32,100,114,105,118,101,114,93,32,91,45,45,103,108,100,101,98,117,103,93,32,91,45,45,105,110,102,111,32,97,108,108,124,118,105,100,101,111,124,109,111,100,101,115,124,114,101,110,100,101,114,124,101,118,101,110,116,93,32,91,45,45,108,111,103,32,97,108,108,124,101,114,114,111,114,124,115,121,115,116,101,109,124,97,117,100,105,111,124,118,105,100,101,111,124,114,101,110,100,101,114,124,105,110,112,117,116,93,32,91,45,45,100,105,115,112,108,97,121,32,78,93,32,91,45,45,102,117,108,108,115,99,114,101,101,110,32,124,32,45,45,102,117,108,108,115,99,114,101,101,110,45,100,101,115,107,116,111,112,32,124,32,45,45,119,105,110,100,111,119,115,32,78,93,32,91,45,45,116,105,116,108,101,32,116,105,116,108,101,93,32,91,45,45,105,99,111,110,32,105,99,111,110,46,98,109,112,93,32,91,45,45,99,101,110,116,101,114,32,124,32,45,45,112,111,115,105,116,105,111,110,32,88,44,89,93,32,91,45,45,103,101,111,109,101,116,114,121,32,87,120,72,93,32,91,45,45,109,105,110,45,103,101,111,109,101,116,114,121,32,87,120,72,93,32,91,45,45,109,97,120,45,103,101,111,109,101,116,114,121,32,87,120,72,93,32,91,45,45,108,111,103,105,99,97,108,32,87,120,72,93,32,91,45,45,115,99,97,108,101,32,78,93,32,91,45,45,100,101,112,116,104,32,78,93,32,91,45,45,114,101,102,114,101,115,104,32,82,93,32,91,45,45,118,115,121,110,99,93,32,91,45,45,110,111,102,114,97,109,101,93,32,91,45,45,114,101,115,105,122,101,93,32,91,45,45,109,105,110,105,109,105,122,101,93,32,91,45,45,109,97,120,105,109,105,122,101,93,32,91,45,45,103,114,97,98,93,0,0,0,110,111,110,101,0,0,0,0,45,78,83,68,111,99,117,109,101,110,116,82,101,118,105,115,105,111,110,115,68,101,98,117,103,77,111,100,101,0,0,0,45,45,104,101,108,112,0,0,45,104,0,0,0,0,0,0,45,45,115,97,109,112,108,101,115,0,0,0,0,0,0,0,45,45,99,104,97,110,110,101,108,115,0,0,0,0,0,0,83,49,54,66,69,0,0,0,83,49,54,76,69,0,0,0,83,49,54,0,0,0,0,0,97,108,108,0,0,0,0,0,85,49,54,66,69,0,0,0,85,49,54,76,69,0,0,0,45,45,98,108,101,110,100,0,85,49,54,0,0,0,0,0,83,56,0,0,0,0,0,0,85,56,0,0,0,0,0,0,45,45,102,111,114,109,97,116,0,0,0,0,0,0,0,0,45,45,114,97,116,101,0,0,45,45,103,114,97,98,0,0,45,45,109,97,120,105,109,105,122,101,0,0,0,0,0,0,45,45,109,105,110,105,109,105,122,101,0,0,0,0,0,0,45,45,105,110,102,111,0,0,45,45,114,101,115,105,122,101,0,0,0,0,0,0,0,0,45,45,110,111,102,114,97,109,101,0,0,0,0,0,0,0,105,99,111,110,46,98,109,112,0,0,0,0,0,0,0,0,45,45,118,115,121,110,99,0,45,45,103,108,100,101,98,117,103,0,0,0,0,0,0,0,45,45,114,101,102,114,101,115,104,0,0,0,0,0,0,0,45,45,100,101,112,116,104,0,45,45,115,99,97,108,101,0,45,45,108,111,103,105,99,97,108,0,0,0,0,0,0,0,45,45,109,97,120,45,103,101,111,109,101,116,114,121,0,0,45,45,109,105,110,45,103,101,111,109,101,116,114,121,0,0,45,45,103,101,111,109,101,116,114,121,0,0,0,0,0,0,45,45,112,111,115,105,116,105,111,110,0,0,0,0,0,0,45,45,99,101,110,116,101,114,0,0,0,0,0,0,0,0,67,111,117,108,100,110,39,116,32,99,114,101,97,116,101,32,116,101,120,116,117,114,101,58,32,37,115,10,0,0,0,0,65,99,99,101,108,101,114,97,116,101,100,0,0,0,0,0,45,45,105,99,111,110,0,0,80,114,101,115,101,110,116,86,83,121,110,99,0,0,0,0,48,120,37,56,46,56,120,0,89,86,89,85,0,0,0,0,85,89,86,89,0,0,0,0,89,85,89,50,0,0,0,0,73,89,85,86,0,0,0,0,89,86,49,50,0,0,0,0,65,82,71,66,50,49,48,49,48,49,48,0,0,0,0,0,45,45,116,105,116,108,101,0,66,71,82,65,56,56,56,56,0,0,0,0,0,0,0,0,65,66,71,82,56,56,56,56,0,0,0,0,0,0,0,0,45,45,114,101,110,100,101,114,101,114,0,0,0,0,0,0,82,71,66,65,56,56,56,56,0,0,0,0,0,0,0,0,65,82,71,66,56,56,56,56,0,0,0,0,0,0,0,0,66,71,82,56,56,56,0,0,82,71,66,56,56,56,0,0,66,71,82,50,52,0,0,0,82,71,66,50,52,0,0,0,66,71,82,53,54,53,0,0,82,71,66,53,54,53,0,0,65,66,71,82,49,53,53,53,0,0,0,0,0,0,0,0,65,82,71,66,49,53,53,53,0,0,0,0,0,0,0,0,45,45,119,105,110,100,111,119,115,0,0,0,0,0,0,0,65,66,71,82,52,52,52,52,0,0,0,0,0,0,0,0,65,82,71,66,52,52,52,52,0,0,0,0,0,0,0,0,66,71,82,53,53,53,0,0,82,71,66,53,53,53,0,0,82,71,66,52,52,52,0,0,82,71,66,51,51,50,0,0,73,110,100,101,120,56,0,0,73,110,100,101,120,52,77,83,66,0,0,0,0,0,0,0,73,110,100,101,120,52,76,83,66,0,0,0,0,0,0,0,73,110,100,101,120,49,77,83,66,0,0,0,0,0,0,0,45,45,102,117,108,108,115,99,114,101,101,110,45,100,101,115,107,116,111,112,0,0,0,0,73,110,100,101,120,49,76,83,66,0,0,0,0,0,0,0,85,110,107,110,119,111,110,0,32,32,32,32,77,97,120,32,84,101,120,116,117,114,101,32,83,105,122,101,58,32,37,100,120,37,100,10,0,0,0,0,44,32,0,0,0,0,0,0,32,32,32,32,84,101,120,116,117,114,101,32,102,111,114,109,97,116,115,32,40,37,100,41,58,32,0,0,0,0,0,0,41,10,0,0,0,0,0,0,45,45,102,117,108,108,115,99,114,101,101,110,0,0,0,0,32,124,32,0,0,0,0,0,32,40,0,0,0,0,0,0,32,32,32,32,70,108,97,103,115,58,32,48,120,37,56,46,56,88,0,0,0,0,0,0,32,32,82,101,110,100,101,114,101,114,32,37,115,58,10,0,67,111,117,108,100,110,39,116,32,108,111,97,100,32,37,115,58,32,37,115,10,0,0,0,114,98,0,0,0,0,0,0,85,110,107,110,111,119,110,32,101,118,101,110,116,32,37,100,0,0,0,0,0,0,0,0,85,115,101,114,32,101,118,101,110,116,32,37,100,0,0,0,81,117,105,116,32,114,101,113,117,101,115,116,101,100,0,0,117,112,0,0,0,0,0,0,100,111,119,110,0,0,0,0,45,45,100,105,115,112,108,97,121,0,0,0,0,0,0,0,70,105,110,103,101,114,58,32,37,115,32,116,111,117,99,104,61,37,108,108,100,44,32,102,105,110,103,101,114,61,37,108,108,100,44,32,120,61,37,102,44,32,121,61,37,102,44,32,100,120,61,37,102,44,32,100,121,61,37,102,44,32,112,114,101,115,115,117,114,101,61,37,102,0,0,0,0,0,0,0,67,108,105,112,98,111,97,114,100,32,117,112,100,97,116,101,100,0,0,0,0,0,0,0,74,111,121,115,116,105,99,107,32,37,100,58,32,98,117,116,116,111,110,32,37,100,32,114,101,108,101,97,115,101,100,0,37,50,46,50,102,32,102,114,97,109,101,115,32,112,101,114,32,115,101,99,111,110,100,10,0,0,0,0,0,0,0,0,74,111,121,115,116,105,99,107,32,37,100,58,32,98,117,116,116,111,110,32,37,100,32,112,114,101,115,115,101,100,0,0,85,78,75,78,79,87,78,0,76,69,70,84,85,80,0,0,76,69,70,84,0,0,0,0,76,69,70,84,68,79,87,78,0,0,0,0,0,0,0,0,68,79,87,78,0,0,0,0,82,73,71,72,84,68,79,87,78,0,0,0,0,0,0,0,105,110,112,117,116,0,0,0,82,73,71,72,84,0,0,0,82,73,71,72,84,85,80,0,85,80,0,0,0,0,0,0,79,117,116,32,111,102,32,109,101,109,111,114,121,33,10,0,67,69,78,84,69,82,0,0,74,111,121,115,116,105,99,107,32,37,100,58,32,104,97,116,32,37,100,32,109,111,118,101,100,32,116,111,32,0,0,0,74,111,121,115,116,105,99,107,32,37,100,58,32,98,97,108,108,32,37,100,32,109,111,118,101,100,32,98,121,32,37,100,44,37,100,0,0,0,0,0,77,111,117,115,101,58,32,119,104,101,101,108,32,115,99,114,111,108,108,101,100,32,37,100,32,105,110,32,120,32,97,110,100,32,37,100,32,105,110,32,121,32,105,110,32,119,105,110,100,111,119,32,37,100,0,0,77,111,117,115,101,58,32,98,117,116,116,111,110,32,37,100,32,114,101,108,101,97,115,101,100,32,97,116,32,37,100,44,37,100,32,105,110,32,119,105,110,100,111,119,32,37,100,0,77,111,117,115,101,58,32,98,117,116,116,111,110,32,37,100,32,112,114,101,115,115,101,100,32,97,116,32,37,100,44,37,100,32,105,110,32,119,105,110,100,111,119,32,37,100,0,0,77,111,117,115,101,58,32,109,111,118,101,100,32,116,111,32,37,100,44,37,100,32,40,37,100,44,37,100,41,32,105,110,32,119,105,110,100,111,119,32,37,100,0,0,0,0,0,0,97,117,100,105,111,0,0,0,75,101,121,98,111,97,114,100,58,32,116,101,120,116,32,105,110,112,117,116,32,34,37,115,34,32,105,110,32,119,105,110,100,111,119,32,37,100,0,0,75,101,121,98,111,97,114,100,58,32,107,101,121,32,114,101,108,101,97,115,101,100,32,105,110,32,119,105,110,100,111,119,32,37,100,58,32,115,99,97,110,99,111,100,101,32,48,120,37,48,56,88,32,61,32,37,115,44,32,107,101,121,99,111,100,101,32,48,120,37,48,56,88,32,61,32,37,115,0,0,75,101,121,98,111,97,114,100,58,32,107,101,121,32,112,114,101,115,115,101,100,32,32,105,110,32,119,105,110,100,111,119,32,37,100,58,32,115,99,97,110,99,111,100,101,32,48,120,37,48,56,88,32,61,32,37,115,44,32,107,101,121,99,111,100,101,32,48,120,37,48,56,88,32,61,32,37,115,0,0,85,115,97,103,101,58,32,37,115,32,37,115,32,91,45,45,98,108,101,110,100,32,110,111,110,101,124,98,108,101,110,100,124,97,100,100,124,109,111,100,93,32,91,45,45,99,121,99,108,101,99,111,108,111,114,93,32,91,45,45,99,121,99,108,101,97,108,112,104,97,93,32,91,45,45,105,116,101,114,97,116,105,111,110,115,32,78,93,32,91,110,117,109,95,115,112,114,105,116,101,115,93,32,91,105,99,111,110,46,98,109,112,93,10,0,0,0,0,0,0,87,105,110,100,111,119,32,37,100,32,103,111,116,32,117,110,107,110,111,119,110,32,101,118,101,110,116,32,37,100,0,0,87,105,110,100,111,119,32,37,100,32,99,108,111,115,101,100,0,0,0,0,0,0,0,0,87,105,110,100,111,119,32,37,100,32,108,111,115,116,32,107,101,121,98,111,97,114,100,32,102,111,99,117,115,0,0,0,87,105,110,100,111,119,32,37,100,32,103,97,105,110,101,100,32,107,101,121,98,111,97,114,100,32,102,111,99,117,115,0,77,111,117,115,101,32,108,101,102,116,32,119,105,110,100,111,119,32,37,100,0,0,0,0,77,111,117,115,101,32,101,110,116,101,114,101,100,32,119,105,110,100,111,119,32,37,100,0,87,105,110,100,111,119,32,37,100,32,114,101,115,116,111,114,101,100,0,0,0,0,0,0,115,121,115,116,101,109,0,0,87,105,110,100,111,119,32,37,100,32,109,97,120,105,109,105,122,101,100,0,0,0,0,0,87,105,110,100,111,119,32,37,100,32,109,105,110,105,109,105,122,101,100,0,0,0,0,0,87,105,110,100,111,119,32,37,100,32,99,104,97,110,103,101,100,32,115,105,122,101,32,116,111,32,37,100,120,37,100,0,45,45,99,121,99,108,101,97,108,112,104,97,0,0,0,0,87,105,110,100,111,119,32,37,100,32,114,101,115,105,122,101,100,32,116,111,32,37,100,120,37,100,0,0,0,0,0,0,87,105,110,100,111,119,32,37,100,32,109,111,118,101,100,32,116,111,32,37,100,44,37,100,0,0,0,0,0,0,0,0,87,105,110,100,111,119,32,37,100,32,101,120,112,111,115,101,100,0,0,0,0,0,0,0,87,105,110,100,111,119,32,37,100,32,104,105,100,100,101,110,0,0,0,0,0,0,0,0,87,105,110,100,111,119,32,37,100,32,115,104,111,119,110,0,83,68,76,32,69,86,69,78,84,58,32,0,0,0,0,0,67,111,117,108,100,110,39,116,32,115,97,118,101,32,115,99,114,101,101,110,115,104,111,116,46,98,109,112,58,32,37,115,10,0,0,0,0,0,0,0,101,114,114,111,114,0,0,0,119,98,0,0,0,0,0,0,115,99,114,101,101,110,115,104,111,116,46,98,109,112,0,0,67,111,117,108,100,110,39,116,32,114,101,97,100,32,115,99,114,101,101,110,58,32,37,115,10,0,0,0,0,0,0,0,45,45,99,121,99,108,101,99,111,108,111,114,0,0,0,0,67,111,117,108,100,110,39,116,32,108,111,97,100,32,37,115,58,32,37,115,0,0,0,0,114,98,0,0,0,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
function runPostSets() {
}
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var VFS=undefined;
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path, ext) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var f = PATH.splitPath(path)[2];
        if (ext && f.substr(-1 * ext.length) === ext) {
          f = f.substr(0, f.length - ext.length);
        }
        return f;
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.filter(function(p, index) {
          if (typeof p !== 'string') {
            throw new TypeError('Arguments to path.join must be strings');
          }
          return p;
        }).join('/'));
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },mount:function (mount) {
        return MEMFS.create_node(null, '/', 16384 | 0777, 0);
      },create_node:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            lookup: MEMFS.node_ops.lookup,
            mknod: MEMFS.node_ops.mknod,
            mknod: MEMFS.node_ops.mknod,
            rename: MEMFS.node_ops.rename,
            unlink: MEMFS.node_ops.unlink,
            rmdir: MEMFS.node_ops.rmdir,
            readdir: MEMFS.node_ops.readdir,
            symlink: MEMFS.node_ops.symlink
          };
          node.stream_ops = {
            llseek: MEMFS.stream_ops.llseek
          };
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          };
          node.stream_ops = {
            llseek: MEMFS.stream_ops.llseek,
            read: MEMFS.stream_ops.read,
            write: MEMFS.stream_ops.write,
            allocate: MEMFS.stream_ops.allocate,
            mmap: MEMFS.stream_ops.mmap
          };
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            readlink: MEMFS.node_ops.readlink
          };
          node.stream_ops = {};
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          };
          node.stream_ops = FS.chrdev_stream_ops;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.create_node(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.create_node(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            assert(buffer.length);
            if (canOwn && buffer.buffer === HEAP8.buffer && offset === 0) {
              node.contents = buffer; // this is a subarray of the heap, and we can own it
              node.contentMode = MEMFS.CONTENT_OWNING;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        },handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + new Error().stack;
        return ___setErrNo(e.errno);
      },cwd:function () {
        return FS.currentPath;
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.currentPath, path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            return path ? PATH.join(node.mount.mountpoint, path) : node.mount.mountpoint;
          }
          path = path ? PATH.join(node.name, path) : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          if (node.parent.id === parent.id && node.name === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        var node = {
          id: FS.nextInode++,
          name: name,
          mode: mode,
          node_ops: {},
          stream_ops: {},
          rdev: rdev,
          parent: null,
          mount: null
        };
        if (!parent) {
          parent = node;  // root node sets parent to itself
        }
        node.parent = parent;
        node.mount = parent.mount;
        // compatibility
        var readMode = 292 | 73;
        var writeMode = 146;
        // NOTE we must use Object.defineProperties instead of individual calls to
        // Object.defineProperty in order to make closure compiler happy
        Object.defineProperties(node, {
          read: {
            get: function() { return (node.mode & readMode) === readMode; },
            set: function(val) { val ? node.mode |= readMode : node.mode &= ~readMode; }
          },
          write: {
            get: function() { return (node.mode & writeMode) === writeMode; },
            set: function(val) { val ? node.mode |= writeMode : node.mode &= ~writeMode; }
          },
          isFolder: {
            get: function() { return FS.isDir(node.mode); },
          },
          isDevice: {
            get: function() { return FS.isChrdev(node.mode); },
          },
        });
        FS.hashAddNode(node);
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.currentPath) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        // compatibility
        Object.defineProperties(stream, {
          object: {
            get: function() { return stream.node; },
            set: function(val) { stream.node = val; }
          },
          isRead: {
            get: function() { return (stream.flags & 2097155) !== 1; }
          },
          isWrite: {
            get: function() { return (stream.flags & 2097155) !== 0; }
          },
          isAppend: {
            get: function() { return (stream.flags & 1024); }
          }
        });
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },mount:function (type, opts, mountpoint) {
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
        }
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        path = PATH.normalize(path);
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        try {
          var lookup = FS.lookupPath(path, {
            follow: !(flags & 131072)
          });
          node = lookup.node;
          path = lookup.path;
        } catch (e) {
          // ignore
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // register the stream with the filesystem
        var stream = FS.createStream({
          path: path,
          node: node,
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },staticInit:function () {
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(path, mode | 146);
          var stream = FS.open(path, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(path, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          assert(typeof url == 'string', 'createObjectURL must return a url as a string');
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            assert(typeof url == 'string', 'createObjectURL must return a url as a string');
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};var SDL={defaults:{width:320,height:200,copyOnLock:true},version:null,surfaces:{},canvasPool:[],events:[],fonts:[null],audios:[null],rwops:[null],music:{audio:null,volume:1},mixerFrequency:22050,mixerFormat:32784,mixerNumChannels:2,mixerChunkSize:1024,channelMinimumNumber:0,GL:false,keyboardState:null,keyboardMap:{},canRequestFullscreen:false,isRequestingFullscreen:false,textInput:false,startTime:null,buttonState:0,modState:0,DOMButtons:[0,0,0],DOMEventToSDLEvent:{},keyCodes:{16:1249,17:1248,18:1250,33:1099,34:1102,37:1104,38:1106,39:1103,40:1105,46:127,96:1112,97:1113,98:1114,99:1115,100:1116,101:1117,102:1118,103:1119,104:1120,105:1121,112:1082,113:1083,114:1084,115:1085,116:1086,117:1087,118:1088,119:1089,120:1090,121:1091,122:1092,123:1093,173:45,188:44,190:46,191:47,192:96},scanCodes:{9:43,13:40,27:41,32:44,44:54,46:55,47:56,48:39,49:30,50:31,51:32,52:33,53:34,54:35,55:36,56:37,57:38,92:49,97:4,98:5,99:6,100:7,101:8,102:9,103:10,104:11,105:12,106:13,107:14,108:15,109:16,110:17,111:18,112:19,113:20,114:21,115:22,116:23,117:24,118:25,119:26,120:27,121:28,122:29,305:224,308:226},structs:{Rect:{__size__:16,x:0,y:4,w:8,h:12},PixelFormat:{__size__:36,format:0,palette:4,BitsPerPixel:8,BytesPerPixel:9,padding1:10,padding2:11,Rmask:12,Gmask:16,Bmask:20,Amask:24,Rloss:28,Gloss:29,Bloss:30,Aloss:31,Rshift:32,Gshift:33,Bshift:34,Ashift:35},KeyboardEvent:{__size__:16,type:0,windowID:4,state:8,repeat:9,padding2:10,padding3:11,keysym:12},keysym:{__size__:16,scancode:0,sym:4,mod:8,unicode:12},TextInputEvent:{__size__:264,type:0,windowID:4,text:8},MouseMotionEvent:{__size__:28,type:0,windowID:4,state:8,padding1:9,padding2:10,padding3:11,x:12,y:16,xrel:20,yrel:24},MouseButtonEvent:{__size__:20,type:0,windowID:4,button:8,state:9,padding1:10,padding2:11,x:12,y:16},ResizeEvent:{__size__:12,type:0,w:4,h:8},AudioSpec:{__size__:24,freq:0,format:4,channels:6,silence:7,samples:8,size:12,callback:16,userdata:20},version:{__size__:3,major:0,minor:1,patch:2}},loadRect:function (rect) {
        return {
          x: HEAP32[((rect + SDL.structs.Rect.x)>>2)],
          y: HEAP32[((rect + SDL.structs.Rect.y)>>2)],
          w: HEAP32[((rect + SDL.structs.Rect.w)>>2)],
          h: HEAP32[((rect + SDL.structs.Rect.h)>>2)]
        };
      },loadColorToCSSRGB:function (color) {
        var rgba = HEAP32[((color)>>2)];
        return 'rgb(' + (rgba&255) + ',' + ((rgba >> 8)&255) + ',' + ((rgba >> 16)&255) + ')';
      },loadColorToCSSRGBA:function (color) {
        var rgba = HEAP32[((color)>>2)];
        return 'rgba(' + (rgba&255) + ',' + ((rgba >> 8)&255) + ',' + ((rgba >> 16)&255) + ',' + (((rgba >> 24)&255)/255) + ')';
      },translateColorToCSSRGBA:function (rgba) {
        return 'rgba(' + (rgba&0xff) + ',' + (rgba>>8 & 0xff) + ',' + (rgba>>16 & 0xff) + ',' + (rgba>>>24)/0xff + ')';
      },translateRGBAToCSSRGBA:function (r, g, b, a) {
        return 'rgba(' + (r&0xff) + ',' + (g&0xff) + ',' + (b&0xff) + ',' + (a&0xff)/255 + ')';
      },translateRGBAToColor:function (r, g, b, a) {
        return r | g << 8 | b << 16 | a << 24;
      },makeSurface:function (width, height, flags, usePageCanvas, source, rmask, gmask, bmask, amask) {
        flags = flags || 0;
        var surf = _malloc(15*Runtime.QUANTUM_SIZE);  // SDL_Surface has 15 fields of quantum size
        var buffer = _malloc(width*height*4); // TODO: only allocate when locked the first time
        var pixelFormat = _malloc(18*Runtime.QUANTUM_SIZE);
        flags |= 1; // SDL_HWSURFACE - this tells SDL_MUSTLOCK that this needs to be locked
        //surface with SDL_HWPALETTE flag is 8bpp surface (1 byte)
        var is_SDL_HWPALETTE = flags & 0x00200000;  
        var bpp = is_SDL_HWPALETTE ? 1 : 4;
        HEAP32[((surf+Runtime.QUANTUM_SIZE*0)>>2)]=flags         // SDL_Surface.flags
        HEAP32[((surf+Runtime.QUANTUM_SIZE*1)>>2)]=pixelFormat // SDL_Surface.format TODO
        HEAP32[((surf+Runtime.QUANTUM_SIZE*2)>>2)]=width         // SDL_Surface.w
        HEAP32[((surf+Runtime.QUANTUM_SIZE*3)>>2)]=height        // SDL_Surface.h
        HEAP32[((surf+Runtime.QUANTUM_SIZE*4)>>2)]=width * bpp       // SDL_Surface.pitch, assuming RGBA or indexed for now,
                                                                                 // since that is what ImageData gives us in browsers
        HEAP32[((surf+Runtime.QUANTUM_SIZE*5)>>2)]=buffer      // SDL_Surface.pixels
        HEAP32[((surf+Runtime.QUANTUM_SIZE*6)>>2)]=0      // SDL_Surface.offset
        HEAP32[((surf+Runtime.QUANTUM_SIZE*14)>>2)]=1
        HEAP32[((pixelFormat + SDL.structs.PixelFormat.format)>>2)]=-2042224636 // SDL_PIXELFORMAT_RGBA8888
        HEAP32[((pixelFormat + SDL.structs.PixelFormat.palette)>>2)]=0 // TODO
        HEAP8[((pixelFormat + SDL.structs.PixelFormat.BitsPerPixel)|0)]=bpp * 8
        HEAP8[((pixelFormat + SDL.structs.PixelFormat.BytesPerPixel)|0)]=bpp
        HEAP32[((pixelFormat + SDL.structs.PixelFormat.Rmask)>>2)]=rmask || 0x000000ff
        HEAP32[((pixelFormat + SDL.structs.PixelFormat.Gmask)>>2)]=gmask || 0x0000ff00
        HEAP32[((pixelFormat + SDL.structs.PixelFormat.Bmask)>>2)]=bmask || 0x00ff0000
        HEAP32[((pixelFormat + SDL.structs.PixelFormat.Amask)>>2)]=amask || 0xff000000
        // Decide if we want to use WebGL or not
        var useWebGL = (flags & 0x04000000) != 0; // SDL_OPENGL
        SDL.GL = SDL.GL || useWebGL;
        var canvas;
        if (!usePageCanvas) {
          if (SDL.canvasPool.length > 0) {
            canvas = SDL.canvasPool.pop();
          } else {
            canvas = document.createElement('canvas');
          }
          canvas.width = width;
          canvas.height = height;
        } else {
          canvas = Module['canvas'];
        }
        var ctx = Browser.createContext(canvas, useWebGL, usePageCanvas);
        SDL.surfaces[surf] = {
          width: width,
          height: height,
          canvas: canvas,
          ctx: ctx,
          surf: surf,
          buffer: buffer,
          pixelFormat: pixelFormat,
          alpha: 255,
          flags: flags,
          locked: 0,
          usePageCanvas: usePageCanvas,
          source: source,
          isFlagSet: function(flag) {
            return flags & flag;
          }
        };
        return surf;
      },copyIndexedColorData:function (surfData, rX, rY, rW, rH) {
        // HWPALETTE works with palette
        // setted by SDL_SetColors
        if (!surfData.colors) {
          return;
        }
        var fullWidth  = Module['canvas'].width;
        var fullHeight = Module['canvas'].height;
        var startX  = rX || 0;
        var startY  = rY || 0;
        var endX    = (rW || (fullWidth - startX)) + startX;
        var endY    = (rH || (fullHeight - startY)) + startY;
        var buffer  = surfData.buffer;
        var data    = surfData.image.data;
        var colors  = surfData.colors;
        for (var y = startY; y < endY; ++y) {
          var indexBase = y * fullWidth;
          var colorBase = indexBase * 4;
          for (var x = startX; x < endX; ++x) {
            // HWPALETTE have only 256 colors (not rgba)
            var index = HEAPU8[((buffer + indexBase + x)|0)] * 3;
            var colorOffset = colorBase + x * 4;
            data[colorOffset   ] = colors[index   ];
            data[colorOffset +1] = colors[index +1];
            data[colorOffset +2] = colors[index +2];
            //unused: data[colorOffset +3] = color[index +3];
          }
        }
      },freeSurface:function (surf) {
        var refcountPointer = surf + Runtime.QUANTUM_SIZE * 14;
        var refcount = HEAP32[((refcountPointer)>>2)];
        if (refcount > 1) {
          HEAP32[((refcountPointer)>>2)]=refcount - 1;
          return;
        }
        var info = SDL.surfaces[surf];
        if (!info.usePageCanvas && info.canvas) SDL.canvasPool.push(info.canvas);
        _free(info.buffer);
        _free(info.pixelFormat);
        _free(surf);
        SDL.surfaces[surf] = null;
      },touchX:0,touchY:0,savedKeydown:null,receiveEvent:function (event) {
        switch(event.type) {
          case 'touchstart':
            event.preventDefault();
            var touch = event.touches[0];
            touchX = touch.pageX;
            touchY = touch.pageY;
            var event = {
              type: 'mousedown',
              button: 0,
              pageX: touchX,
              pageY: touchY
            };
            SDL.DOMButtons[0] = 1;
            SDL.events.push(event);
            break;
          case 'touchmove':
            event.preventDefault();
            var touch = event.touches[0];
            touchX = touch.pageX;
            touchY = touch.pageY;
            event = {
              type: 'mousemove',
              button: 0,
              pageX: touchX,
              pageY: touchY
            };
            SDL.events.push(event);
            break;
          case 'touchend':
            event.preventDefault();
            event = {
              type: 'mouseup',
              button: 0,
              pageX: touchX,
              pageY: touchY
            };
            SDL.DOMButtons[0] = 0;
            SDL.events.push(event);
            break;
          case 'mousemove':
            if (Browser.pointerLock) {
              // workaround for firefox bug 750111
              if ('mozMovementX' in event) {
                event['movementX'] = event['mozMovementX'];
                event['movementY'] = event['mozMovementY'];
              }
              // workaround for Firefox bug 782777
              if (event['movementX'] == 0 && event['movementY'] == 0) {
                // ignore a mousemove event if it doesn't contain any movement info
                // (without pointer lock, we infer movement from pageX/pageY, so this check is unnecessary)
                event.preventDefault();
                return;
              }
            }
            // fall through
          case 'keydown': case 'keyup': case 'keypress': case 'mousedown': case 'mouseup': case 'DOMMouseScroll': case 'mousewheel':
            // If we preventDefault on keydown events, the subsequent keypress events
            // won't fire. However, it's fine (and in some cases necessary) to
            // preventDefault for keys that don't generate a character. Otherwise,
            // preventDefault is the right thing to do in general.
            if (event.type !== 'keydown' || (event.keyCode === 8 /* backspace */ || event.keyCode === 9 /* tab */)) {
              event.preventDefault();
            }
            if (event.type == 'DOMMouseScroll' || event.type == 'mousewheel') {
              var button = (event.type == 'DOMMouseScroll' ? event.detail : -event.wheelDelta) > 0 ? 4 : 3;
              var event2 = {
                type: 'mousedown',
                button: button,
                pageX: event.pageX,
                pageY: event.pageY
              };
              SDL.events.push(event2);
              event = {
                type: 'mouseup',
                button: button,
                pageX: event.pageX,
                pageY: event.pageY
              };
            } else if (event.type == 'mousedown') {
              SDL.DOMButtons[event.button] = 1;
            } else if (event.type == 'mouseup') {
              // ignore extra ups, can happen if we leave the canvas while pressing down, then return,
              // since we add a mouseup in that case
              if (!SDL.DOMButtons[event.button]) {
                return;
              }
              SDL.DOMButtons[event.button] = 0;
            }
            // We can only request fullscreen as the result of user input.
            // Due to this limitation, we toggle a boolean on keydown which
            // SDL_WM_ToggleFullScreen will check and subsequently set another
            // flag indicating for us to request fullscreen on the following
            // keyup. This isn't perfect, but it enables SDL_WM_ToggleFullScreen
            // to work as the result of a keypress (which is an extremely
            // common use case).
            if (event.type === 'keydown') {
              SDL.canRequestFullscreen = true;
            } else if (event.type === 'keyup') {
              if (SDL.isRequestingFullscreen) {
                Module['requestFullScreen'](true, true);
                SDL.isRequestingFullscreen = false;
              }
              SDL.canRequestFullscreen = false;
            }
            // SDL expects a unicode character to be passed to its keydown events.
            // Unfortunately, the browser APIs only provide a charCode property on
            // keypress events, so we must backfill in keydown events with their
            // subsequent keypress event's charCode.
            if (event.type === 'keypress' && SDL.savedKeydown) {
              // charCode is read-only
              SDL.savedKeydown.keypressCharCode = event.charCode;
              SDL.savedKeydown = null;
            } else if (event.type === 'keydown') {
              SDL.savedKeydown = event;
            }
            // Don't push keypress events unless SDL_StartTextInput has been called.
            if (event.type !== 'keypress' || SDL.textInput) {
              SDL.events.push(event);
            }
            break;
          case 'mouseout':
            // Un-press all pressed mouse buttons, because we might miss the release outside of the canvas
            for (var i = 0; i < 3; i++) {
              if (SDL.DOMButtons[i]) {
                SDL.events.push({
                  type: 'mouseup',
                  button: i,
                  pageX: event.pageX,
                  pageY: event.pageY
                });
                SDL.DOMButtons[i] = 0;
              }
            }
            event.preventDefault();
            break;
          case 'blur':
          case 'visibilitychange': {
            // Un-press all pressed keys: TODO
            for (var code in SDL.keyboardMap) {
              SDL.events.push({
                type: 'keyup',
                keyCode: SDL.keyboardMap[code]
              });
            }
            event.preventDefault();
            break;
          }
          case 'unload':
            if (Browser.mainLoop.runner) {
              SDL.events.push(event);
              // Force-run a main event loop, since otherwise this event will never be caught!
              Browser.mainLoop.runner();
            }
            return;
          case 'resize':
            SDL.events.push(event);
            // manually triggered resize event doesn't have a preventDefault member
            if (event.preventDefault) {
              event.preventDefault();
            }
            break;
        }
        if (SDL.events.length >= 10000) {
          Module.printErr('SDL event queue full, dropping events');
          SDL.events = SDL.events.slice(0, 10000);
        }
        return;
      },handleEvent:function (event) {
        if (event.handled) return;
        event.handled = true;
        switch (event.type) {
          case 'keydown': case 'keyup': {
            var down = event.type === 'keydown';
            var code = event.keyCode;
            if (code >= 65 && code <= 90) {
              code += 32; // make lowercase for SDL
            } else {
              code = SDL.keyCodes[event.keyCode] || event.keyCode;
            }
            HEAP8[(((SDL.keyboardState)+(code))|0)]=down;
            // TODO: lmeta, rmeta, numlock, capslock, KMOD_MODE, KMOD_RESERVED
            SDL.modState = (HEAP8[(((SDL.keyboardState)+(1248))|0)] ? 0x0040 | 0x0080 : 0) | // KMOD_LCTRL & KMOD_RCTRL
              (HEAP8[(((SDL.keyboardState)+(1249))|0)] ? 0x0001 | 0x0002 : 0) | // KMOD_LSHIFT & KMOD_RSHIFT
              (HEAP8[(((SDL.keyboardState)+(1250))|0)] ? 0x0100 | 0x0200 : 0); // KMOD_LALT & KMOD_RALT
            if (down) {
              SDL.keyboardMap[code] = event.keyCode; // save the DOM input, which we can use to unpress it during blur
            } else {
              delete SDL.keyboardMap[code];
            }
            break;
          }
          case 'mousedown': case 'mouseup':
            if (event.type == 'mousedown') {
              // SDL_BUTTON(x) is defined as (1 << ((x)-1)).  SDL buttons are 1-3,
              // and DOM buttons are 0-2, so this means that the below formula is
              // correct.
              SDL.buttonState |= 1 << event.button;
            } else if (event.type == 'mouseup') {
              SDL.buttonState &= ~(1 << event.button);
            }
            // fall through
          case 'mousemove': {
            Browser.calculateMouseEvent(event);
            break;
          }
        }
      },makeCEvent:function (event, ptr) {
        if (typeof event === 'number') {
          // This is a pointer to a native C event that was SDL_PushEvent'ed
          _memcpy(ptr, event, SDL.structs.KeyboardEvent.__size__); // XXX
          return;
        }
        SDL.handleEvent(event);
        switch (event.type) {
          case 'keydown': case 'keyup': {
            var down = event.type === 'keydown';
            //Module.print('Received key event: ' + event.keyCode);
            var key = event.keyCode;
            if (key >= 65 && key <= 90) {
              key += 32; // make lowercase for SDL
            } else {
              key = SDL.keyCodes[event.keyCode] || event.keyCode;
            }
            var scan;
            if (key >= 1024) {
              scan = key - 1024;
            } else {
              scan = SDL.scanCodes[key] || key;
            }
            HEAP32[(((ptr)+(SDL.structs.KeyboardEvent.type))>>2)]=SDL.DOMEventToSDLEvent[event.type]
            HEAP8[(((ptr)+(SDL.structs.KeyboardEvent.state))|0)]=down ? 1 : 0
            HEAP8[(((ptr)+(SDL.structs.KeyboardEvent.repeat))|0)]=0 // TODO
            HEAP32[(((ptr)+(SDL.structs.KeyboardEvent.keysym + SDL.structs.keysym.scancode))>>2)]=scan
            HEAP32[(((ptr)+(SDL.structs.KeyboardEvent.keysym + SDL.structs.keysym.sym))>>2)]=key
            HEAP16[(((ptr)+(SDL.structs.KeyboardEvent.keysym + SDL.structs.keysym.mod))>>1)]=SDL.modState
            // some non-character keys (e.g. backspace and tab) won't have keypressCharCode set, fill in with the keyCode.
            HEAP32[(((ptr)+(SDL.structs.KeyboardEvent.keysym + SDL.structs.keysym.unicode))>>2)]=event.keypressCharCode || key
            break;
          }
          case 'keypress': {
            HEAP32[(((ptr)+(SDL.structs.TextInputEvent.type))>>2)]=SDL.DOMEventToSDLEvent[event.type]
            // Not filling in windowID for now
            var cStr = intArrayFromString(String.fromCharCode(event.charCode));
            for (var i = 0; i < cStr.length; ++i) {
              HEAP8[(((ptr)+(SDL.structs.TextInputEvent.text + i))|0)]=cStr[i];
            }
            break;
          }
          case 'mousedown': case 'mouseup': case 'mousemove': {
            if (event.type != 'mousemove') {
              var down = event.type === 'mousedown';
              HEAP32[(((ptr)+(SDL.structs.MouseButtonEvent.type))>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP8[(((ptr)+(SDL.structs.MouseButtonEvent.button))|0)]=event.button+1; // DOM buttons are 0-2, SDL 1-3
              HEAP8[(((ptr)+(SDL.structs.MouseButtonEvent.state))|0)]=down ? 1 : 0;
              HEAP32[(((ptr)+(SDL.structs.MouseButtonEvent.x))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(SDL.structs.MouseButtonEvent.y))>>2)]=Browser.mouseY;
            } else {
              HEAP32[(((ptr)+(SDL.structs.MouseMotionEvent.type))>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP8[(((ptr)+(SDL.structs.MouseMotionEvent.state))|0)]=SDL.buttonState;
              HEAP32[(((ptr)+(SDL.structs.MouseMotionEvent.x))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(SDL.structs.MouseMotionEvent.y))>>2)]=Browser.mouseY;
              HEAP32[(((ptr)+(SDL.structs.MouseMotionEvent.xrel))>>2)]=Browser.mouseMovementX;
              HEAP32[(((ptr)+(SDL.structs.MouseMotionEvent.yrel))>>2)]=Browser.mouseMovementY;
            }
            break;
          }
          case 'unload': {
            HEAP32[(((ptr)+(SDL.structs.KeyboardEvent.type))>>2)]=SDL.DOMEventToSDLEvent[event.type];
            break;
          }
          case 'resize': {
            HEAP32[(((ptr)+(SDL.structs.KeyboardEvent.type))>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(SDL.structs.ResizeEvent.w))>>2)]=event.w;
            HEAP32[(((ptr)+(SDL.structs.ResizeEvent.h))>>2)]=event.h;
            break;
          }
          default: throw 'Unhandled SDL event: ' + event.type;
        }
      },estimateTextWidth:function (fontData, text) {
        var h = fontData.size;
        var fontString = h + 'px ' + fontData.name;
        var tempCtx = SDL.ttfContext;
        assert(tempCtx, 'TTF_Init must have been called');
        tempCtx.save();
        tempCtx.font = fontString;
        var ret = tempCtx.measureText(text).width | 0;
        tempCtx.restore();
        return ret;
      },allocateChannels:function (num) { // called from Mix_AllocateChannels and init
        if (SDL.numChannels && SDL.numChannels >= num) return;
        SDL.numChannels = num;
        SDL.channels = [];
        for (var i = 0; i < num; i++) {
          SDL.channels[i] = {
            audio: null,
            volume: 1.0
          };
        }
      },setGetVolume:function (info, volume) {
        if (!info) return 0;
        var ret = info.volume * 128; // MIX_MAX_VOLUME
        if (volume != -1) {
          info.volume = volume / 128;
          if (info.audio) info.audio.volume = info.volume;
        }
        return ret;
      },debugSurface:function (surfData) {
        console.log('dumping surface ' + [surfData.surf, surfData.source, surfData.width, surfData.height]);
        var image = surfData.ctx.getImageData(0, 0, surfData.width, surfData.height);
        var data = image.data;
        var num = Math.min(surfData.width, surfData.height);
        for (var i = 0; i < num; i++) {
          console.log('   diagonal ' + i + ':' + [data[i*surfData.width*4 + i*4 + 0], data[i*surfData.width*4 + i*4 + 1], data[i*surfData.width*4 + i*4 + 2], data[i*surfData.width*4 + i*4 + 3]]);
        }
      }};
  function _SDL_LockSurface(surf) {
      var surfData = SDL.surfaces[surf];
      surfData.locked++;
      if (surfData.locked > 1) return 0;
      // Mark in C/C++-accessible SDL structure
      // SDL_Surface has the following fields: Uint32 flags, SDL_PixelFormat *format; int w, h; Uint16 pitch; void *pixels; ...
      // So we have fields all of the same size, and 5 of them before us.
      // TODO: Use macros like in library.js
      HEAP32[(((surf)+(5*Runtime.QUANTUM_SIZE))>>2)]=surfData.buffer;
      if (surf == SDL.screen && Module.screenIsReadOnly && surfData.image) return 0;
      surfData.image = surfData.ctx.getImageData(0, 0, surfData.width, surfData.height);
      if (surf == SDL.screen) {
        var data = surfData.image.data;
        var num = data.length;
        for (var i = 0; i < num/4; i++) {
          data[i*4+3] = 255; // opacity, as canvases blend alpha
        }
      }
      if (SDL.defaults.copyOnLock) {
        // Copy pixel data to somewhere accessible to 'C/C++'
        if (surfData.isFlagSet(0x00200000 /* SDL_HWPALETTE */)) {
          // If this is neaded then
          // we should compact the data from 32bpp to 8bpp index.
          // I think best way to implement this is use
          // additional colorMap hash (color->index).
          // Something like this:
          //
          // var size = surfData.width * surfData.height;
          // var data = '';
          // for (var i = 0; i<size; i++) {
          //   var color = SDL.translateRGBAToColor(
          //     surfData.image.data[i*4   ], 
          //     surfData.image.data[i*4 +1], 
          //     surfData.image.data[i*4 +2], 
          //     255);
          //   var index = surfData.colorMap[color];
          //   HEAP8[(((surfData.buffer)+(i))|0)]=index;
          // }
          throw 'CopyOnLock is not supported for SDL_LockSurface with SDL_HWPALETTE flag set' + new Error().stack;
        } else {
        HEAPU8.set(surfData.image.data, surfData.buffer);
        }
      }
      return 0;
    }
  function _SDL_FreeRW(rwopsID) {
      SDL.rwops[rwopsID] = null;
      while (SDL.rwops.length > 0 && SDL.rwops[SDL.rwops.length-1] === null) {
        SDL.rwops.pop();
      }
    }function _IMG_Load_RW(rwopsID, freeSrc) {
      try {
        // stb_image integration support
        var cleanup = function() {
          if (rwops && freeSrc) _SDL_FreeRW(rwopsID);
        };
        function addCleanup(func) {
          var old = cleanup;
          cleanup = function() {
            old();
            func();
          }
        }
        function callStbImage(func, params) {
          var x = Module['_malloc'](4);
          var y = Module['_malloc'](4);
          var comp = Module['_malloc'](4);
          addCleanup(function() {
            Module['_free'](x);
            Module['_free'](y);
            Module['_free'](comp);
            if (data) Module['_stbi_image_free'](data);
          });
          var data = Module['_' + func].apply(null, params.concat([x, y, comp, 0]));
          if (!data) return null;
          return {
            rawData: true,
            data: data,
            width: HEAP32[((x)>>2)],
            height: HEAP32[((y)>>2)],
            size: HEAP32[((x)>>2)] * HEAP32[((y)>>2)] * HEAP32[((comp)>>2)],
            bpp: HEAP32[((comp)>>2)]
          };
        }
        var rwops = SDL.rwops[rwopsID];
        if (rwops === undefined) {
          return 0;
        }
        var filename = rwops.filename;
        if (filename === undefined) {
          Runtime.warnOnce('Only file names that have been preloaded are supported for IMG_Load_RW. Consider using STB_IMAGE=1 if you want synchronous image decoding (see settings.js)');
          return 0;
        }
        if (!raw) {
          filename = PATH.resolve(filename);
          var raw = Module["preloadedImages"][filename];
          if (!raw) {
            if (raw === null) Module.printErr('Trying to reuse preloaded image, but freePreloadedMediaOnUse is set!');
            Runtime.warnOnce('Cannot find preloaded image ' + filename);
            Runtime.warnOnce('Cannot find preloaded image ' + filename + '. Consider using STB_IMAGE=1 if you want synchronous image decoding (see settings.js)');
            return 0;
          } else if (Module['freePreloadedMediaOnUse']) {
            Module["preloadedImages"][filename] = null;
          }
        }
        var surf = SDL.makeSurface(raw.width, raw.height, 0, false, 'load:' + filename);
        var surfData = SDL.surfaces[surf];
        surfData.ctx.globalCompositeOperation = "copy";
        if (!raw.rawData) {
          surfData.ctx.drawImage(raw, 0, 0, raw.width, raw.height, 0, 0, raw.width, raw.height);
        } else {
          var imageData = surfData.ctx.getImageData(0, 0, surfData.width, surfData.height);
          if (raw.bpp == 4) {
            imageData.data.set(HEAPU8.subarray((raw.data),(raw.data+raw.size)));
          } else if (raw.bpp == 3) {
            var pixels = raw.size/3;
            var data = imageData.data;
            var sourcePtr = raw.data;
            var destPtr = 0;
            for (var i = 0; i < pixels; i++) {
              data[destPtr++] = HEAPU8[((sourcePtr++)|0)];
              data[destPtr++] = HEAPU8[((sourcePtr++)|0)];
              data[destPtr++] = HEAPU8[((sourcePtr++)|0)];
              data[destPtr++] = 255;
            }
          } else {
            Module.printErr('cannot handle bpp ' + raw.bpp);
            return 0;
          }
          surfData.ctx.putImageData(imageData, 0, 0);
        }
        surfData.ctx.globalCompositeOperation = "source-over";
        // XXX SDL does not specify that loaded images must have available pixel data, in fact
        //     there are cases where you just want to blit them, so you just need the hardware
        //     accelerated version. However, code everywhere seems to assume that the pixels
        //     are in fact available, so we retrieve it here. This does add overhead though.
        _SDL_LockSurface(surf);
        surfData.locked--; // The surface is not actually locked in this hack
        if (SDL.GL) {
          // After getting the pixel data, we can free the canvas and context if we do not need to do 2D canvas blitting
          surfData.canvas = surfData.ctx = null;
        }
        return surf;
      } finally {
        cleanup();
      }
    }var _SDL_LoadBMP_RW=_IMG_Load_RW;
  function _SDL_RWFromFile(_name, mode) {
      var id = SDL.rwops.length; // TODO: recycle ids when they are null
      var name = Pointer_stringify(_name)
      SDL.rwops.push({ filename: name, mimetype: Browser.getMimetype(name) });
      return id;
    }
  var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {} : ['binary'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
          var handleMessage = function(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  function _strlen(ptr) {
      ptr = ptr|0;
      var curr = 0;
      curr = ptr;
      while (HEAP8[(curr)]) {
        curr = (curr + 1)|0;
      }
      return (curr - ptr)|0;
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (flagAlwaysSigned) {
                if (currArg < 0) {
                  prefix = '-' + prefix;
                } else {
                  prefix = '+' + prefix;
                }
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (flagAlwaysSigned && currArg >= 0) {
                  argText = '+' + argText;
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }
  function _SDL_GetError() {
      if (!SDL.errorMessage) {
        SDL.errorMessage = allocate(intArrayFromString("unknown SDL-emscripten error"), 'i8', ALLOC_NORMAL);
      }
      return SDL.errorMessage;
    }
  function _SDL_SetColorKey(surf, flag, key) {
      // SetColorKey assigns one color to be rendered as transparent. I don't
      // think the canvas API allows for anything like this, and iterating through
      // each pixel to replace that color seems prohibitively expensive.
      Runtime.warnOnce('SDL_SetColorKey is a no-op for performance reasons');
      return 0;
    }
;
  function _SDL_FreeSurface(surf) {
      if (surf) SDL.freeSurface(surf);
    }
;
;
;
;
;
;
;
;
;
;
;
;
;
;
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function _SDL_GetTicks() {
      return Math.floor(Date.now() - SDL.startTime);
    }
  function _SDL_PollEvent(ptr) {
      if (SDL.events.length === 0) return 0;
      if (ptr) {
        SDL.makeCEvent(SDL.events.shift(), ptr);
      }
      return 1;
    }
  function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }
;
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module.print('exit(' + status + ') called');
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }
;
;
;
;
;
;
;
;
;
;
;
;
;
  function _SDL_GL_SetAttribute(attr, value) {
      console.log('TODO: SDL_GL_SetAttribute');
    }
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
  function _SDL_GetWindowSize(window, width, height){
      var w = Module['canvas'].width;
      var h = Module['canvas'].height;
      if (width) HEAP32[((width)>>2)]=w;
      if (height) HEAP32[((height)>>2)]=h;
    }
;
;
;
;
;
;
;
;
;
;
;
  function _SDL_OpenAudio(desired, obtained) {
      SDL.allocateChannels(32);
      SDL.audio = {
        freq: HEAPU32[(((desired)+(SDL.structs.AudioSpec.freq))>>2)],
        format: HEAPU16[(((desired)+(SDL.structs.AudioSpec.format))>>1)],
        channels: HEAPU8[(((desired)+(SDL.structs.AudioSpec.channels))|0)],
        samples: HEAPU16[(((desired)+(SDL.structs.AudioSpec.samples))>>1)],
        callback: HEAPU32[(((desired)+(SDL.structs.AudioSpec.callback))>>2)],
        userdata: HEAPU32[(((desired)+(SDL.structs.AudioSpec.userdata))>>2)],
        paused: true,
        timer: null
      };
      if (obtained) {
        HEAP32[(((obtained)+(SDL.structs.AudioSpec.freq))>>2)]=SDL.audio.freq; // no good way for us to know if the browser can really handle this
        HEAP16[(((obtained)+(SDL.structs.AudioSpec.format))>>1)]=33040; // float, signed, 16-bit
        HEAP8[(((obtained)+(SDL.structs.AudioSpec.channels))|0)]=SDL.audio.channels;
        HEAP8[(((obtained)+(SDL.structs.AudioSpec.silence))|0)]=HEAPU8[(((desired)+(SDL.structs.AudioSpec.silence))|0)]; // unclear if browsers can provide this
        HEAP16[(((obtained)+(SDL.structs.AudioSpec.samples))>>1)]=SDL.audio.samples;
        HEAP32[(((obtained)+(SDL.structs.AudioSpec.callback))>>2)]=SDL.audio.callback;
        HEAP32[(((obtained)+(SDL.structs.AudioSpec.userdata))>>2)]=SDL.audio.userdata;
      }
      var totalSamples = SDL.audio.samples*SDL.audio.channels;
      SDL.audio.bufferSize = totalSamples*2; // hardcoded 16-bit audio
      SDL.audio.buffer = _malloc(SDL.audio.bufferSize);
      SDL.audio.caller = function() {
        Runtime.dynCall('viii', SDL.audio.callback, [SDL.audio.userdata, SDL.audio.buffer, SDL.audio.bufferSize]);
        SDL.audio.pushAudio(SDL.audio.buffer, SDL.audio.bufferSize);
      };
      // Mozilla Audio API. TODO: Other audio APIs
      try {
        SDL.audio.mozOutput = new Audio();
        SDL.audio.mozOutput['mozSetup'](SDL.audio.channels, SDL.audio.freq); // use string attributes on mozOutput for closure compiler
        SDL.audio.mozBuffer = new Float32Array(totalSamples);
        SDL.audio.pushAudio = function(ptr, size) {
          var mozBuffer = SDL.audio.mozBuffer;
          for (var i = 0; i < totalSamples; i++) {
            mozBuffer[i] = (HEAP16[(((ptr)+(i*2))>>1)]) / 0x8000; // hardcoded 16-bit audio, signed (TODO: reSign if not ta2?)
          }
          SDL.audio.mozOutput['mozWriteAudio'](mozBuffer);
        }
      } catch(e) {
        SDL.audio = null;
      }
      if (!SDL.audio) return -1;
      return 0;
    }
;
  function _SDL_DestroyWindow(window) {}
;
;
;
;
;
;
;
  function _SDL_GetWindowFlags() {}
;
;
;
;
;
  function _SDL_SetWindowFullscreen(window, fullscreen) {
      if (Browser.isFullScreen) {
        Module['canvas'].cancelFullScreen();
        return 1;
      } else {
        return 0;
      }
    }
;
;
  function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      ret = dest|0;
      if ((dest&3) == (src&3)) {
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[(dest)]=HEAP8[(src)];
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        while ((num|0) >= 4) {
          HEAP32[((dest)>>2)]=HEAP32[((src)>>2)];
          dest = (dest+4)|0;
          src = (src+4)|0;
          num = (num-4)|0;
        }
      }
      while ((num|0) > 0) {
        HEAP8[(dest)]=HEAP8[(src)];
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      return ret|0;
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function _SDL_DestroyRenderer(renderer) {}
;
;
  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
      stop = (ptr + num)|0;
      if ((num|0) >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        value = value & 0xff;
        unaligned = ptr & 3;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
        stop4 = stop & ~3;
        if (unaligned) {
          unaligned = (ptr + 4 - unaligned)|0;
          while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
            HEAP8[(ptr)]=value;
            ptr = (ptr+1)|0;
          }
        }
        while ((ptr|0) < (stop4|0)) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      while ((ptr|0) < (stop|0)) {
        HEAP8[(ptr)]=value;
        ptr = (ptr+1)|0;
      }
    }var _llvm_memset_p0i8_i32=_memset;
  function _SDL_Delay(delay) {
      if (!ENVIRONMENT_IS_WORKER) abort('SDL_Delay called on the main thread! Potential infinite loop, quitting.');
      // horrible busy-wait, but in a worker it at least does not block rendering
      var now = Date.now();
      while (Date.now() - now < delay) {}
    }
;
  function _SDL_CreateRGBSurface(flags, width, height, depth, rmask, gmask, bmask, amask) {
      return SDL.makeSurface(width, height, flags, false, 'CreateRGBSurface', rmask, gmask, bmask, amask);
    }
;
  function _SDL_SaveBMP_RW() { throw 'SDL_SaveBMP_RW: TODO' }
;
  function _SDL_GetKeyName(key) {
      if (!SDL.keyName) {
        SDL.keyName = allocate(intArrayFromString('unknown key'), 'i8', ALLOC_NORMAL);
      }
      return SDL.keyName;
    }
  function _malloc(bytes) {
      /* Over-allocate to make sure it is byte-aligned by 8.
       * This will leak memory, but this is only the dummy
       * implementation (replaced by dlmalloc normally) so
       * not an issue.
       */
      var ptr = Runtime.dynamicAlloc(bytes + 8);
      return (ptr+8) & 0xFFFFFFF8;
    }
  Module["_malloc"] = _malloc;
  function _free() {
  }
  Module["_free"] = _free;
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function() { Browser.getUserMedia() }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var FUNCTION_TABLE = [0, 0];
// EMSCRIPTEN_START_FUNCS
function _LoadSprite($file) {
 var label = 0;
 var tempVarArgs = 0;
 var sp  = STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1) switch(label) {
  case 1: 
   var $1;
   var $2;
   var $i;
   var $temp;
   var $renderer;
   $2=$file;
   var $3=$2;
   var $4=_SDL_RWFromFile($3, ((5216)|0));
   var $5=_IMG_Load_RW($4, 1);
   $temp=$5;
   var $6=$temp;
   var $7=(($6)|(0))==0;
   if ($7) { label = 2; break; } else { label = 3; break; }
  case 2: 
   var $9=HEAP32[((_stderr)>>2)];
   var $10=$2;
   var $11=_SDL_GetError();
   var $12=_fprintf($9, ((5192)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 16)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$10,HEAP32[(((tempVarArgs)+(8))>>2)]=$11,tempVarArgs)); STACKTOP=tempVarArgs;
   $1=-1;
   label = 18; break;
  case 3: 
   var $14=$temp;
   var $15=(($14+8)|0);
   var $16=HEAP32[(($15)>>2)];
   HEAP32[((5248)>>2)]=$16;
   var $17=$temp;
   var $18=(($17+12)|0);
   var $19=HEAP32[(($18)>>2)];
   HEAP32[((5256)>>2)]=$19;
   var $20=$temp;
   var $21=(($20+4)|0);
   var $22=HEAP32[(($21)>>2)];
   var $23=(($22+4)|0);
   var $24=HEAP32[(($23)>>2)];
   var $25=(($24)|(0))!=0;
   if ($25) { label = 4; break; } else { label = 5; break; }
  case 4: 
   var $27=$temp;
   var $28=$temp;
   var $29=(($28+20)|0);
   var $30=HEAP32[(($29)>>2)];
   var $31=HEAP8[($30)];
   var $32=(($31)&(255));
   var $33=_SDL_SetColorKey($27, 1, $32);
   label = 11; break;
  case 5: 
   var $35=$temp;
   var $36=(($35+4)|0);
   var $37=HEAP32[(($36)>>2)];
   var $38=(($37+8)|0);
   var $39=HEAP8[($38)];
   var $40=(($39)&(255));
   if ((($40)|(0))==15) {
    label = 6; break;
   }
   else if ((($40)|(0))==16) {
    label = 7; break;
   }
   else if ((($40)|(0))==24) {
    label = 8; break;
   }
   else if ((($40)|(0))==32) {
    label = 9; break;
   }
   else {
   label = 10; break;
   }
  case 6: 
   var $42=$temp;
   var $43=$temp;
   var $44=(($43+20)|0);
   var $45=HEAP32[(($44)>>2)];
   var $46=$45;
   var $47=HEAP16[(($46)>>1)];
   var $48=(($47)&(65535));
   var $49=$48 & 32767;
   var $50=_SDL_SetColorKey($42, 1, $49);
   label = 10; break;
  case 7: 
   var $52=$temp;
   var $53=$temp;
   var $54=(($53+20)|0);
   var $55=HEAP32[(($54)>>2)];
   var $56=$55;
   var $57=HEAP16[(($56)>>1)];
   var $58=(($57)&(65535));
   var $59=_SDL_SetColorKey($52, 1, $58);
   label = 10; break;
  case 8: 
   var $61=$temp;
   var $62=$temp;
   var $63=(($62+20)|0);
   var $64=HEAP32[(($63)>>2)];
   var $65=$64;
   var $66=HEAP32[(($65)>>2)];
   var $67=$66 & 16777215;
   var $68=_SDL_SetColorKey($61, 1, $67);
   label = 10; break;
  case 9: 
   var $70=$temp;
   var $71=$temp;
   var $72=(($71+20)|0);
   var $73=HEAP32[(($72)>>2)];
   var $74=$73;
   var $75=HEAP32[(($74)>>2)];
   var $76=_SDL_SetColorKey($70, 1, $75);
   label = 10; break;
  case 10: 
   label = 11; break;
  case 11: 
   $i=0;
   label = 12; break;
  case 12: 
   var $80=$i;
   var $81=HEAP32[((5232)>>2)];
   var $82=(($81+84)|0);
   var $83=HEAP32[(($82)>>2)];
   var $84=(($80)|(0)) < (($83)|(0));
   if ($84) { label = 13; break; } else { label = 17; break; }
  case 13: 
   var $86=$i;
   var $87=HEAP32[((5232)>>2)];
   var $88=(($87+104)|0);
   var $89=HEAP32[(($88)>>2)];
   var $90=(($89+($86<<2))|0);
   var $91=HEAP32[(($90)>>2)];
   $renderer=$91;
   var $92=$renderer;
   var $93=$temp;
   var $94=_SDL_CreateTextureFromSurface($92, $93);
   var $95=$i;
   var $96=HEAP32[((5240)>>2)];
   var $97=(($96+($95<<2))|0);
   HEAP32[(($97)>>2)]=$94;
   var $98=$i;
   var $99=HEAP32[((5240)>>2)];
   var $100=(($99+($98<<2))|0);
   var $101=HEAP32[(($100)>>2)];
   var $102=(($101)|(0))!=0;
   if ($102) { label = 15; break; } else { label = 14; break; }
  case 14: 
   var $104=HEAP32[((_stderr)>>2)];
   var $105=_SDL_GetError();
   var $106=_fprintf($104, ((2952)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$105,tempVarArgs)); STACKTOP=tempVarArgs;
   var $107=$temp;
   _SDL_FreeSurface($107);
   $1=-1;
   label = 18; break;
  case 15: 
   var $109=$i;
   var $110=HEAP32[((5240)>>2)];
   var $111=(($110+($109<<2))|0);
   var $112=HEAP32[(($111)>>2)];
   var $113=HEAP32[((24)>>2)];
   var $114=_SDL_SetTextureBlendMode($112, $113);
   label = 16; break;
  case 16: 
   var $116=$i;
   var $117=((($116)+(1))|0);
   $i=$117;
   label = 12; break;
  case 17: 
   var $119=$temp;
   _SDL_FreeSurface($119);
   $1=0;
   label = 18; break;
  case 18: 
   var $121=$1;
   STACKTOP = sp;
   return $121;
  default: assert(0, "bad label: " + label);
 }
}
function _MoveSprites($renderer, $sprite) {
 var label = 0;
 var sp  = STACKTOP; STACKTOP = (STACKTOP + 32)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1) switch(label) {
  case 1: 
   var $1;
   var $2;
   var $i;
   var $viewport=sp;
   var $temp=(sp)+(16);
   var $position;
   var $velocity;
   $1=$renderer;
   $2=$sprite;
   var $3=$1;
   _SDL_RenderGetViewport($3, $viewport);
   var $4=HEAP32[((5312)>>2)];
   var $5=(($4)|(0))!=0;
   if ($5) { label = 2; break; } else { label = 7; break; }
  case 2: 
   var $7=HEAP32[((16)>>2)];
   var $8=HEAP32[((5328)>>2)];
   var $9=((($8)+($7))|0);
   HEAP32[((5328)>>2)]=$9;
   var $10=HEAP32[((5328)>>2)];
   var $11=(($10)|(0)) < 0;
   if ($11) { label = 3; break; } else { label = 4; break; }
  case 3: 
   HEAP32[((5328)>>2)]=0;
   var $13=HEAP32[((16)>>2)];
   var $14=(((-$13))|0);
   HEAP32[((16)>>2)]=$14;
   label = 4; break;
  case 4: 
   var $16=HEAP32[((5328)>>2)];
   var $17=(($16)|(0)) > 255;
   if ($17) { label = 5; break; } else { label = 6; break; }
  case 5: 
   HEAP32[((5328)>>2)]=255;
   var $19=HEAP32[((16)>>2)];
   var $20=(((-$19))|0);
   HEAP32[((16)>>2)]=$20;
   label = 6; break;
  case 6: 
   var $22=$2;
   var $23=HEAP32[((5328)>>2)];
   var $24=(($23) & 255);
   var $25=HEAP32[((5328)>>2)];
   var $26=(($25) & 255);
   var $27=_SDL_SetTextureColorMod($22, -1, $24, $26);
   label = 7; break;
  case 7: 
   var $29=HEAP32[((5320)>>2)];
   var $30=(($29)|(0))!=0;
   if ($30) { label = 8; break; } else { label = 13; break; }
  case 8: 
   var $32=HEAP32[((16)>>2)];
   var $33=HEAP32[((5336)>>2)];
   var $34=((($33)+($32))|0);
   HEAP32[((5336)>>2)]=$34;
   var $35=HEAP32[((5336)>>2)];
   var $36=(($35)|(0)) < 0;
   if ($36) { label = 9; break; } else { label = 10; break; }
  case 9: 
   HEAP32[((5336)>>2)]=0;
   var $38=HEAP32[((16)>>2)];
   var $39=(((-$38))|0);
   HEAP32[((16)>>2)]=$39;
   label = 10; break;
  case 10: 
   var $41=HEAP32[((5336)>>2)];
   var $42=(($41)|(0)) > 255;
   if ($42) { label = 11; break; } else { label = 12; break; }
  case 11: 
   HEAP32[((5336)>>2)]=255;
   var $44=HEAP32[((16)>>2)];
   var $45=(((-$44))|0);
   HEAP32[((16)>>2)]=$45;
   label = 12; break;
  case 12: 
   var $47=$2;
   var $48=HEAP32[((5336)>>2)];
   var $49=(($48) & 255);
   var $50=_SDL_SetTextureAlphaMod($47, $49);
   label = 13; break;
  case 13: 
   var $52=$1;
   var $53=_SDL_SetRenderDrawColor($52, -96, -96, -96, -1);
   var $54=$1;
   var $55=_SDL_RenderClear($54);
   var $56=$1;
   var $57=_SDL_SetRenderDrawColor($56, -1, 0, 0, -1);
   var $58=$1;
   var $59=_SDL_RenderDrawPoint($58, 0, 0);
   var $60=$1;
   var $61=(($viewport+8)|0);
   var $62=HEAP32[(($61)>>2)];
   var $63=((($62)-(1))|0);
   var $64=_SDL_RenderDrawPoint($60, $63, 0);
   var $65=$1;
   var $66=(($viewport+12)|0);
   var $67=HEAP32[(($66)>>2)];
   var $68=((($67)-(1))|0);
   var $69=_SDL_RenderDrawPoint($65, 0, $68);
   var $70=$1;
   var $71=(($viewport+8)|0);
   var $72=HEAP32[(($71)>>2)];
   var $73=((($72)-(1))|0);
   var $74=(($viewport+12)|0);
   var $75=HEAP32[(($74)>>2)];
   var $76=((($75)-(1))|0);
   var $77=_SDL_RenderDrawPoint($70, $73, $76);
   var $78=$1;
   var $79=_SDL_SetRenderDrawColor($78, 0, -1, 0, -1);
   var $80=$1;
   var $81=(($viewport+8)|0);
   var $82=HEAP32[(($81)>>2)];
   var $83=((($82)-(2))|0);
   var $84=_SDL_RenderDrawLine($80, 1, 0, $83, 0);
   var $85=$1;
   var $86=(($viewport+12)|0);
   var $87=HEAP32[(($86)>>2)];
   var $88=((($87)-(1))|0);
   var $89=(($viewport+8)|0);
   var $90=HEAP32[(($89)>>2)];
   var $91=((($90)-(2))|0);
   var $92=(($viewport+12)|0);
   var $93=HEAP32[(($92)>>2)];
   var $94=((($93)-(1))|0);
   var $95=_SDL_RenderDrawLine($85, 1, $88, $91, $94);
   var $96=$1;
   var $97=(($viewport+12)|0);
   var $98=HEAP32[(($97)>>2)];
   var $99=((($98)-(2))|0);
   var $100=_SDL_RenderDrawLine($96, 0, 1, 0, $99);
   var $101=$1;
   var $102=(($viewport+8)|0);
   var $103=HEAP32[(($102)>>2)];
   var $104=((($103)-(1))|0);
   var $105=(($viewport+8)|0);
   var $106=HEAP32[(($105)>>2)];
   var $107=((($106)-(1))|0);
   var $108=(($viewport+12)|0);
   var $109=HEAP32[(($108)>>2)];
   var $110=((($109)-(2))|0);
   var $111=_SDL_RenderDrawLine($101, $104, 1, $107, $110);
   var $112=$1;
   var $113=_SDL_SetRenderDrawColor($112, -1, -1, -1, -1);
   var $114=(($temp)|0);
   HEAP32[(($114)>>2)]=1;
   var $115=(($temp+4)|0);
   HEAP32[(($115)>>2)]=1;
   var $116=HEAP32[((5248)>>2)];
   var $117=(($temp+8)|0);
   HEAP32[(($117)>>2)]=$116;
   var $118=HEAP32[((5256)>>2)];
   var $119=(($temp+12)|0);
   HEAP32[(($119)>>2)]=$118;
   var $120=$1;
   var $121=_SDL_RenderFillRect($120, $temp);
   var $122=$1;
   var $123=$2;
   var $124=_SDL_RenderCopy($122, $123, 0, $temp);
   var $125=(($viewport+8)|0);
   var $126=HEAP32[(($125)>>2)];
   var $127=HEAP32[((5248)>>2)];
   var $128=((($126)-($127))|0);
   var $129=((($128)-(1))|0);
   var $130=(($temp)|0);
   HEAP32[(($130)>>2)]=$129;
   var $131=(($temp+4)|0);
   HEAP32[(($131)>>2)]=1;
   var $132=HEAP32[((5248)>>2)];
   var $133=(($temp+8)|0);
   HEAP32[(($133)>>2)]=$132;
   var $134=HEAP32[((5256)>>2)];
   var $135=(($temp+12)|0);
   HEAP32[(($135)>>2)]=$134;
   var $136=$1;
   var $137=_SDL_RenderFillRect($136, $temp);
   var $138=$1;
   var $139=$2;
   var $140=_SDL_RenderCopy($138, $139, 0, $temp);
   var $141=(($temp)|0);
   HEAP32[(($141)>>2)]=1;
   var $142=(($viewport+12)|0);
   var $143=HEAP32[(($142)>>2)];
   var $144=HEAP32[((5256)>>2)];
   var $145=((($143)-($144))|0);
   var $146=((($145)-(1))|0);
   var $147=(($temp+4)|0);
   HEAP32[(($147)>>2)]=$146;
   var $148=HEAP32[((5248)>>2)];
   var $149=(($temp+8)|0);
   HEAP32[(($149)>>2)]=$148;
   var $150=HEAP32[((5256)>>2)];
   var $151=(($temp+12)|0);
   HEAP32[(($151)>>2)]=$150;
   var $152=$1;
   var $153=_SDL_RenderFillRect($152, $temp);
   var $154=$1;
   var $155=$2;
   var $156=_SDL_RenderCopy($154, $155, 0, $temp);
   var $157=(($viewport+8)|0);
   var $158=HEAP32[(($157)>>2)];
   var $159=HEAP32[((5248)>>2)];
   var $160=((($158)-($159))|0);
   var $161=((($160)-(1))|0);
   var $162=(($temp)|0);
   HEAP32[(($162)>>2)]=$161;
   var $163=(($viewport+12)|0);
   var $164=HEAP32[(($163)>>2)];
   var $165=HEAP32[((5256)>>2)];
   var $166=((($164)-($165))|0);
   var $167=((($166)-(1))|0);
   var $168=(($temp+4)|0);
   HEAP32[(($168)>>2)]=$167;
   var $169=HEAP32[((5248)>>2)];
   var $170=(($temp+8)|0);
   HEAP32[(($170)>>2)]=$169;
   var $171=HEAP32[((5256)>>2)];
   var $172=(($temp+12)|0);
   HEAP32[(($172)>>2)]=$171;
   var $173=$1;
   var $174=_SDL_RenderFillRect($173, $temp);
   var $175=$1;
   var $176=$2;
   var $177=_SDL_RenderCopy($175, $176, 0, $temp);
   var $178=$1;
   var $179=_SDL_SetRenderDrawColor($178, 0, -1, 0, -1);
   var $180=$1;
   var $181=HEAP32[((5248)>>2)];
   var $182=HEAP32[((5256)>>2)];
   var $183=(($viewport+8)|0);
   var $184=HEAP32[(($183)>>2)];
   var $185=HEAP32[((5248)>>2)];
   var $186=((($184)-($185))|0);
   var $187=((($186)-(2))|0);
   var $188=(($viewport+12)|0);
   var $189=HEAP32[(($188)>>2)];
   var $190=HEAP32[((5256)>>2)];
   var $191=((($189)-($190))|0);
   var $192=((($191)-(2))|0);
   var $193=_SDL_RenderDrawLine($180, $181, $182, $187, $192);
   var $194=$1;
   var $195=(($viewport+8)|0);
   var $196=HEAP32[(($195)>>2)];
   var $197=HEAP32[((5248)>>2)];
   var $198=((($196)-($197))|0);
   var $199=((($198)-(2))|0);
   var $200=HEAP32[((5256)>>2)];
   var $201=HEAP32[((5248)>>2)];
   var $202=(($viewport+12)|0);
   var $203=HEAP32[(($202)>>2)];
   var $204=HEAP32[((5256)>>2)];
   var $205=((($203)-($204))|0);
   var $206=((($205)-(2))|0);
   var $207=_SDL_RenderDrawLine($194, $199, $200, $201, $206);
   var $208=HEAP32[((8)>>2)];
   var $209=(($208)|(0))==-1;
   if ($209) { label = 15; break; } else { label = 14; break; }
  case 14: 
   var $211=HEAP32[((8)>>2)];
   var $212=(($211)|(0)) > 0;
   if ($212) { label = 15; break; } else { label = 30; break; }
  case 15: 
   $i=0;
   label = 16; break;
  case 16: 
   var $215=$i;
   var $216=HEAP32[((5296)>>2)];
   var $217=(($215)|(0)) < (($216)|(0));
   if ($217) { label = 17; break; } else { label = 25; break; }
  case 17: 
   var $219=$i;
   var $220=HEAP32[((5288)>>2)];
   var $221=(($220+($219<<4))|0);
   $position=$221;
   var $222=$i;
   var $223=HEAP32[((5224)>>2)];
   var $224=(($223+($222<<4))|0);
   $velocity=$224;
   var $225=$velocity;
   var $226=(($225)|0);
   var $227=HEAP32[(($226)>>2)];
   var $228=$position;
   var $229=(($228)|0);
   var $230=HEAP32[(($229)>>2)];
   var $231=((($230)+($227))|0);
   HEAP32[(($229)>>2)]=$231;
   var $232=$position;
   var $233=(($232)|0);
   var $234=HEAP32[(($233)>>2)];
   var $235=(($234)|(0)) < 0;
   if ($235) { label = 19; break; } else { label = 18; break; }
  case 18: 
   var $237=$position;
   var $238=(($237)|0);
   var $239=HEAP32[(($238)>>2)];
   var $240=(($viewport+8)|0);
   var $241=HEAP32[(($240)>>2)];
   var $242=HEAP32[((5248)>>2)];
   var $243=((($241)-($242))|0);
   var $244=(($239)|(0)) >= (($243)|(0));
   if ($244) { label = 19; break; } else { label = 20; break; }
  case 19: 
   var $246=$velocity;
   var $247=(($246)|0);
   var $248=HEAP32[(($247)>>2)];
   var $249=(((-$248))|0);
   var $250=$velocity;
   var $251=(($250)|0);
   HEAP32[(($251)>>2)]=$249;
   var $252=$velocity;
   var $253=(($252)|0);
   var $254=HEAP32[(($253)>>2)];
   var $255=$position;
   var $256=(($255)|0);
   var $257=HEAP32[(($256)>>2)];
   var $258=((($257)+($254))|0);
   HEAP32[(($256)>>2)]=$258;
   label = 20; break;
  case 20: 
   var $260=$velocity;
   var $261=(($260+4)|0);
   var $262=HEAP32[(($261)>>2)];
   var $263=$position;
   var $264=(($263+4)|0);
   var $265=HEAP32[(($264)>>2)];
   var $266=((($265)+($262))|0);
   HEAP32[(($264)>>2)]=$266;
   var $267=$position;
   var $268=(($267+4)|0);
   var $269=HEAP32[(($268)>>2)];
   var $270=(($269)|(0)) < 0;
   if ($270) { label = 22; break; } else { label = 21; break; }
  case 21: 
   var $272=$position;
   var $273=(($272+4)|0);
   var $274=HEAP32[(($273)>>2)];
   var $275=(($viewport+12)|0);
   var $276=HEAP32[(($275)>>2)];
   var $277=HEAP32[((5256)>>2)];
   var $278=((($276)-($277))|0);
   var $279=(($274)|(0)) >= (($278)|(0));
   if ($279) { label = 22; break; } else { label = 23; break; }
  case 22: 
   var $281=$velocity;
   var $282=(($281+4)|0);
   var $283=HEAP32[(($282)>>2)];
   var $284=(((-$283))|0);
   var $285=$velocity;
   var $286=(($285+4)|0);
   HEAP32[(($286)>>2)]=$284;
   var $287=$velocity;
   var $288=(($287+4)|0);
   var $289=HEAP32[(($288)>>2)];
   var $290=$position;
   var $291=(($290+4)|0);
   var $292=HEAP32[(($291)>>2)];
   var $293=((($292)+($289))|0);
   HEAP32[(($291)>>2)]=$293;
   label = 23; break;
  case 23: 
   label = 24; break;
  case 24: 
   var $296=$i;
   var $297=((($296)+(1))|0);
   $i=$297;
   label = 16; break;
  case 25: 
   var $299=HEAP32[((8)>>2)];
   var $300=(($299)|(0)) > 0;
   if ($300) { label = 26; break; } else { label = 29; break; }
  case 26: 
   var $302=HEAP32[((8)>>2)];
   var $303=((($302)-(1))|0);
   HEAP32[((8)>>2)]=$303;
   var $304=HEAP32[((8)>>2)];
   var $305=(($304)|(0))==0;
   if ($305) { label = 27; break; } else { label = 28; break; }
  case 27: 
   HEAP32[((5320)>>2)]=0;
   HEAP32[((5312)>>2)]=0;
   label = 28; break;
  case 28: 
   label = 29; break;
  case 29: 
   label = 30; break;
  case 30: 
   $i=0;
   label = 31; break;
  case 31: 
   var $311=$i;
   var $312=HEAP32[((5296)>>2)];
   var $313=(($311)|(0)) < (($312)|(0));
   if ($313) { label = 32; break; } else { label = 34; break; }
  case 32: 
   var $315=$i;
   var $316=HEAP32[((5288)>>2)];
   var $317=(($316+($315<<4))|0);
   $position=$317;
   var $318=$1;
   var $319=$2;
   var $320=$position;
   var $321=_SDL_RenderCopy($318, $319, 0, $320);
   label = 33; break;
  case 33: 
   var $323=$i;
   var $324=((($323)+(1))|0);
   $i=$324;
   label = 31; break;
  case 34: 
   var $326=$1;
   _SDL_RenderPresent($326);
   STACKTOP = sp;
   return;
  default: assert(0, "bad label: " + label);
 }
}
function _main($argc, $argv) {
 var label = 0;
 var tempVarArgs = 0;
 var sp  = STACKTOP; STACKTOP = (STACKTOP + 64)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1) switch(label) {
  case 1: 
   var $1;
   var $2;
   var $3;
   var $i;
   var $done=sp;
   var $event=(sp)+(8);
   var $then;
   var $now;
   var $frames;
   var $seed=(sp)+(56);
   var $icon;
   var $consumed;
   var $renderer;
   var $fps;
   $1=0;
   $2=$argc;
   $3=$argv;
   $icon=((2784)|0);
   HEAP32[((5296)>>2)]=100;
   var $4=$3;
   var $5=_SDLTest_CommonCreateState($4, 32);
   HEAP32[((5232)>>2)]=$5;
   var $6=HEAP32[((5232)>>2)];
   var $7=(($6)|(0))!=0;
   if ($7) { label = 3; break; } else { label = 2; break; }
  case 2: 
   $1=1;
   label = 83; break;
  case 3: 
   var $10=HEAP32[((5232)>>2)];
   var $11=(($10+28)|0);
   var $12=HEAP32[(($11)>>2)];
   var $13=$12 | 32;
   HEAP32[(($11)>>2)]=$13;
   $i=1;
   label = 4; break;
  case 4: 
   var $15=$i;
   var $16=$2;
   var $17=(($15)|(0)) < (($16)|(0));
   if ($17) { label = 5; break; } else { label = 45; break; }
  case 5: 
   var $19=HEAP32[((5232)>>2)];
   var $20=$i;
   var $21=_SDLTest_CommonArg($19, $20);
   $consumed=$21;
   var $22=$consumed;
   var $23=(($22)|(0))==0;
   if ($23) { label = 6; break; } else { label = 42; break; }
  case 6: 
   $consumed=-1;
   var $25=$i;
   var $26=$3;
   var $27=(($26+($25<<2))|0);
   var $28=HEAP32[(($27)>>2)];
   var $29=_SDL_strcasecmp($28, ((2648)|0));
   var $30=(($29)|(0))==0;
   if ($30) { label = 7; break; } else { label = 21; break; }
  case 7: 
   var $32=$i;
   var $33=((($32)+(1))|0);
   var $34=$3;
   var $35=(($34+($33<<2))|0);
   var $36=HEAP32[(($35)>>2)];
   var $37=(($36)|(0))!=0;
   if ($37) { label = 8; break; } else { label = 20; break; }
  case 8: 
   var $39=$i;
   var $40=((($39)+(1))|0);
   var $41=$3;
   var $42=(($41+($40<<2))|0);
   var $43=HEAP32[(($42)>>2)];
   var $44=_SDL_strcasecmp($43, ((2512)|0));
   var $45=(($44)|(0))==0;
   if ($45) { label = 9; break; } else { label = 10; break; }
  case 9: 
   HEAP32[((24)>>2)]=0;
   $consumed=2;
   label = 19; break;
  case 10: 
   var $48=$i;
   var $49=((($48)+(1))|0);
   var $50=$3;
   var $51=(($50+($49<<2))|0);
   var $52=HEAP32[(($51)>>2)];
   var $53=_SDL_strcasecmp($52, ((1296)|0));
   var $54=(($53)|(0))==0;
   if ($54) { label = 11; break; } else { label = 12; break; }
  case 11: 
   HEAP32[((24)>>2)]=1;
   $consumed=2;
   label = 18; break;
  case 12: 
   var $57=$i;
   var $58=((($57)+(1))|0);
   var $59=$3;
   var $60=(($59+($58<<2))|0);
   var $61=HEAP32[(($60)>>2)];
   var $62=_SDL_strcasecmp($61, ((968)|0));
   var $63=(($62)|(0))==0;
   if ($63) { label = 13; break; } else { label = 14; break; }
  case 13: 
   HEAP32[((24)>>2)]=2;
   $consumed=2;
   label = 17; break;
  case 14: 
   var $66=$i;
   var $67=((($66)+(1))|0);
   var $68=$3;
   var $69=(($68+($67<<2))|0);
   var $70=HEAP32[(($69)>>2)];
   var $71=_SDL_strcasecmp($70, ((640)|0));
   var $72=(($71)|(0))==0;
   if ($72) { label = 15; break; } else { label = 16; break; }
  case 15: 
   HEAP32[((24)>>2)]=4;
   $consumed=2;
   label = 16; break;
  case 16: 
   label = 17; break;
  case 17: 
   label = 18; break;
  case 18: 
   label = 19; break;
  case 19: 
   label = 20; break;
  case 20: 
   label = 41; break;
  case 21: 
   var $80=$i;
   var $81=$3;
   var $82=(($81+($80<<2))|0);
   var $83=HEAP32[(($82)>>2)];
   var $84=_SDL_strcasecmp($83, ((280)|0));
   var $85=(($84)|(0))==0;
   if ($85) { label = 22; break; } else { label = 27; break; }
  case 22: 
   var $87=$i;
   var $88=((($87)+(1))|0);
   var $89=$3;
   var $90=(($89+($88<<2))|0);
   var $91=HEAP32[(($90)>>2)];
   var $92=(($91)|(0))!=0;
   if ($92) { label = 23; break; } else { label = 26; break; }
  case 23: 
   var $94=$i;
   var $95=((($94)+(1))|0);
   var $96=$3;
   var $97=(($96+($95<<2))|0);
   var $98=HEAP32[(($97)>>2)];
   var $99=_SDL_strtol($98, 0, 0);
   HEAP32[((8)>>2)]=$99;
   var $100=HEAP32[((8)>>2)];
   var $101=(($100)|(0)) < -1;
   if ($101) { label = 24; break; } else { label = 25; break; }
  case 24: 
   HEAP32[((8)>>2)]=-1;
   label = 25; break;
  case 25: 
   $consumed=2;
   label = 26; break;
  case 26: 
   label = 40; break;
  case 27: 
   var $106=$i;
   var $107=$3;
   var $108=(($107+($106<<2))|0);
   var $109=HEAP32[(($108)>>2)];
   var $110=_SDL_strcasecmp($109, ((5176)|0));
   var $111=(($110)|(0))==0;
   if ($111) { label = 28; break; } else { label = 29; break; }
  case 28: 
   HEAP32[((5312)>>2)]=1;
   $consumed=1;
   label = 39; break;
  case 29: 
   var $114=$i;
   var $115=$3;
   var $116=(($115+($114<<2))|0);
   var $117=HEAP32[(($116)>>2)];
   var $118=_SDL_strcasecmp($117, ((4912)|0));
   var $119=(($118)|(0))==0;
   if ($119) { label = 30; break; } else { label = 31; break; }
  case 30: 
   HEAP32[((5320)>>2)]=1;
   $consumed=1;
   label = 38; break;
  case 31: 
   var $122=$i;
   var $123=$3;
   var $124=(($123+($122<<2))|0);
   var $125=HEAP32[(($124)>>2)];
   var $126=HEAP8[($125)];
   var $127=(($126 << 24) >> 24);
   var $128=(($127)|(0)) >= 48;
   if ($128) { label = 32; break; } else { label = 34; break; }
  case 32: 
   var $130=$i;
   var $131=$3;
   var $132=(($131+($130<<2))|0);
   var $133=HEAP32[(($132)>>2)];
   var $134=HEAP8[($133)];
   var $135=(($134 << 24) >> 24);
   var $136=(($135)|(0)) <= 57;
   if ($136) { label = 33; break; } else { label = 34; break; }
  case 33: 
   var $138=$i;
   var $139=$3;
   var $140=(($139+($138<<2))|0);
   var $141=HEAP32[(($140)>>2)];
   var $142=_SDL_strtol($141, 0, 0);
   HEAP32[((5296)>>2)]=$142;
   $consumed=1;
   label = 37; break;
  case 34: 
   var $144=$i;
   var $145=$3;
   var $146=(($145+($144<<2))|0);
   var $147=HEAP32[(($146)>>2)];
   var $148=(($147)|0);
   var $149=HEAP8[($148)];
   var $150=(($149 << 24) >> 24);
   var $151=(($150)|(0))!=45;
   if ($151) { label = 35; break; } else { label = 36; break; }
  case 35: 
   var $153=$i;
   var $154=$3;
   var $155=(($154+($153<<2))|0);
   var $156=HEAP32[(($155)>>2)];
   $icon=$156;
   $consumed=1;
   label = 36; break;
  case 36: 
   label = 37; break;
  case 37: 
   label = 38; break;
  case 38: 
   label = 39; break;
  case 39: 
   label = 40; break;
  case 40: 
   label = 41; break;
  case 41: 
   label = 42; break;
  case 42: 
   var $164=$consumed;
   var $165=(($164)|(0)) < 0;
   if ($165) { label = 43; break; } else { label = 44; break; }
  case 43: 
   var $167=HEAP32[((_stderr)>>2)];
   var $168=$3;
   var $169=(($168)|0);
   var $170=HEAP32[(($169)>>2)];
   var $171=HEAP32[((5232)>>2)];
   var $172=_SDLTest_CommonUsage($171);
   var $173=_fprintf($167, ((4512)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 16)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$170,HEAP32[(((tempVarArgs)+(8))>>2)]=$172,tempVarArgs)); STACKTOP=tempVarArgs;
   _quit(1);
   label = 44; break;
  case 44: 
   var $175=$consumed;
   var $176=$i;
   var $177=((($176)+($175))|0);
   $i=$177;
   label = 4; break;
  case 45: 
   var $179=HEAP32[((5232)>>2)];
   var $180=_SDLTest_CommonInit($179);
   var $181=(($180)|(0))!=0;
   if ($181) { label = 47; break; } else { label = 46; break; }
  case 46: 
   _quit(2);
   label = 47; break;
  case 47: 
   var $184=HEAP32[((5232)>>2)];
   var $185=(($184+84)|0);
   var $186=HEAP32[(($185)>>2)];
   var $187=($186<<2);
   var $188=_SDL_malloc($187);
   var $189=$188;
   HEAP32[((5240)>>2)]=$189;
   var $190=HEAP32[((5240)>>2)];
   var $191=(($190)|(0))!=0;
   if ($191) { label = 49; break; } else { label = 48; break; }
  case 48: 
   var $193=HEAP32[((_stderr)>>2)];
   var $194=_fprintf($193, ((4008)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   _quit(2);
   label = 49; break;
  case 49: 
   $i=0;
   label = 50; break;
  case 50: 
   var $197=$i;
   var $198=HEAP32[((5232)>>2)];
   var $199=(($198+84)|0);
   var $200=HEAP32[(($199)>>2)];
   var $201=(($197)|(0)) < (($200)|(0));
   if ($201) { label = 51; break; } else { label = 53; break; }
  case 51: 
   var $203=$i;
   var $204=HEAP32[((5232)>>2)];
   var $205=(($204+104)|0);
   var $206=HEAP32[(($205)>>2)];
   var $207=(($206+($203<<2))|0);
   var $208=HEAP32[(($207)>>2)];
   $renderer=$208;
   var $209=$renderer;
   var $210=_SDL_SetRenderDrawColor($209, -96, -96, -96, -1);
   var $211=$renderer;
   var $212=_SDL_RenderClear($211);
   label = 52; break;
  case 52: 
   var $214=$i;
   var $215=((($214)+(1))|0);
   $i=$215;
   label = 50; break;
  case 53: 
   var $217=$icon;
   var $218=_LoadSprite($217);
   var $219=(($218)|(0)) < 0;
   if ($219) { label = 54; break; } else { label = 55; break; }
  case 54: 
   _quit(2);
   label = 55; break;
  case 55: 
   var $222=HEAP32[((5296)>>2)];
   var $223=($222<<4);
   var $224=_SDL_malloc($223);
   var $225=$224;
   HEAP32[((5288)>>2)]=$225;
   var $226=HEAP32[((5296)>>2)];
   var $227=($226<<4);
   var $228=_SDL_malloc($227);
   var $229=$228;
   HEAP32[((5224)>>2)]=$229;
   var $230=HEAP32[((5288)>>2)];
   var $231=(($230)|(0))!=0;
   if ($231) { label = 56; break; } else { label = 57; break; }
  case 56: 
   var $233=HEAP32[((5224)>>2)];
   var $234=(($233)|(0))!=0;
   if ($234) { label = 58; break; } else { label = 57; break; }
  case 57: 
   var $236=HEAP32[((_stderr)>>2)];
   var $237=_fprintf($236, ((4008)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   _quit(2);
   label = 58; break;
  case 58: 
   var $239=HEAP32[((8)>>2)];
   var $240=(($239)|(0)) >= 0;
   if ($240) { label = 59; break; } else { label = 60; break; }
  case 59: 
   var $242=HEAP32[((8)>>2)];
   var $243$0=$242;
   var $243$1=((($242)|(0)) < 0 ? -1 : 0);
   var $st$0$0=(($seed)|0);
   HEAP32[(($st$0$0)>>2)]=$243$0;
   var $st$1$1=(($seed+4)|0);
   HEAP32[(($st$1$1)>>2)]=$243$1;
   label = 61; break;
  case 60: 
   var $245=_time(0);
   var $246$0=$245;
   var $246$1=((($245)|(0)) < 0 ? -1 : 0);
   var $st$2$0=(($seed)|0);
   HEAP32[(($st$2$0)>>2)]=$246$0;
   var $st$3$1=(($seed+4)|0);
   HEAP32[(($st$3$1)>>2)]=$246$1;
   label = 61; break;
  case 61: 
   var $ld$4$0=(($seed)|0);
   var $248$0=HEAP32[(($ld$4$0)>>2)];
   var $ld$5$1=(($seed+4)|0);
   var $248$1=HEAP32[(($ld$5$1)>>2)];
   _SDLTest_FuzzerInit($248$0, $248$1);
   $i=0;
   label = 62; break;
  case 62: 
   var $250=$i;
   var $251=HEAP32[((5296)>>2)];
   var $252=(($250)|(0)) < (($251)|(0));
   if ($252) { label = 63; break; } else { label = 70; break; }
  case 63: 
   var $254=HEAP32[((5232)>>2)];
   var $255=(($254+40)|0);
   var $256=HEAP32[(($255)>>2)];
   var $257=HEAP32[((5248)>>2)];
   var $258=((($256)-($257))|0);
   var $259=_SDLTest_RandomIntegerInRange(0, $258);
   var $260=$i;
   var $261=HEAP32[((5288)>>2)];
   var $262=(($261+($260<<4))|0);
   var $263=(($262)|0);
   HEAP32[(($263)>>2)]=$259;
   var $264=HEAP32[((5232)>>2)];
   var $265=(($264+44)|0);
   var $266=HEAP32[(($265)>>2)];
   var $267=HEAP32[((5256)>>2)];
   var $268=((($266)-($267))|0);
   var $269=_SDLTest_RandomIntegerInRange(0, $268);
   var $270=$i;
   var $271=HEAP32[((5288)>>2)];
   var $272=(($271+($270<<4))|0);
   var $273=(($272+4)|0);
   HEAP32[(($273)>>2)]=$269;
   var $274=HEAP32[((5248)>>2)];
   var $275=$i;
   var $276=HEAP32[((5288)>>2)];
   var $277=(($276+($275<<4))|0);
   var $278=(($277+8)|0);
   HEAP32[(($278)>>2)]=$274;
   var $279=HEAP32[((5256)>>2)];
   var $280=$i;
   var $281=HEAP32[((5288)>>2)];
   var $282=(($281+($280<<4))|0);
   var $283=(($282+12)|0);
   HEAP32[(($283)>>2)]=$279;
   var $284=$i;
   var $285=HEAP32[((5224)>>2)];
   var $286=(($285+($284<<4))|0);
   var $287=(($286)|0);
   HEAP32[(($287)>>2)]=0;
   var $288=$i;
   var $289=HEAP32[((5224)>>2)];
   var $290=(($289+($288<<4))|0);
   var $291=(($290+4)|0);
   HEAP32[(($291)>>2)]=0;
   label = 64; break;
  case 64: 
   var $293=$i;
   var $294=HEAP32[((5224)>>2)];
   var $295=(($294+($293<<4))|0);
   var $296=(($295)|0);
   var $297=HEAP32[(($296)>>2)];
   var $298=(($297)|(0))!=0;
   if ($298) { var $308 = 0;label = 66; break; } else { label = 65; break; }
  case 65: 
   var $300=$i;
   var $301=HEAP32[((5224)>>2)];
   var $302=(($301+($300<<4))|0);
   var $303=(($302+4)|0);
   var $304=HEAP32[(($303)>>2)];
   var $305=(($304)|(0))!=0;
   var $306=$305 ^ 1;
   var $308 = $306;label = 66; break;
  case 66: 
   var $308;
   if ($308) { label = 67; break; } else { label = 68; break; }
  case 67: 
   var $310=_SDLTest_RandomIntegerInRange(-1, 1);
   var $311=$i;
   var $312=HEAP32[((5224)>>2)];
   var $313=(($312+($311<<4))|0);
   var $314=(($313)|0);
   HEAP32[(($314)>>2)]=$310;
   var $315=_SDLTest_RandomIntegerInRange(-1, 1);
   var $316=$i;
   var $317=HEAP32[((5224)>>2)];
   var $318=(($317+($316<<4))|0);
   var $319=(($318+4)|0);
   HEAP32[(($319)>>2)]=$315;
   label = 64; break;
  case 68: 
   label = 69; break;
  case 69: 
   var $322=$i;
   var $323=((($322)+(1))|0);
   $i=$323;
   label = 62; break;
  case 70: 
   $frames=0;
   var $325=_SDL_GetTicks();
   $then=$325;
   HEAP32[(($done)>>2)]=0;
   label = 71; break;
  case 71: 
   var $327=HEAP32[(($done)>>2)];
   var $328=(($327)|(0))!=0;
   var $329=$328 ^ 1;
   if ($329) { label = 72; break; } else { label = 80; break; }
  case 72: 
   var $331=$frames;
   var $332=((($331)+(1))|0);
   $frames=$332;
   label = 73; break;
  case 73: 
   var $334=_SDL_PollEvent($event);
   var $335=(($334)|(0))!=0;
   if ($335) { label = 74; break; } else { label = 75; break; }
  case 74: 
   var $337=HEAP32[((5232)>>2)];
   _SDLTest_CommonEvent($337, $event, $done);
   label = 73; break;
  case 75: 
   $i=0;
   label = 76; break;
  case 76: 
   var $340=$i;
   var $341=HEAP32[((5232)>>2)];
   var $342=(($341+84)|0);
   var $343=HEAP32[(($342)>>2)];
   var $344=(($340)|(0)) < (($343)|(0));
   if ($344) { label = 77; break; } else { label = 79; break; }
  case 77: 
   var $346=$i;
   var $347=HEAP32[((5232)>>2)];
   var $348=(($347+104)|0);
   var $349=HEAP32[(($348)>>2)];
   var $350=(($349+($346<<2))|0);
   var $351=HEAP32[(($350)>>2)];
   var $352=$i;
   var $353=HEAP32[((5240)>>2)];
   var $354=(($353+($352<<2))|0);
   var $355=HEAP32[(($354)>>2)];
   _MoveSprites($351, $355);
   label = 78; break;
  case 78: 
   var $357=$i;
   var $358=((($357)+(1))|0);
   $i=$358;
   label = 76; break;
  case 79: 
   label = 71; break;
  case 80: 
   var $361=_SDL_GetTicks();
   $now=$361;
   var $362=$now;
   var $363=$then;
   var $364=(($362)>>>(0)) > (($363)>>>(0));
   if ($364) { label = 81; break; } else { label = 82; break; }
  case 81: 
   var $366=$frames;
   var $367=(($366)>>>(0));
   var $368=($367)*(1000);
   var $369=$now;
   var $370=$then;
   var $371=((($369)-($370))|0);
   var $372=(($371)>>>(0));
   var $373=($368)/($372);
   $fps=$373;
   var $374=$fps;
   var $375=_printf(((3848)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAPF64[((tempVarArgs)>>3)]=$374,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 82; break;
  case 82: 
   _quit(0);
   $1=0;
   label = 83; break;
  case 83: 
   var $378=$1;
   STACKTOP = sp;
   return $378;
  default: assert(0, "bad label: " + label);
 }
}
Module["_main"] = _main;
function _quit($rc) {
 var label = 0;
 label = 1; 
 while(1) switch(label) {
  case 1: 
   var $1;
   $1=$rc;
   var $2=HEAP32[((5240)>>2)];
   var $3=(($2)|(0))!=0;
   if ($3) { label = 2; break; } else { label = 3; break; }
  case 2: 
   var $5=HEAP32[((5240)>>2)];
   var $6=$5;
   _SDL_free($6);
   label = 3; break;
  case 3: 
   var $8=HEAP32[((5288)>>2)];
   var $9=(($8)|(0))!=0;
   if ($9) { label = 4; break; } else { label = 5; break; }
  case 4: 
   var $11=HEAP32[((5288)>>2)];
   var $12=$11;
   _SDL_free($12);
   label = 5; break;
  case 5: 
   var $14=HEAP32[((5224)>>2)];
   var $15=(($14)|(0))!=0;
   if ($15) { label = 6; break; } else { label = 7; break; }
  case 6: 
   var $17=HEAP32[((5224)>>2)];
   var $18=$17;
   _SDL_free($18);
   label = 7; break;
  case 7: 
   var $20=HEAP32[((5232)>>2)];
   _SDLTest_CommonQuit($20);
   var $21=$1;
   _exit($21);
   throw "Reached an unreachable!";
   return;
  default: assert(0, "bad label: " + label);
 }
}
function _SDLTest_CommonCreateState($argv, $flags) {
 var label = 0;
 label = 1; 
 while(1) switch(label) {
  case 1: 
   var $1;
   var $2;
   var $3;
   var $state;
   $2=$argv;
   $3=$flags;
   var $4=_SDL_calloc(1, 216);
   var $5=$4;
   $state=$5;
   var $6=$state;
   var $7=(($6)|(0))!=0;
   if ($7) { label = 3; break; } else { label = 2; break; }
  case 2: 
   var $9=_SDL_Error(0);
   $1=0;
   label = 4; break;
  case 3: 
   var $11=$2;
   var $12=$state;
   var $13=(($12)|0);
   HEAP32[(($13)>>2)]=$11;
   var $14=$3;
   var $15=$state;
   var $16=(($15+4)|0);
   HEAP32[(($16)>>2)]=$14;
   var $17=$2;
   var $18=(($17)|0);
   var $19=HEAP32[(($18)>>2)];
   var $20=$state;
   var $21=(($20+20)|0);
   HEAP32[(($21)>>2)]=$19;
   var $22=$state;
   var $23=(($22+28)|0);
   HEAP32[(($23)>>2)]=0;
   var $24=$state;
   var $25=(($24+32)|0);
   HEAP32[(($25)>>2)]=536805376;
   var $26=$state;
   var $27=(($26+36)|0);
   HEAP32[(($27)>>2)]=536805376;
   var $28=$state;
   var $29=(($28+40)|0);
   HEAP32[(($29)>>2)]=640;
   var $30=$state;
   var $31=(($30+44)|0);
   HEAP32[(($31)>>2)]=480;
   var $32=$state;
   var $33=(($32+84)|0);
   HEAP32[(($33)>>2)]=1;
   var $34=$state;
   var $35=(($34+112)|0);
   var $36=(($35)|0);
   HEAP32[(($36)>>2)]=22050;
   var $37=$state;
   var $38=(($37+112)|0);
   var $39=(($38+4)|0);
   HEAP16[(($39)>>1)]=-32752;
   var $40=$state;
   var $41=(($40+112)|0);
   var $42=(($41+6)|0);
   HEAP8[($42)]=2;
   var $43=$state;
   var $44=(($43+112)|0);
   var $45=(($44+8)|0);
   HEAP16[(($45)>>1)]=2048;
   var $46=$state;
   var $47=(($46+136)|0);
   HEAP32[(($47)>>2)]=3;
   var $48=$state;
   var $49=(($48+140)|0);
   HEAP32[(($49)>>2)]=3;
   var $50=$state;
   var $51=(($50+144)|0);
   HEAP32[(($51)>>2)]=2;
   var $52=$state;
   var $53=(($52+148)|0);
   HEAP32[(($53)>>2)]=0;
   var $54=$state;
   var $55=(($54+152)|0);
   HEAP32[(($55)>>2)]=0;
   var $56=$state;
   var $57=(($56+156)|0);
   HEAP32[(($57)>>2)]=16;
   var $58=$state;
   var $59=(($58+160)|0);
   HEAP32[(($59)>>2)]=0;
   var $60=$state;
   var $61=(($60+164)|0);
   HEAP32[(($61)>>2)]=1;
   var $62=$state;
   var $63=(($62+168)|0);
   HEAP32[(($63)>>2)]=0;
   var $64=$state;
   var $65=(($64+172)|0);
   HEAP32[(($65)>>2)]=0;
   var $66=$state;
   var $67=(($66+176)|0);
   HEAP32[(($67)>>2)]=0;
   var $68=$state;
   var $69=(($68+180)|0);
   HEAP32[(($69)>>2)]=0;
   var $70=$state;
   var $71=(($70+184)|0);
   HEAP32[(($71)>>2)]=0;
   var $72=$state;
   var $73=(($72+188)|0);
   HEAP32[(($73)>>2)]=0;
   var $74=$state;
   var $75=(($74+192)|0);
   HEAP32[(($75)>>2)]=0;
   var $76=$state;
   var $77=(($76+196)|0);
   HEAP32[(($77)>>2)]=1;
   var $78=$state;
   var $79=(($78+200)|0);
   HEAP32[(($79)>>2)]=-1;
   var $80=$state;
   var $81=(($80+212)|0);
   HEAP32[(($81)>>2)]=0;
   var $82=$state;
   $1=$82;
   label = 4; break;
  case 4: 
   var $84=$1;
   return $84;
  default: assert(0, "bad label: " + label);
 }
}
function _SDLTest_CommonArg($state, $index) {
 var label = 0;
 label = 1; 
 while(1) switch(label) {
  case 1: 
   var $1;
   var $2;
   var $3;
   var $argv;
   var $x;
   var $y;
   var $w;
   var $h;
   var $w1;
   var $h2;
   var $w3;
   var $h4;
   var $w5;
   var $h6;
   $2=$state;
   $3=$index;
   var $4=$2;
   var $5=(($4)|0);
   var $6=HEAP32[(($5)>>2)];
   $argv=$6;
   var $7=$3;
   var $8=$argv;
   var $9=(($8+($7<<2))|0);
   var $10=HEAP32[(($9)>>2)];
   var $11=_SDL_strcasecmp($10, ((832)|0));
   var $12=(($11)|(0))==0;
   if ($12) { label = 2; break; } else { label = 5; break; }
  case 2: 
   var $14=$3;
   var $15=((($14)+(1))|0);
   $3=$15;
   var $16=$3;
   var $17=$argv;
   var $18=(($17+($16<<2))|0);
   var $19=HEAP32[(($18)>>2)];
   var $20=(($19)|(0))!=0;
   if ($20) { label = 4; break; } else { label = 3; break; }
  case 3: 
   $1=-1;
   label = 189; break;
  case 4: 
   var $23=$3;
   var $24=$argv;
   var $25=(($24+($23<<2))|0);
   var $26=HEAP32[(($25)>>2)];
   var $27=$2;
   var $28=(($27+12)|0);
   HEAP32[(($28)>>2)]=$26;
   $1=2;
   label = 189; break;
  case 5: 
   var $30=$3;
   var $31=$argv;
   var $32=(($31+($30<<2))|0);
   var $33=HEAP32[(($32)>>2)];
   var $34=_SDL_strcasecmp($33, ((3128)|0));
   var $35=(($34)|(0))==0;
   if ($35) { label = 6; break; } else { label = 9; break; }
  case 6: 
   var $37=$3;
   var $38=((($37)+(1))|0);
   $3=$38;
   var $39=$3;
   var $40=$argv;
   var $41=(($40+($39<<2))|0);
   var $42=HEAP32[(($41)>>2)];
   var $43=(($42)|(0))!=0;
   if ($43) { label = 8; break; } else { label = 7; break; }
  case 7: 
   $1=-1;
   label = 189; break;
  case 8: 
   var $46=$3;
   var $47=$argv;
   var $48=(($47+($46<<2))|0);
   var $49=HEAP32[(($48)>>2)];
   var $50=$2;
   var $51=(($50+92)|0);
   HEAP32[(($51)>>2)]=$49;
   $1=2;
   label = 189; break;
  case 9: 
   var $53=$3;
   var $54=$argv;
   var $55=(($54+($53<<2))|0);
   var $56=HEAP32[(($55)>>2)];
   var $57=_SDL_strcasecmp($56, ((2808)|0));
   var $58=(($57)|(0))==0;
   if ($58) { label = 10; break; } else { label = 11; break; }
  case 10: 
   var $60=$2;
   var $61=(($60+212)|0);
   HEAP32[(($61)>>2)]=1;
   $1=1;
   label = 189; break;
  case 11: 
   var $63=$3;
   var $64=$argv;
   var $65=(($64+($63<<2))|0);
   var $66=HEAP32[(($65)>>2)];
   var $67=_SDL_strcasecmp($66, ((2744)|0));
   var $68=(($67)|(0))==0;
   if ($68) { label = 12; break; } else { label = 25; break; }
  case 12: 
   var $70=$3;
   var $71=((($70)+(1))|0);
   $3=$71;
   var $72=$3;
   var $73=$argv;
   var $74=(($73+($72<<2))|0);
   var $75=HEAP32[(($74)>>2)];
   var $76=(($75)|(0))!=0;
   if ($76) { label = 14; break; } else { label = 13; break; }
  case 13: 
   $1=-1;
   label = 189; break;
  case 14: 
   var $79=$3;
   var $80=$argv;
   var $81=(($80+($79<<2))|0);
   var $82=HEAP32[(($81)>>2)];
   var $83=_SDL_strcasecmp($82, ((2624)|0));
   var $84=(($83)|(0))==0;
   if ($84) { label = 15; break; } else { label = 16; break; }
  case 15: 
   var $86=$2;
   var $87=(($86+8)|0);
   var $88=HEAP32[(($87)>>2)];
   var $89=$88 | 15;
   HEAP32[(($87)>>2)]=$89;
   $1=2;
   label = 189; break;
  case 16: 
   var $91=$3;
   var $92=$argv;
   var $93=(($92+($91<<2))|0);
   var $94=HEAP32[(($93)>>2)];
   var $95=_SDL_strcasecmp($94, ((1960)|0));
   var $96=(($95)|(0))==0;
   if ($96) { label = 17; break; } else { label = 18; break; }
  case 17: 
   var $98=$2;
   var $99=(($98+8)|0);
   var $100=HEAP32[(($99)>>2)];
   var $101=$100 | 1;
   HEAP32[(($99)>>2)]=$101;
   $1=2;
   label = 189; break;
  case 18: 
   var $103=$3;
   var $104=$argv;
   var $105=(($104+($103<<2))|0);
   var $106=HEAP32[(($105)>>2)];
   var $107=_SDL_strcasecmp($106, ((1240)|0));
   var $108=(($107)|(0))==0;
   if ($108) { label = 19; break; } else { label = 20; break; }
  case 19: 
   var $110=$2;
   var $111=(($110+8)|0);
   var $112=HEAP32[(($111)>>2)];
   var $113=$112 | 2;
   HEAP32[(($111)>>2)]=$113;
   $1=2;
   label = 189; break;
  case 20: 
   var $115=$3;
   var $116=$argv;
   var $117=(($116+($115<<2))|0);
   var $118=HEAP32[(($117)>>2)];
   var $119=_SDL_strcasecmp($118, ((872)|0));
   var $120=(($119)|(0))==0;
   if ($120) { label = 21; break; } else { label = 22; break; }
  case 21: 
   var $122=$2;
   var $123=(($122+8)|0);
   var $124=HEAP32[(($123)>>2)];
   var $125=$124 | 4;
   HEAP32[(($123)>>2)]=$125;
   $1=2;
   label = 189; break;
  case 22: 
   var $127=$3;
   var $128=$argv;
   var $129=(($128+($127<<2))|0);
   var $130=HEAP32[(($129)>>2)];
   var $131=_SDL_strcasecmp($130, ((512)|0));
   var $132=(($131)|(0))==0;
   if ($132) { label = 23; break; } else { label = 24; break; }
  case 23: 
   var $134=$2;
   var $135=(($134+8)|0);
   var $136=HEAP32[(($135)>>2)];
   var $137=$136 | 8;
   HEAP32[(($135)>>2)]=$137;
   $1=2;
   label = 189; break;
  case 24: 
   $1=-1;
   label = 189; break;
  case 25: 
   var $140=$3;
   var $141=$argv;
   var $142=(($141+($140<<2))|0);
   var $143=HEAP32[(($142)>>2)];
   var $144=_SDL_strcasecmp($143, ((184)|0));
   var $145=(($144)|(0))==0;
   if ($145) { label = 26; break; } else { label = 43; break; }
  case 26: 
   var $147=$3;
   var $148=((($147)+(1))|0);
   $3=$148;
   var $149=$3;
   var $150=$argv;
   var $151=(($150+($149<<2))|0);
   var $152=HEAP32[(($151)>>2)];
   var $153=(($152)|(0))!=0;
   if ($153) { label = 28; break; } else { label = 27; break; }
  case 27: 
   $1=-1;
   label = 189; break;
  case 28: 
   var $156=$3;
   var $157=$argv;
   var $158=(($157+($156<<2))|0);
   var $159=HEAP32[(($158)>>2)];
   var $160=_SDL_strcasecmp($159, ((2624)|0));
   var $161=(($160)|(0))==0;
   if ($161) { label = 29; break; } else { label = 30; break; }
  case 29: 
   _SDL_LogSetAllPriority(1);
   $1=2;
   label = 189; break;
  case 30: 
   var $164=$3;
   var $165=$argv;
   var $166=(($165+($164<<2))|0);
   var $167=HEAP32[(($166)>>2)];
   var $168=_SDL_strcasecmp($167, ((5112)|0));
   var $169=(($168)|(0))==0;
   if ($169) { label = 31; break; } else { label = 32; break; }
  case 31: 
   _SDL_LogSetPriority(1, 1);
   $1=2;
   label = 189; break;
  case 32: 
   var $172=$3;
   var $173=$argv;
   var $174=(($173+($172<<2))|0);
   var $175=HEAP32[(($174)>>2)];
   var $176=_SDL_strcasecmp($175, ((4824)|0));
   var $177=(($176)|(0))==0;
   if ($177) { label = 33; break; } else { label = 34; break; }
  case 33: 
   _SDL_LogSetPriority(3, 1);
   $1=2;
   label = 189; break;
  case 34: 
   var $180=$3;
   var $181=$argv;
   var $182=(($181+($180<<2))|0);
   var $183=HEAP32[(($182)>>2)];
   var $184=_SDL_strcasecmp($183, ((4304)|0));
   var $185=(($184)|(0))==0;
   if ($185) { label = 35; break; } else { label = 36; break; }
  case 35: 
   _SDL_LogSetPriority(4, 1);
   $1=2;
   label = 189; break;
  case 36: 
   var $188=$3;
   var $189=$argv;
   var $190=(($189+($188<<2))|0);
   var $191=HEAP32[(($190)>>2)];
   var $192=_SDL_strcasecmp($191, ((1960)|0));
   var $193=(($192)|(0))==0;
   if ($193) { label = 37; break; } else { label = 38; break; }
  case 37: 
   _SDL_LogSetPriority(5, 1);
   $1=2;
   label = 189; break;
  case 38: 
   var $196=$3;
   var $197=$argv;
   var $198=(($197+($196<<2))|0);
   var $199=HEAP32[(($198)>>2)];
   var $200=_SDL_strcasecmp($199, ((872)|0));
   var $201=(($200)|(0))==0;
   if ($201) { label = 39; break; } else { label = 40; break; }
  case 39: 
   _SDL_LogSetPriority(6, 1);
   $1=2;
   label = 189; break;
  case 40: 
   var $204=$3;
   var $205=$argv;
   var $206=(($205+($204<<2))|0);
   var $207=HEAP32[(($206)>>2)];
   var $208=_SDL_strcasecmp($207, ((3976)|0));
   var $209=(($208)|(0))==0;
   if ($209) { label = 41; break; } else { label = 42; break; }
  case 41: 
   _SDL_LogSetPriority(7, 1);
   $1=2;
   label = 189; break;
  case 42: 
   $1=-1;
   label = 189; break;
  case 43: 
   var $213=$3;
   var $214=$argv;
   var $215=(($214+($213<<2))|0);
   var $216=HEAP32[(($215)>>2)];
   var $217=_SDL_strcasecmp($216, ((3696)|0));
   var $218=(($217)|(0))==0;
   if ($218) { label = 44; break; } else { label = 51; break; }
  case 44: 
   var $220=$3;
   var $221=((($220)+(1))|0);
   $3=$221;
   var $222=$3;
   var $223=$argv;
   var $224=(($223+($222<<2))|0);
   var $225=HEAP32[(($224)>>2)];
   var $226=(($225)|(0))!=0;
   if ($226) { label = 46; break; } else { label = 45; break; }
  case 45: 
   $1=-1;
   label = 189; break;
  case 46: 
   var $229=$3;
   var $230=$argv;
   var $231=(($230+($229<<2))|0);
   var $232=HEAP32[(($231)>>2)];
   var $233=_SDL_atoi($232);
   var $234=$2;
   var $235=(($234+16)|0);
   HEAP32[(($235)>>2)]=$233;
   var $236=$2;
   var $237=(($236+32)|0);
   var $238=HEAP32[(($237)>>2)];
   var $239=$238 & -65536;
   var $240=(($239)|(0))==536805376;
   if ($240) { label = 47; break; } else { label = 48; break; }
  case 47: 
   var $242=$2;
   var $243=(($242+16)|0);
   var $244=HEAP32[(($243)>>2)];
   var $245=536805376 | $244;
   var $246=$2;
   var $247=(($246+32)|0);
   HEAP32[(($247)>>2)]=$245;
   var $248=$2;
   var $249=(($248+16)|0);
   var $250=HEAP32[(($249)>>2)];
   var $251=536805376 | $250;
   var $252=$2;
   var $253=(($252+36)|0);
   HEAP32[(($253)>>2)]=$251;
   label = 48; break;
  case 48: 
   var $255=$2;
   var $256=(($255+32)|0);
   var $257=HEAP32[(($256)>>2)];
   var $258=$257 & -65536;
   var $259=(($258)|(0))==805240832;
   if ($259) { label = 49; break; } else { label = 50; break; }
  case 49: 
   var $261=$2;
   var $262=(($261+16)|0);
   var $263=HEAP32[(($262)>>2)];
   var $264=805240832 | $263;
   var $265=$2;
   var $266=(($265+32)|0);
   HEAP32[(($266)>>2)]=$264;
   var $267=$2;
   var $268=(($267+16)|0);
   var $269=HEAP32[(($268)>>2)];
   var $270=805240832 | $269;
   var $271=$2;
   var $272=(($271+36)|0);
   HEAP32[(($272)>>2)]=$270;
   label = 50; break;
  case 50: 
   $1=2;
   label = 189; break;
  case 51: 
   var $275=$3;
   var $276=$argv;
   var $277=(($276+($275<<2))|0);
   var $278=HEAP32[(($277)>>2)];
   var $279=_SDL_strcasecmp($278, ((3520)|0));
   var $280=(($279)|(0))==0;
   if ($280) { label = 52; break; } else { label = 53; break; }
  case 52: 
   var $282=$2;
   var $283=(($282+28)|0);
   var $284=HEAP32[(($283)>>2)];
   var $285=$284 | 1;
   HEAP32[(($283)>>2)]=$285;
   var $286=$2;
   var $287=(($286+84)|0);
   HEAP32[(($287)>>2)]=1;
   $1=1;
   label = 189; break;
  case 53: 
   var $289=$3;
   var $290=$argv;
   var $291=(($290+($289<<2))|0);
   var $292=HEAP32[(($291)>>2)];
   var $293=_SDL_strcasecmp($292, ((3392)|0));
   var $294=(($293)|(0))==0;
   if ($294) { label = 54; break; } else { label = 55; break; }
  case 54: 
   var $296=$2;
   var $297=(($296+28)|0);
   var $298=HEAP32[(($297)>>2)];
   var $299=$298 | 4097;
   HEAP32[(($297)>>2)]=$299;
   var $300=$2;
   var $301=(($300+84)|0);
   HEAP32[(($301)>>2)]=1;
   $1=1;
   label = 189; break;
  case 55: 
   var $303=$3;
   var $304=$argv;
   var $305=(($304+($303<<2))|0);
   var $306=HEAP32[(($305)>>2)];
   var $307=_SDL_strcasecmp($306, ((3256)|0));
   var $308=(($307)|(0))==0;
   if ($308) { label = 56; break; } else { label = 62; break; }
  case 56: 
   var $310=$3;
   var $311=((($310)+(1))|0);
   $3=$311;
   var $312=$3;
   var $313=$argv;
   var $314=(($313+($312<<2))|0);
   var $315=HEAP32[(($314)>>2)];
   var $316=(($315)|(0))!=0;
   if ($316) { label = 57; break; } else { label = 58; break; }
  case 57: 
   var $318=$3;
   var $319=$argv;
   var $320=(($319+($318<<2))|0);
   var $321=HEAP32[(($320)>>2)];
   var $322=HEAP8[($321)];
   var $323=(($322 << 24) >> 24);
   var $324=_SDL_isdigit($323);
   var $325=(($324)|(0))!=0;
   if ($325) { label = 59; break; } else { label = 58; break; }
  case 58: 
   $1=-1;
   label = 189; break;
  case 59: 
   var $328=$2;
   var $329=(($328+28)|0);
   var $330=HEAP32[(($329)>>2)];
   var $331=$330 & 1;
   var $332=(($331)|(0))!=0;
   if ($332) { label = 61; break; } else { label = 60; break; }
  case 60: 
   var $334=$3;
   var $335=$argv;
   var $336=(($335+($334<<2))|0);
   var $337=HEAP32[(($336)>>2)];
   var $338=_SDL_atoi($337);
   var $339=$2;
   var $340=(($339+84)|0);
   HEAP32[(($340)>>2)]=$338;
   label = 61; break;
  case 61: 
   $1=2;
   label = 189; break;
  case 62: 
   var $343=$3;
   var $344=$argv;
   var $345=(($344+($343<<2))|0);
   var $346=HEAP32[(($345)>>2)];
   var $347=_SDL_strcasecmp($346, ((3088)|0));
   var $348=(($347)|(0))==0;
   if ($348) { label = 63; break; } else { label = 66; break; }
  case 63: 
   var $350=$3;
   var $351=((($350)+(1))|0);
   $3=$351;
   var $352=$3;
   var $353=$argv;
   var $354=(($353+($352<<2))|0);
   var $355=HEAP32[(($354)>>2)];
   var $356=(($355)|(0))!=0;
   if ($356) { label = 65; break; } else { label = 64; break; }
  case 64: 
   $1=-1;
   label = 189; break;
  case 65: 
   var $359=$3;
   var $360=$argv;
   var $361=(($360+($359<<2))|0);
   var $362=HEAP32[(($361)>>2)];
   var $363=$2;
   var $364=(($363+20)|0);
   HEAP32[(($364)>>2)]=$362;
   $1=2;
   label = 189; break;
  case 66: 
   var $366=$3;
   var $367=$argv;
   var $368=(($367+($366<<2))|0);
   var $369=HEAP32[(($368)>>2)];
   var $370=_SDL_strcasecmp($369, ((3000)|0));
   var $371=(($370)|(0))==0;
   if ($371) { label = 67; break; } else { label = 70; break; }
  case 67: 
   var $373=$3;
   var $374=((($373)+(1))|0);
   $3=$374;
   var $375=$3;
   var $376=$argv;
   var $377=(($376+($375<<2))|0);
   var $378=HEAP32[(($377)>>2)];
   var $379=(($378)|(0))!=0;
   if ($379) { label = 69; break; } else { label = 68; break; }
  case 68: 
   $1=-1;
   label = 189; break;
  case 69: 
   var $382=$3;
   var $383=$argv;
   var $384=(($383+($382<<2))|0);
   var $385=HEAP32[(($384)>>2)];
   var $386=$2;
   var $387=(($386+24)|0);
   HEAP32[(($387)>>2)]=$385;
   $1=2;
   label = 189; break;
  case 70: 
   var $389=$3;
   var $390=$argv;
   var $391=(($390+($389<<2))|0);
   var $392=HEAP32[(($391)>>2)];
   var $393=_SDL_strcasecmp($392, ((2936)|0));
   var $394=(($393)|(0))==0;
   if ($394) { label = 71; break; } else { label = 72; break; }
  case 71: 
   var $396=$2;
   var $397=(($396+32)|0);
   HEAP32[(($397)>>2)]=805240832;
   var $398=$2;
   var $399=(($398+36)|0);
   HEAP32[(($399)>>2)]=805240832;
   $1=1;
   label = 189; break;
  case 72: 
   var $401=$3;
   var $402=$argv;
   var $403=(($402+($401<<2))|0);
   var $404=HEAP32[(($403)>>2)];
   var $405=_SDL_strcasecmp($404, ((2920)|0));
   var $406=(($405)|(0))==0;
   if ($406) { label = 73; break; } else { label = 83; break; }
  case 73: 
   var $408=$3;
   var $409=((($408)+(1))|0);
   $3=$409;
   var $410=$3;
   var $411=$argv;
   var $412=(($411+($410<<2))|0);
   var $413=HEAP32[(($412)>>2)];
   var $414=(($413)|(0))!=0;
   if ($414) { label = 75; break; } else { label = 74; break; }
  case 74: 
   $1=-1;
   label = 189; break;
  case 75: 
   var $417=$3;
   var $418=$argv;
   var $419=(($418+($417<<2))|0);
   var $420=HEAP32[(($419)>>2)];
   $x=$420;
   var $421=$3;
   var $422=$argv;
   var $423=(($422+($421<<2))|0);
   var $424=HEAP32[(($423)>>2)];
   $y=$424;
   label = 76; break;
  case 76: 
   var $426=$y;
   var $427=HEAP8[($426)];
   var $428=(($427 << 24) >> 24);
   var $429=(($428)|(0))!=0;
   if ($429) { label = 77; break; } else { var $436 = 0;label = 78; break; }
  case 77: 
   var $431=$y;
   var $432=HEAP8[($431)];
   var $433=(($432 << 24) >> 24);
   var $434=(($433)|(0))!=44;
   var $436 = $434;label = 78; break;
  case 78: 
   var $436;
   if ($436) { label = 79; break; } else { label = 80; break; }
  case 79: 
   var $438=$y;
   var $439=(($438+1)|0);
   $y=$439;
   label = 76; break;
  case 80: 
   var $441=$y;
   var $442=HEAP8[($441)];
   var $443=(($442 << 24) >> 24)!=0;
   if ($443) { label = 82; break; } else { label = 81; break; }
  case 81: 
   $1=-1;
   label = 189; break;
  case 82: 
   var $446=$y;
   var $447=(($446+1)|0);
   $y=$447;
   HEAP8[($446)]=0;
   var $448=$x;
   var $449=_SDL_atoi($448);
   var $450=$2;
   var $451=(($450+32)|0);
   HEAP32[(($451)>>2)]=$449;
   var $452=$y;
   var $453=_SDL_atoi($452);
   var $454=$2;
   var $455=(($454+36)|0);
   HEAP32[(($455)>>2)]=$453;
   $1=2;
   label = 189; break;
  case 83: 
   var $457=$3;
   var $458=$argv;
   var $459=(($458+($457<<2))|0);
   var $460=HEAP32[(($459)>>2)];
   var $461=_SDL_strcasecmp($460, ((2904)|0));
   var $462=(($461)|(0))==0;
   if ($462) { label = 84; break; } else { label = 94; break; }
  case 84: 
   var $464=$3;
   var $465=((($464)+(1))|0);
   $3=$465;
   var $466=$3;
   var $467=$argv;
   var $468=(($467+($466<<2))|0);
   var $469=HEAP32[(($468)>>2)];
   var $470=(($469)|(0))!=0;
   if ($470) { label = 86; break; } else { label = 85; break; }
  case 85: 
   $1=-1;
   label = 189; break;
  case 86: 
   var $473=$3;
   var $474=$argv;
   var $475=(($474+($473<<2))|0);
   var $476=HEAP32[(($475)>>2)];
   $w=$476;
   var $477=$3;
   var $478=$argv;
   var $479=(($478+($477<<2))|0);
   var $480=HEAP32[(($479)>>2)];
   $h=$480;
   label = 87; break;
  case 87: 
   var $482=$h;
   var $483=HEAP8[($482)];
   var $484=(($483 << 24) >> 24);
   var $485=(($484)|(0))!=0;
   if ($485) { label = 88; break; } else { var $492 = 0;label = 89; break; }
  case 88: 
   var $487=$h;
   var $488=HEAP8[($487)];
   var $489=(($488 << 24) >> 24);
   var $490=(($489)|(0))!=120;
   var $492 = $490;label = 89; break;
  case 89: 
   var $492;
   if ($492) { label = 90; break; } else { label = 91; break; }
  case 90: 
   var $494=$h;
   var $495=(($494+1)|0);
   $h=$495;
   label = 87; break;
  case 91: 
   var $497=$h;
   var $498=HEAP8[($497)];
   var $499=(($498 << 24) >> 24)!=0;
   if ($499) { label = 93; break; } else { label = 92; break; }
  case 92: 
   $1=-1;
   label = 189; break;
  case 93: 
   var $502=$h;
   var $503=(($502+1)|0);
   $h=$503;
   HEAP8[($502)]=0;
   var $504=$w;
   var $505=_SDL_atoi($504);
   var $506=$2;
   var $507=(($506+40)|0);
   HEAP32[(($507)>>2)]=$505;
   var $508=$h;
   var $509=_SDL_atoi($508);
   var $510=$2;
   var $511=(($510+44)|0);
   HEAP32[(($511)>>2)]=$509;
   $1=2;
   label = 189; break;
  case 94: 
   var $513=$3;
   var $514=$argv;
   var $515=(($514+($513<<2))|0);
   var $516=HEAP32[(($515)>>2)];
   var $517=_SDL_strcasecmp($516, ((2888)|0));
   var $518=(($517)|(0))==0;
   if ($518) { label = 95; break; } else { label = 105; break; }
  case 95: 
   var $520=$3;
   var $521=((($520)+(1))|0);
   $3=$521;
   var $522=$3;
   var $523=$argv;
   var $524=(($523+($522<<2))|0);
   var $525=HEAP32[(($524)>>2)];
   var $526=(($525)|(0))!=0;
   if ($526) { label = 97; break; } else { label = 96; break; }
  case 96: 
   $1=-1;
   label = 189; break;
  case 97: 
   var $529=$3;
   var $530=$argv;
   var $531=(($530+($529<<2))|0);
   var $532=HEAP32[(($531)>>2)];
   $w1=$532;
   var $533=$3;
   var $534=$argv;
   var $535=(($534+($533<<2))|0);
   var $536=HEAP32[(($535)>>2)];
   $h2=$536;
   label = 98; break;
  case 98: 
   var $538=$h2;
   var $539=HEAP8[($538)];
   var $540=(($539 << 24) >> 24);
   var $541=(($540)|(0))!=0;
   if ($541) { label = 99; break; } else { var $548 = 0;label = 100; break; }
  case 99: 
   var $543=$h2;
   var $544=HEAP8[($543)];
   var $545=(($544 << 24) >> 24);
   var $546=(($545)|(0))!=120;
   var $548 = $546;label = 100; break;
  case 100: 
   var $548;
   if ($548) { label = 101; break; } else { label = 102; break; }
  case 101: 
   var $550=$h2;
   var $551=(($550+1)|0);
   $h2=$551;
   label = 98; break;
  case 102: 
   var $553=$h2;
   var $554=HEAP8[($553)];
   var $555=(($554 << 24) >> 24)!=0;
   if ($555) { label = 104; break; } else { label = 103; break; }
  case 103: 
   $1=-1;
   label = 189; break;
  case 104: 
   var $558=$h2;
   var $559=(($558+1)|0);
   $h2=$559;
   HEAP8[($558)]=0;
   var $560=$w1;
   var $561=_SDL_atoi($560);
   var $562=$2;
   var $563=(($562+48)|0);
   HEAP32[(($563)>>2)]=$561;
   var $564=$h2;
   var $565=_SDL_atoi($564);
   var $566=$2;
   var $567=(($566+52)|0);
   HEAP32[(($567)>>2)]=$565;
   $1=2;
   label = 189; break;
  case 105: 
   var $569=$3;
   var $570=$argv;
   var $571=(($570+($569<<2))|0);
   var $572=HEAP32[(($571)>>2)];
   var $573=_SDL_strcasecmp($572, ((2872)|0));
   var $574=(($573)|(0))==0;
   if ($574) { label = 106; break; } else { label = 116; break; }
  case 106: 
   var $576=$3;
   var $577=((($576)+(1))|0);
   $3=$577;
   var $578=$3;
   var $579=$argv;
   var $580=(($579+($578<<2))|0);
   var $581=HEAP32[(($580)>>2)];
   var $582=(($581)|(0))!=0;
   if ($582) { label = 108; break; } else { label = 107; break; }
  case 107: 
   $1=-1;
   label = 189; break;
  case 108: 
   var $585=$3;
   var $586=$argv;
   var $587=(($586+($585<<2))|0);
   var $588=HEAP32[(($587)>>2)];
   $w3=$588;
   var $589=$3;
   var $590=$argv;
   var $591=(($590+($589<<2))|0);
   var $592=HEAP32[(($591)>>2)];
   $h4=$592;
   label = 109; break;
  case 109: 
   var $594=$h4;
   var $595=HEAP8[($594)];
   var $596=(($595 << 24) >> 24);
   var $597=(($596)|(0))!=0;
   if ($597) { label = 110; break; } else { var $604 = 0;label = 111; break; }
  case 110: 
   var $599=$h4;
   var $600=HEAP8[($599)];
   var $601=(($600 << 24) >> 24);
   var $602=(($601)|(0))!=120;
   var $604 = $602;label = 111; break;
  case 111: 
   var $604;
   if ($604) { label = 112; break; } else { label = 113; break; }
  case 112: 
   var $606=$h4;
   var $607=(($606+1)|0);
   $h4=$607;
   label = 109; break;
  case 113: 
   var $609=$h4;
   var $610=HEAP8[($609)];
   var $611=(($610 << 24) >> 24)!=0;
   if ($611) { label = 115; break; } else { label = 114; break; }
  case 114: 
   $1=-1;
   label = 189; break;
  case 115: 
   var $614=$h4;
   var $615=(($614+1)|0);
   $h4=$615;
   HEAP8[($614)]=0;
   var $616=$w3;
   var $617=_SDL_atoi($616);
   var $618=$2;
   var $619=(($618+56)|0);
   HEAP32[(($619)>>2)]=$617;
   var $620=$h4;
   var $621=_SDL_atoi($620);
   var $622=$2;
   var $623=(($622+60)|0);
   HEAP32[(($623)>>2)]=$621;
   $1=2;
   label = 189; break;
  case 116: 
   var $625=$3;
   var $626=$argv;
   var $627=(($626+($625<<2))|0);
   var $628=HEAP32[(($627)>>2)];
   var $629=_SDL_strcasecmp($628, ((2856)|0));
   var $630=(($629)|(0))==0;
   if ($630) { label = 117; break; } else { label = 127; break; }
  case 117: 
   var $632=$3;
   var $633=((($632)+(1))|0);
   $3=$633;
   var $634=$3;
   var $635=$argv;
   var $636=(($635+($634<<2))|0);
   var $637=HEAP32[(($636)>>2)];
   var $638=(($637)|(0))!=0;
   if ($638) { label = 119; break; } else { label = 118; break; }
  case 118: 
   $1=-1;
   label = 189; break;
  case 119: 
   var $641=$3;
   var $642=$argv;
   var $643=(($642+($641<<2))|0);
   var $644=HEAP32[(($643)>>2)];
   $w5=$644;
   var $645=$3;
   var $646=$argv;
   var $647=(($646+($645<<2))|0);
   var $648=HEAP32[(($647)>>2)];
   $h6=$648;
   label = 120; break;
  case 120: 
   var $650=$h6;
   var $651=HEAP8[($650)];
   var $652=(($651 << 24) >> 24);
   var $653=(($652)|(0))!=0;
   if ($653) { label = 121; break; } else { var $660 = 0;label = 122; break; }
  case 121: 
   var $655=$h6;
   var $656=HEAP8[($655)];
   var $657=(($656 << 24) >> 24);
   var $658=(($657)|(0))!=120;
   var $660 = $658;label = 122; break;
  case 122: 
   var $660;
   if ($660) { label = 123; break; } else { label = 124; break; }
  case 123: 
   var $662=$h6;
   var $663=(($662+1)|0);
   $h6=$663;
   label = 120; break;
  case 124: 
   var $665=$h6;
   var $666=HEAP8[($665)];
   var $667=(($666 << 24) >> 24)!=0;
   if ($667) { label = 126; break; } else { label = 125; break; }
  case 125: 
   $1=-1;
   label = 189; break;
  case 126: 
   var $670=$h6;
   var $671=(($670+1)|0);
   $h6=$671;
   HEAP8[($670)]=0;
   var $672=$w5;
   var $673=_SDL_atoi($672);
   var $674=$2;
   var $675=(($674+64)|0);
   HEAP32[(($675)>>2)]=$673;
   var $676=$h6;
   var $677=_SDL_atoi($676);
   var $678=$2;
   var $679=(($678+68)|0);
   HEAP32[(($679)>>2)]=$677;
   $1=2;
   label = 189; break;
  case 127: 
   var $681=$3;
   var $682=$argv;
   var $683=(($682+($681<<2))|0);
   var $684=HEAP32[(($683)>>2)];
   var $685=_SDL_strcasecmp($684, ((2848)|0));
   var $686=(($685)|(0))==0;
   if ($686) { label = 128; break; } else { label = 131; break; }
  case 128: 
   var $688=$3;
   var $689=((($688)+(1))|0);
   $3=$689;
   var $690=$3;
   var $691=$argv;
   var $692=(($691+($690<<2))|0);
   var $693=HEAP32[(($692)>>2)];
   var $694=(($693)|(0))!=0;
   if ($694) { label = 130; break; } else { label = 129; break; }
  case 129: 
   $1=-1;
   label = 189; break;
  case 130: 
   var $697=$3;
   var $698=$argv;
   var $699=(($698+($697<<2))|0);
   var $700=HEAP32[(($699)>>2)];
   var $701=_SDL_atof($700);
   var $702=$701;
   var $703=$2;
   var $704=(($703+72)|0);
   HEAPF32[(($704)>>2)]=$702;
   $1=2;
   label = 189; break;
  case 131: 
   var $706=$3;
   var $707=$argv;
   var $708=(($707+($706<<2))|0);
   var $709=HEAP32[(($708)>>2)];
   var $710=_SDL_strcasecmp($709, ((2840)|0));
   var $711=(($710)|(0))==0;
   if ($711) { label = 132; break; } else { label = 135; break; }
  case 132: 
   var $713=$3;
   var $714=((($713)+(1))|0);
   $3=$714;
   var $715=$3;
   var $716=$argv;
   var $717=(($716+($715<<2))|0);
   var $718=HEAP32[(($717)>>2)];
   var $719=(($718)|(0))!=0;
   if ($719) { label = 134; break; } else { label = 133; break; }
  case 133: 
   $1=-1;
   label = 189; break;
  case 134: 
   var $722=$3;
   var $723=$argv;
   var $724=(($723+($722<<2))|0);
   var $725=HEAP32[(($724)>>2)];
   var $726=_SDL_atoi($725);
   var $727=$2;
   var $728=(($727+76)|0);
   HEAP32[(($728)>>2)]=$726;
   $1=2;
   label = 189; break;
  case 135: 
   var $730=$3;
   var $731=$argv;
   var $732=(($731+($730<<2))|0);
   var $733=HEAP32[(($732)>>2)];
   var $734=_SDL_strcasecmp($733, ((2824)|0));
   var $735=(($734)|(0))==0;
   if ($735) { label = 136; break; } else { label = 139; break; }
  case 136: 
   var $737=$3;
   var $738=((($737)+(1))|0);
   $3=$738;
   var $739=$3;
   var $740=$argv;
   var $741=(($740+($739<<2))|0);
   var $742=HEAP32[(($741)>>2)];
   var $743=(($742)|(0))!=0;
   if ($743) { label = 138; break; } else { label = 137; break; }
  case 137: 
   $1=-1;
   label = 189; break;
  case 138: 
   var $746=$3;
   var $747=$argv;
   var $748=(($747+($746<<2))|0);
   var $749=HEAP32[(($748)>>2)];
   var $750=_SDL_atoi($749);
   var $751=$2;
   var $752=(($751+80)|0);
   HEAP32[(($752)>>2)]=$750;
   $1=2;
   label = 189; break;
  case 139: 
   var $754=$3;
   var $755=$argv;
   var $756=(($755+($754<<2))|0);
   var $757=HEAP32[(($756)>>2)];
   var $758=_SDL_strcasecmp($757, ((2800)|0));
   var $759=(($758)|(0))==0;
   if ($759) { label = 140; break; } else { label = 141; break; }
  case 140: 
   var $761=$2;
   var $762=(($761+96)|0);
   var $763=HEAP32[(($762)>>2)];
   var $764=$763 | 4;
   HEAP32[(($762)>>2)]=$764;
   $1=1;
   label = 189; break;
  case 141: 
   var $766=$3;
   var $767=$argv;
   var $768=(($767+($766<<2))|0);
   var $769=HEAP32[(($768)>>2)];
   var $770=_SDL_strcasecmp($769, ((2768)|0));
   var $771=(($770)|(0))==0;
   if ($771) { label = 142; break; } else { label = 143; break; }
  case 142: 
   var $773=$2;
   var $774=(($773+28)|0);
   var $775=HEAP32[(($774)>>2)];
   var $776=$775 | 16;
   HEAP32[(($774)>>2)]=$776;
   $1=1;
   label = 189; break;
  case 143: 
   var $778=$3;
   var $779=$argv;
   var $780=(($779+($778<<2))|0);
   var $781=HEAP32[(($780)>>2)];
   var $782=_SDL_strcasecmp($781, ((2752)|0));
   var $783=(($782)|(0))==0;
   if ($783) { label = 144; break; } else { label = 145; break; }
  case 144: 
   var $785=$2;
   var $786=(($785+28)|0);
   var $787=HEAP32[(($786)>>2)];
   var $788=$787 | 32;
   HEAP32[(($786)>>2)]=$788;
   $1=1;
   label = 189; break;
  case 145: 
   var $790=$3;
   var $791=$argv;
   var $792=(($791+($790<<2))|0);
   var $793=HEAP32[(($792)>>2)];
   var $794=_SDL_strcasecmp($793, ((2728)|0));
   var $795=(($794)|(0))==0;
   if ($795) { label = 146; break; } else { label = 147; break; }
  case 146: 
   var $797=$2;
   var $798=(($797+28)|0);
   var $799=HEAP32[(($798)>>2)];
   var $800=$799 | 64;
   HEAP32[(($798)>>2)]=$800;
   $1=1;
   label = 189; break;
  case 147: 
   var $802=$3;
   var $803=$argv;
   var $804=(($803+($802<<2))|0);
   var $805=HEAP32[(($804)>>2)];
   var $806=_SDL_strcasecmp($805, ((2712)|0));
   var $807=(($806)|(0))==0;
   if ($807) { label = 148; break; } else { label = 149; break; }
  case 148: 
   var $809=$2;
   var $810=(($809+28)|0);
   var $811=HEAP32[(($810)>>2)];
   var $812=$811 | 128;
   HEAP32[(($810)>>2)]=$812;
   $1=1;
   label = 189; break;
  case 149: 
   var $814=$3;
   var $815=$argv;
   var $816=(($815+($814<<2))|0);
   var $817=HEAP32[(($816)>>2)];
   var $818=_SDL_strcasecmp($817, ((2704)|0));
   var $819=(($818)|(0))==0;
   if ($819) { label = 150; break; } else { label = 151; break; }
  case 150: 
   var $821=$2;
   var $822=(($821+28)|0);
   var $823=HEAP32[(($822)>>2)];
   var $824=$823 | 256;
   HEAP32[(($822)>>2)]=$824;
   $1=1;
   label = 189; break;
  case 151: 
   var $826=$3;
   var $827=$argv;
   var $828=(($827+($826<<2))|0);
   var $829=HEAP32[(($828)>>2)];
   var $830=_SDL_strcasecmp($829, ((2696)|0));
   var $831=(($830)|(0))==0;
   if ($831) { label = 152; break; } else { label = 155; break; }
  case 152: 
   var $833=$3;
   var $834=((($833)+(1))|0);
   $3=$834;
   var $835=$3;
   var $836=$argv;
   var $837=(($836+($835<<2))|0);
   var $838=HEAP32[(($837)>>2)];
   var $839=(($838)|(0))!=0;
   if ($839) { label = 154; break; } else { label = 153; break; }
  case 153: 
   $1=-1;
   label = 189; break;
  case 154: 
   var $842=$3;
   var $843=$argv;
   var $844=(($843+($842<<2))|0);
   var $845=HEAP32[(($844)>>2)];
   var $846=_SDL_atoi($845);
   var $847=$2;
   var $848=(($847+112)|0);
   var $849=(($848)|0);
   HEAP32[(($849)>>2)]=$846;
   $1=2;
   label = 189; break;
  case 155: 
   var $851=$3;
   var $852=$argv;
   var $853=(($852+($851<<2))|0);
   var $854=HEAP32[(($853)>>2)];
   var $855=_SDL_strcasecmp($854, ((2680)|0));
   var $856=(($855)|(0))==0;
   if ($856) { label = 156; break; } else { label = 175; break; }
  case 156: 
   var $858=$3;
   var $859=((($858)+(1))|0);
   $3=$859;
   var $860=$3;
   var $861=$argv;
   var $862=(($861+($860<<2))|0);
   var $863=HEAP32[(($862)>>2)];
   var $864=(($863)|(0))!=0;
   if ($864) { label = 158; break; } else { label = 157; break; }
  case 157: 
   $1=-1;
   label = 189; break;
  case 158: 
   var $867=$3;
   var $868=$argv;
   var $869=(($868+($867<<2))|0);
   var $870=HEAP32[(($869)>>2)];
   var $871=_SDL_strcasecmp($870, ((2672)|0));
   var $872=(($871)|(0))==0;
   if ($872) { label = 159; break; } else { label = 160; break; }
  case 159: 
   var $874=$2;
   var $875=(($874+112)|0);
   var $876=(($875+4)|0);
   HEAP16[(($876)>>1)]=8;
   $1=2;
   label = 189; break;
  case 160: 
   var $878=$3;
   var $879=$argv;
   var $880=(($879+($878<<2))|0);
   var $881=HEAP32[(($880)>>2)];
   var $882=_SDL_strcasecmp($881, ((2664)|0));
   var $883=(($882)|(0))==0;
   if ($883) { label = 161; break; } else { label = 162; break; }
  case 161: 
   var $885=$2;
   var $886=(($885+112)|0);
   var $887=(($886+4)|0);
   HEAP16[(($887)>>1)]=-32760;
   $1=2;
   label = 189; break;
  case 162: 
   var $889=$3;
   var $890=$argv;
   var $891=(($890+($889<<2))|0);
   var $892=HEAP32[(($891)>>2)];
   var $893=_SDL_strcasecmp($892, ((2656)|0));
   var $894=(($893)|(0))==0;
   if ($894) { label = 163; break; } else { label = 164; break; }
  case 163: 
   var $896=$2;
   var $897=(($896+112)|0);
   var $898=(($897+4)|0);
   HEAP16[(($898)>>1)]=16;
   $1=2;
   label = 189; break;
  case 164: 
   var $900=$3;
   var $901=$argv;
   var $902=(($901+($900<<2))|0);
   var $903=HEAP32[(($902)>>2)];
   var $904=_SDL_strcasecmp($903, ((2640)|0));
   var $905=(($904)|(0))==0;
   if ($905) { label = 165; break; } else { label = 166; break; }
  case 165: 
   var $907=$2;
   var $908=(($907+112)|0);
   var $909=(($908+4)|0);
   HEAP16[(($909)>>1)]=16;
   $1=2;
   label = 189; break;
  case 166: 
   var $911=$3;
   var $912=$argv;
   var $913=(($912+($911<<2))|0);
   var $914=HEAP32[(($913)>>2)];
   var $915=_SDL_strcasecmp($914, ((2632)|0));
   var $916=(($915)|(0))==0;
   if ($916) { label = 167; break; } else { label = 168; break; }
  case 167: 
   var $918=$2;
   var $919=(($918+112)|0);
   var $920=(($919+4)|0);
   HEAP16[(($920)>>1)]=4112;
   $1=2;
   label = 189; break;
  case 168: 
   var $922=$3;
   var $923=$argv;
   var $924=(($923+($922<<2))|0);
   var $925=HEAP32[(($924)>>2)];
   var $926=_SDL_strcasecmp($925, ((2616)|0));
   var $927=(($926)|(0))==0;
   if ($927) { label = 169; break; } else { label = 170; break; }
  case 169: 
   var $929=$2;
   var $930=(($929+112)|0);
   var $931=(($930+4)|0);
   HEAP16[(($931)>>1)]=-32752;
   $1=2;
   label = 189; break;
  case 170: 
   var $933=$3;
   var $934=$argv;
   var $935=(($934+($933<<2))|0);
   var $936=HEAP32[(($935)>>2)];
   var $937=_SDL_strcasecmp($936, ((2608)|0));
   var $938=(($937)|(0))==0;
   if ($938) { label = 171; break; } else { label = 172; break; }
  case 171: 
   var $940=$2;
   var $941=(($940+112)|0);
   var $942=(($941+4)|0);
   HEAP16[(($942)>>1)]=-32752;
   $1=2;
   label = 189; break;
  case 172: 
   var $944=$3;
   var $945=$argv;
   var $946=(($945+($944<<2))|0);
   var $947=HEAP32[(($946)>>2)];
   var $948=_SDL_strcasecmp($947, ((2600)|0));
   var $949=(($948)|(0))==0;
   if ($949) { label = 173; break; } else { label = 174; break; }
  case 173: 
   var $951=$2;
   var $952=(($951+112)|0);
   var $953=(($952+4)|0);
   HEAP16[(($953)>>1)]=-28656;
   $1=2;
   label = 189; break;
  case 174: 
   $1=-1;
   label = 189; break;
  case 175: 
   var $956=$3;
   var $957=$argv;
   var $958=(($957+($956<<2))|0);
   var $959=HEAP32[(($958)>>2)];
   var $960=_SDL_strcasecmp($959, ((2584)|0));
   var $961=(($960)|(0))==0;
   if ($961) { label = 176; break; } else { label = 179; break; }
  case 176: 
   var $963=$3;
   var $964=((($963)+(1))|0);
   $3=$964;
   var $965=$3;
   var $966=$argv;
   var $967=(($966+($965<<2))|0);
   var $968=HEAP32[(($967)>>2)];
   var $969=(($968)|(0))!=0;
   if ($969) { label = 178; break; } else { label = 177; break; }
  case 177: 
   $1=-1;
   label = 189; break;
  case 178: 
   var $972=$3;
   var $973=$argv;
   var $974=(($973+($972<<2))|0);
   var $975=HEAP32[(($974)>>2)];
   var $976=_SDL_atoi($975);
   var $977=(($976) & 255);
   var $978=$2;
   var $979=(($978+112)|0);
   var $980=(($979+6)|0);
   HEAP8[($980)]=$977;
   $1=2;
   label = 189; break;
  case 179: 
   var $982=$3;
   var $983=$argv;
   var $984=(($983+($982<<2))|0);
   var $985=HEAP32[(($984)>>2)];
   var $986=_SDL_strcasecmp($985, ((2568)|0));
   var $987=(($986)|(0))==0;
   if ($987) { label = 180; break; } else { label = 183; break; }
  case 180: 
   var $989=$3;
   var $990=((($989)+(1))|0);
   $3=$990;
   var $991=$3;
   var $992=$argv;
   var $993=(($992+($991<<2))|0);
   var $994=HEAP32[(($993)>>2)];
   var $995=(($994)|(0))!=0;
   if ($995) { label = 182; break; } else { label = 181; break; }
  case 181: 
   $1=-1;
   label = 189; break;
  case 182: 
   var $998=$3;
   var $999=$argv;
   var $1000=(($999+($998<<2))|0);
   var $1001=HEAP32[(($1000)>>2)];
   var $1002=_SDL_atoi($1001);
   var $1003=(($1002) & 65535);
   var $1004=$2;
   var $1005=(($1004+112)|0);
   var $1006=(($1005+8)|0);
   HEAP16[(($1006)>>1)]=$1003;
   $1=2;
   label = 189; break;
  case 183: 
   var $1008=$3;
   var $1009=$argv;
   var $1010=(($1009+($1008<<2))|0);
   var $1011=HEAP32[(($1010)>>2)];
   var $1012=_SDL_strcasecmp($1011, ((2560)|0));
   var $1013=(($1012)|(0))==0;
   if ($1013) { label = 185; break; } else { label = 184; break; }
  case 184: 
   var $1015=$3;
   var $1016=$argv;
   var $1017=(($1016+($1015<<2))|0);
   var $1018=HEAP32[(($1017)>>2)];
   var $1019=_SDL_strcasecmp($1018, ((2552)|0));
   var $1020=(($1019)|(0))==0;
   if ($1020) { label = 185; break; } else { label = 186; break; }
  case 185: 
   $1=-1;
   label = 189; break;
  case 186: 
   var $1023=$3;
   var $1024=$argv;
   var $1025=(($1024+($1023<<2))|0);
   var $1026=HEAP32[(($1025)>>2)];
   var $1027=_SDL_strcmp($1026, ((2520)|0));
   var $1028=(($1027)|(0))==0;
   if ($1028) { label = 187; break; } else { label = 188; break; }
  case 187: 
   $1=2;
   label = 189; break;
  case 188: 
   $1=0;
   label = 189; break;
  case 189: 
   var $1032=$1;
   return $1032;
  default: assert(0, "bad label: " + label);
 }
}
function _SDLTest_CommonUsage($state) {
 var label = 0;
 label = 1; 
 while(1) switch(label) {
  case 1: 
   var $1;
   var $2;
   $2=$state;
   var $3=$2;
   var $4=(($3+4)|0);
   var $5=HEAP32[(($4)>>2)];
   var $6=$5 & 48;
   if ((($6)|(0))==32) {
    label = 2; break;
   }
   else if ((($6)|(0))==16) {
    label = 3; break;
   }
   else if ((($6)|(0))==48) {
    label = 4; break;
   }
   else {
   label = 5; break;
   }
  case 2: 
   $1=((2064)|0);
   label = 6; break;
  case 3: 
   $1=((1968)|0);
   label = 6; break;
  case 4: 
   $1=((1424)|0);
   label = 6; break;
  case 5: 
   $1=((5344)|0);
   label = 6; break;
  case 6: 
   var $12=$1;
   return $12;
  default: assert(0, "bad label: " + label);
 }
}
function _SDLTest_CommonInit($state) {
 var label = 0;
 var tempVarArgs = 0;
 var sp  = STACKTOP; STACKTOP = (STACKTOP + 1408)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1) switch(label) {
  case 1: 
   var $1;
   var $2;
   var $i;
   var $j;
   var $m;
   var $n;
   var $w=sp;
   var $h=(sp)+(8);
   var $fullscreen_mode=(sp)+(16);
   var $bounds=(sp)+(40);
   var $mode=(sp)+(56);
   var $bpp=(sp)+(80);
   var $Rmask=(sp)+(88);
   var $Gmask=(sp)+(96);
   var $Bmask=(sp)+(104);
   var $Amask=(sp)+(112);
   var $info=(sp)+(120);
   var $title=(sp)+(208);
   var $icon;
   var $info1=(sp)+(1232);
   var $info2=(sp)+(1320);
   $2=$state;
   var $3=$2;
   var $4=(($3+4)|0);
   var $5=HEAP32[(($4)>>2)];
   var $6=$5 & 32;
   var $7=(($6)|(0))!=0;
   if ($7) { label = 2; break; } else { label = 116; break; }
  case 2: 
   var $9=$2;
   var $10=(($9+8)|0);
   var $11=HEAP32[(($10)>>2)];
   var $12=$11 & 1;
   var $13=(($12)|(0))!=0;
   if ($13) { label = 3; break; } else { label = 13; break; }
  case 3: 
   var $15=_SDL_GetNumVideoDrivers();
   $n=$15;
   var $16=$n;
   var $17=(($16)|(0))==0;
   if ($17) { label = 4; break; } else { label = 5; break; }
  case 4: 
   var $19=HEAP32[((_stderr)>>2)];
   var $20=_fprintf($19, ((1392)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 12; break;
  case 5: 
   var $22=HEAP32[((_stderr)>>2)];
   var $23=_fprintf($22, ((1368)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   $i=0;
   label = 6; break;
  case 6: 
   var $25=$i;
   var $26=$n;
   var $27=(($25)|(0)) < (($26)|(0));
   if ($27) { label = 7; break; } else { label = 11; break; }
  case 7: 
   var $29=$i;
   var $30=(($29)|(0)) > 0;
   if ($30) { label = 8; break; } else { label = 9; break; }
  case 8: 
   var $32=HEAP32[((_stderr)>>2)];
   var $33=_fprintf($32, ((1360)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 9; break;
  case 9: 
   var $35=HEAP32[((_stderr)>>2)];
   var $36=$i;
   var $37=_SDL_GetVideoDriver($36);
   var $38=_fprintf($35, ((1352)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$37,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 10; break;
  case 10: 
   var $40=$i;
   var $41=((($40)+(1))|0);
   $i=$41;
   label = 6; break;
  case 11: 
   var $43=HEAP32[((_stderr)>>2)];
   var $44=_fprintf($43, ((1344)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 12; break;
  case 12: 
   label = 13; break;
  case 13: 
   var $47=$2;
   var $48=(($47+12)|0);
   var $49=HEAP32[(($48)>>2)];
   var $50=_SDL_VideoInit($49);
   var $51=(($50)|(0)) < 0;
   if ($51) { label = 14; break; } else { label = 15; break; }
  case 14: 
   var $53=HEAP32[((_stderr)>>2)];
   var $54=_SDL_GetError();
   var $55=_fprintf($53, ((1304)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$54,tempVarArgs)); STACKTOP=tempVarArgs;
   $1=0;
   label = 136; break;
  case 15: 
   var $57=$2;
   var $58=(($57+8)|0);
   var $59=HEAP32[(($58)>>2)];
   var $60=$59 & 1;
   var $61=(($60)|(0))!=0;
   if ($61) { label = 16; break; } else { label = 17; break; }
  case 16: 
   var $63=HEAP32[((_stderr)>>2)];
   var $64=_SDL_GetCurrentVideoDriver();
   var $65=_fprintf($63, ((1272)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$64,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 17; break;
  case 17: 
   var $67=$2;
   var $68=(($67+136)|0);
   var $69=HEAP32[(($68)>>2)];
   var $70=_SDL_GL_SetAttribute(0, $69);
   var $71=$2;
   var $72=(($71+140)|0);
   var $73=HEAP32[(($72)>>2)];
   var $74=_SDL_GL_SetAttribute(1, $73);
   var $75=$2;
   var $76=(($75+144)|0);
   var $77=HEAP32[(($76)>>2)];
   var $78=_SDL_GL_SetAttribute(2, $77);
   var $79=$2;
   var $80=(($79+148)|0);
   var $81=HEAP32[(($80)>>2)];
   var $82=_SDL_GL_SetAttribute(3, $81);
   var $83=$2;
   var $84=(($83+164)|0);
   var $85=HEAP32[(($84)>>2)];
   var $86=_SDL_GL_SetAttribute(5, $85);
   var $87=$2;
   var $88=(($87+152)|0);
   var $89=HEAP32[(($88)>>2)];
   var $90=_SDL_GL_SetAttribute(4, $89);
   var $91=$2;
   var $92=(($91+156)|0);
   var $93=HEAP32[(($92)>>2)];
   var $94=_SDL_GL_SetAttribute(6, $93);
   var $95=$2;
   var $96=(($95+160)|0);
   var $97=HEAP32[(($96)>>2)];
   var $98=_SDL_GL_SetAttribute(7, $97);
   var $99=$2;
   var $100=(($99+168)|0);
   var $101=HEAP32[(($100)>>2)];
   var $102=_SDL_GL_SetAttribute(8, $101);
   var $103=$2;
   var $104=(($103+172)|0);
   var $105=HEAP32[(($104)>>2)];
   var $106=_SDL_GL_SetAttribute(9, $105);
   var $107=$2;
   var $108=(($107+176)|0);
   var $109=HEAP32[(($108)>>2)];
   var $110=_SDL_GL_SetAttribute(10, $109);
   var $111=$2;
   var $112=(($111+180)|0);
   var $113=HEAP32[(($112)>>2)];
   var $114=_SDL_GL_SetAttribute(11, $113);
   var $115=$2;
   var $116=(($115+184)|0);
   var $117=HEAP32[(($116)>>2)];
   var $118=_SDL_GL_SetAttribute(12, $117);
   var $119=$2;
   var $120=(($119+188)|0);
   var $121=HEAP32[(($120)>>2)];
   var $122=_SDL_GL_SetAttribute(13, $121);
   var $123=$2;
   var $124=(($123+192)|0);
   var $125=HEAP32[(($124)>>2)];
   var $126=_SDL_GL_SetAttribute(14, $125);
   var $127=$2;
   var $128=(($127+200)|0);
   var $129=HEAP32[(($128)>>2)];
   var $130=(($129)|(0)) >= 0;
   if ($130) { label = 18; break; } else { label = 19; break; }
  case 18: 
   var $132=$2;
   var $133=(($132+200)|0);
   var $134=HEAP32[(($133)>>2)];
   var $135=_SDL_GL_SetAttribute(15, $134);
   label = 19; break;
  case 19: 
   var $137=$2;
   var $138=(($137+196)|0);
   var $139=HEAP32[(($138)>>2)];
   var $140=_SDL_GL_SetAttribute(16, $139);
   var $141=$2;
   var $142=(($141+204)|0);
   var $143=HEAP32[(($142)>>2)];
   var $144=(($143)|(0))!=0;
   if ($144) { label = 20; break; } else { label = 21; break; }
  case 20: 
   var $146=$2;
   var $147=(($146+204)|0);
   var $148=HEAP32[(($147)>>2)];
   var $149=_SDL_GL_SetAttribute(17, $148);
   var $150=$2;
   var $151=(($150+208)|0);
   var $152=HEAP32[(($151)>>2)];
   var $153=_SDL_GL_SetAttribute(18, $152);
   label = 21; break;
  case 21: 
   var $155=$2;
   var $156=(($155+212)|0);
   var $157=HEAP32[(($156)>>2)];
   var $158=(($157)|(0))!=0;
   if ($158) { label = 22; break; } else { label = 23; break; }
  case 22: 
   var $160=_SDL_GL_SetAttribute(20, 1);
   label = 23; break;
  case 23: 
   var $162=$2;
   var $163=(($162+8)|0);
   var $164=HEAP32[(($163)>>2)];
   var $165=$164 & 2;
   var $166=(($165)|(0))!=0;
   if ($166) { label = 24; break; } else { label = 48; break; }
  case 24: 
   var $168=_SDL_GetNumVideoDisplays();
   $n=$168;
   var $169=HEAP32[((_stderr)>>2)];
   var $170=$n;
   var $171=_fprintf($169, ((1248)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$170,tempVarArgs)); STACKTOP=tempVarArgs;
   $i=0;
   label = 25; break;
  case 25: 
   var $173=$i;
   var $174=$n;
   var $175=(($173)|(0)) < (($174)|(0));
   if ($175) { label = 26; break; } else { label = 47; break; }
  case 26: 
   var $177=HEAP32[((_stderr)>>2)];
   var $178=$i;
   var $179=$i;
   var $180=_SDL_GetDisplayName($179);
   var $181=_fprintf($177, ((1224)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 16)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$178,HEAP32[(((tempVarArgs)+(8))>>2)]=$180,tempVarArgs)); STACKTOP=tempVarArgs;
   var $182=$bounds;
   var $183=_SDL_memset($182, 0, 16);
   var $184=$i;
   var $185=_SDL_GetDisplayBounds($184, $bounds);
   var $186=HEAP32[((_stderr)>>2)];
   var $187=(($bounds+8)|0);
   var $188=HEAP32[(($187)>>2)];
   var $189=(($bounds+12)|0);
   var $190=HEAP32[(($189)>>2)];
   var $191=(($bounds)|0);
   var $192=HEAP32[(($191)>>2)];
   var $193=(($bounds+4)|0);
   var $194=HEAP32[(($193)>>2)];
   var $195=_fprintf($186, ((1200)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 32)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$188,HEAP32[(((tempVarArgs)+(8))>>2)]=$190,HEAP32[(((tempVarArgs)+(16))>>2)]=$192,HEAP32[(((tempVarArgs)+(24))>>2)]=$194,tempVarArgs)); STACKTOP=tempVarArgs;
   var $196=$i;
   var $197=_SDL_GetDesktopDisplayMode($196, $mode);
   var $198=(($mode)|0);
   var $199=HEAP32[(($198)>>2)];
   var $200=_SDL_PixelFormatEnumToMasks($199, $bpp, $Rmask, $Gmask, $Bmask, $Amask);
   var $201=HEAP32[((_stderr)>>2)];
   var $202=(($mode+4)|0);
   var $203=HEAP32[(($202)>>2)];
   var $204=(($mode+8)|0);
   var $205=HEAP32[(($204)>>2)];
   var $206=(($mode+12)|0);
   var $207=HEAP32[(($206)>>2)];
   var $208=HEAP32[(($bpp)>>2)];
   var $209=(($mode)|0);
   var $210=HEAP32[(($209)>>2)];
   var $211=_SDL_GetPixelFormatName($210);
   var $212=_fprintf($201, ((1144)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 40)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$203,HEAP32[(((tempVarArgs)+(8))>>2)]=$205,HEAP32[(((tempVarArgs)+(16))>>2)]=$207,HEAP32[(((tempVarArgs)+(24))>>2)]=$208,HEAP32[(((tempVarArgs)+(32))>>2)]=$211,tempVarArgs)); STACKTOP=tempVarArgs;
   var $213=HEAP32[(($Rmask)>>2)];
   var $214=(($213)|(0))!=0;
   if ($214) { label = 29; break; } else { label = 27; break; }
  case 27: 
   var $216=HEAP32[(($Gmask)>>2)];
   var $217=(($216)|(0))!=0;
   if ($217) { label = 29; break; } else { label = 28; break; }
  case 28: 
   var $219=HEAP32[(($Bmask)>>2)];
   var $220=(($219)|(0))!=0;
   if ($220) { label = 29; break; } else { label = 32; break; }
  case 29: 
   var $222=HEAP32[((_stderr)>>2)];
   var $223=HEAP32[(($Rmask)>>2)];
   var $224=_fprintf($222, ((1112)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$223,tempVarArgs)); STACKTOP=tempVarArgs;
   var $225=HEAP32[((_stderr)>>2)];
   var $226=HEAP32[(($Gmask)>>2)];
   var $227=_fprintf($225, ((1080)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$226,tempVarArgs)); STACKTOP=tempVarArgs;
   var $228=HEAP32[((_stderr)>>2)];
   var $229=HEAP32[(($Bmask)>>2)];
   var $230=_fprintf($228, ((1048)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$229,tempVarArgs)); STACKTOP=tempVarArgs;
   var $231=HEAP32[(($Amask)>>2)];
   var $232=(($231)|(0))!=0;
   if ($232) { label = 30; break; } else { label = 31; break; }
  case 30: 
   var $234=HEAP32[((_stderr)>>2)];
   var $235=HEAP32[(($Amask)>>2)];
   var $236=_fprintf($234, ((1016)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$235,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 31; break;
  case 31: 
   label = 32; break;
  case 32: 
   var $239=$i;
   var $240=_SDL_GetNumDisplayModes($239);
   $m=$240;
   var $241=$m;
   var $242=(($241)|(0))==0;
   if ($242) { label = 33; break; } else { label = 34; break; }
  case 33: 
   var $244=HEAP32[((_stderr)>>2)];
   var $245=_fprintf($244, ((976)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 45; break;
  case 34: 
   var $247=HEAP32[((_stderr)>>2)];
   var $248=_fprintf($247, ((936)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   $j=0;
   label = 35; break;
  case 35: 
   var $250=$j;
   var $251=$m;
   var $252=(($250)|(0)) < (($251)|(0));
   if ($252) { label = 36; break; } else { label = 44; break; }
  case 36: 
   var $254=$i;
   var $255=$j;
   var $256=_SDL_GetDisplayMode($254, $255, $mode);
   var $257=(($mode)|0);
   var $258=HEAP32[(($257)>>2)];
   var $259=_SDL_PixelFormatEnumToMasks($258, $bpp, $Rmask, $Gmask, $Bmask, $Amask);
   var $260=HEAP32[((_stderr)>>2)];
   var $261=$j;
   var $262=(($mode+4)|0);
   var $263=HEAP32[(($262)>>2)];
   var $264=(($mode+8)|0);
   var $265=HEAP32[(($264)>>2)];
   var $266=(($mode+12)|0);
   var $267=HEAP32[(($266)>>2)];
   var $268=HEAP32[(($bpp)>>2)];
   var $269=(($mode)|0);
   var $270=HEAP32[(($269)>>2)];
   var $271=_SDL_GetPixelFormatName($270);
   var $272=_fprintf($260, ((880)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 48)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$261,HEAP32[(((tempVarArgs)+(8))>>2)]=$263,HEAP32[(((tempVarArgs)+(16))>>2)]=$265,HEAP32[(((tempVarArgs)+(24))>>2)]=$267,HEAP32[(((tempVarArgs)+(32))>>2)]=$268,HEAP32[(((tempVarArgs)+(40))>>2)]=$271,tempVarArgs)); STACKTOP=tempVarArgs;
   var $273=HEAP32[(($Rmask)>>2)];
   var $274=(($273)|(0))!=0;
   if ($274) { label = 39; break; } else { label = 37; break; }
  case 37: 
   var $276=HEAP32[(($Gmask)>>2)];
   var $277=(($276)|(0))!=0;
   if ($277) { label = 39; break; } else { label = 38; break; }
  case 38: 
   var $279=HEAP32[(($Bmask)>>2)];
   var $280=(($279)|(0))!=0;
   if ($280) { label = 39; break; } else { label = 42; break; }
  case 39: 
   var $282=HEAP32[((_stderr)>>2)];
   var $283=HEAP32[(($Rmask)>>2)];
   var $284=_fprintf($282, ((840)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$283,tempVarArgs)); STACKTOP=tempVarArgs;
   var $285=HEAP32[((_stderr)>>2)];
   var $286=HEAP32[(($Gmask)>>2)];
   var $287=_fprintf($285, ((800)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$286,tempVarArgs)); STACKTOP=tempVarArgs;
   var $288=HEAP32[((_stderr)>>2)];
   var $289=HEAP32[(($Bmask)>>2)];
   var $290=_fprintf($288, ((768)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$289,tempVarArgs)); STACKTOP=tempVarArgs;
   var $291=HEAP32[(($Amask)>>2)];
   var $292=(($291)|(0))!=0;
   if ($292) { label = 40; break; } else { label = 41; break; }
  case 40: 
   var $294=HEAP32[((_stderr)>>2)];
   var $295=HEAP32[(($Amask)>>2)];
   var $296=_fprintf($294, ((736)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$295,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 41; break;
  case 41: 
   label = 42; break;
  case 42: 
   label = 43; break;
  case 43: 
   var $300=$j;
   var $301=((($300)+(1))|0);
   $j=$301;
   label = 35; break;
  case 44: 
   label = 45; break;
  case 45: 
   label = 46; break;
  case 46: 
   var $305=$i;
   var $306=((($305)+(1))|0);
   $i=$306;
   label = 25; break;
  case 47: 
   label = 48; break;
  case 48: 
   var $309=$2;
   var $310=(($309+8)|0);
   var $311=HEAP32[(($310)>>2)];
   var $312=$311 & 4;
   var $313=(($312)|(0))!=0;
   if ($313) { label = 49; break; } else { label = 57; break; }
  case 49: 
   var $315=_SDL_GetNumRenderDrivers();
   $n=$315;
   var $316=$n;
   var $317=(($316)|(0))==0;
   if ($317) { label = 50; break; } else { label = 51; break; }
  case 50: 
   var $319=HEAP32[((_stderr)>>2)];
   var $320=_fprintf($319, ((704)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 56; break;
  case 51: 
   var $322=HEAP32[((_stderr)>>2)];
   var $323=_fprintf($322, ((672)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   $i=0;
   label = 52; break;
  case 52: 
   var $325=$i;
   var $326=$n;
   var $327=(($325)|(0)) < (($326)|(0));
   if ($327) { label = 53; break; } else { label = 55; break; }
  case 53: 
   var $329=$i;
   var $330=_SDL_GetRenderDriverInfo($329, $info);
   _SDLTest_PrintRenderer($info);
   label = 54; break;
  case 54: 
   var $332=$i;
   var $333=((($332)+(1))|0);
   $i=$333;
   label = 52; break;
  case 55: 
   label = 56; break;
  case 56: 
   label = 57; break;
  case 57: 
   var $337=$fullscreen_mode;
   var $338=_SDL_memset($337, 0, 20);
   var $339=$2;
   var $340=(($339+76)|0);
   var $341=HEAP32[(($340)>>2)];
   if ((($341)|(0))==8) {
    label = 58; break;
   }
   else if ((($341)|(0))==15) {
    label = 59; break;
   }
   else if ((($341)|(0))==16) {
    label = 60; break;
   }
   else if ((($341)|(0))==24) {
    label = 61; break;
   }
   else {
   label = 62; break;
   }
  case 58: 
   var $343=(($fullscreen_mode)|0);
   HEAP32[(($343)>>2)]=318769153;
   label = 63; break;
  case 59: 
   var $345=(($fullscreen_mode)|0);
   HEAP32[(($345)>>2)]=353570562;
   label = 63; break;
  case 60: 
   var $347=(($fullscreen_mode)|0);
   HEAP32[(($347)>>2)]=353701890;
   label = 63; break;
  case 61: 
   var $349=(($fullscreen_mode)|0);
   HEAP32[(($349)>>2)]=386930691;
   label = 63; break;
  case 62: 
   var $351=(($fullscreen_mode)|0);
   HEAP32[(($351)>>2)]=370546692;
   label = 63; break;
  case 63: 
   var $353=$2;
   var $354=(($353+80)|0);
   var $355=HEAP32[(($354)>>2)];
   var $356=(($fullscreen_mode+12)|0);
   HEAP32[(($356)>>2)]=$355;
   var $357=$2;
   var $358=(($357+84)|0);
   var $359=HEAP32[(($358)>>2)];
   var $360=($359<<2);
   var $361=_SDL_malloc($360);
   var $362=$361;
   var $363=$2;
   var $364=(($363+88)|0);
   HEAP32[(($364)>>2)]=$362;
   var $365=$2;
   var $366=(($365+84)|0);
   var $367=HEAP32[(($366)>>2)];
   var $368=($367<<2);
   var $369=_SDL_malloc($368);
   var $370=$369;
   var $371=$2;
   var $372=(($371+104)|0);
   HEAP32[(($372)>>2)]=$370;
   var $373=$2;
   var $374=(($373+88)|0);
   var $375=HEAP32[(($374)>>2)];
   var $376=(($375)|(0))!=0;
   if ($376) { label = 64; break; } else { label = 65; break; }
  case 64: 
   var $378=$2;
   var $379=(($378+104)|0);
   var $380=HEAP32[(($379)>>2)];
   var $381=(($380)|(0))!=0;
   if ($381) { label = 66; break; } else { label = 65; break; }
  case 65: 
   var $383=HEAP32[((_stderr)>>2)];
   var $384=_fprintf($383, ((656)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   $1=0;
   label = 136; break;
  case 66: 
   $i=0;
   label = 67; break;
  case 67: 
   var $387=$i;
   var $388=$2;
   var $389=(($388+84)|0);
   var $390=HEAP32[(($389)>>2)];
   var $391=(($387)|(0)) < (($390)|(0));
   if ($391) { label = 68; break; } else { label = 115; break; }
  case 68: 
   var $393=$2;
   var $394=(($393+84)|0);
   var $395=HEAP32[(($394)>>2)];
   var $396=(($395)|(0)) > 1;
   if ($396) { label = 69; break; } else { label = 70; break; }
  case 69: 
   var $398=(($title)|0);
   var $399=$2;
   var $400=(($399+20)|0);
   var $401=HEAP32[(($400)>>2)];
   var $402=$i;
   var $403=((($402)+(1))|0);
   var $404=_SDL_snprintf($398, 1024, ((648)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 16)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$401,HEAP32[(((tempVarArgs)+(8))>>2)]=$403,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 71; break;
  case 70: 
   var $406=(($title)|0);
   var $407=$2;
   var $408=(($407+20)|0);
   var $409=HEAP32[(($408)>>2)];
   var $410=_SDL_strlcpy($406, $409, 1024);
   label = 71; break;
  case 71: 
   var $412=(($title)|0);
   var $413=$2;
   var $414=(($413+32)|0);
   var $415=HEAP32[(($414)>>2)];
   var $416=$2;
   var $417=(($416+36)|0);
   var $418=HEAP32[(($417)>>2)];
   var $419=$2;
   var $420=(($419+40)|0);
   var $421=HEAP32[(($420)>>2)];
   var $422=$2;
   var $423=(($422+44)|0);
   var $424=HEAP32[(($423)>>2)];
   var $425=$2;
   var $426=(($425+28)|0);
   var $427=HEAP32[(($426)>>2)];
   var $428=_SDL_CreateWindow($412, $415, $418, $421, $424, $427);
   var $429=$i;
   var $430=$2;
   var $431=(($430+88)|0);
   var $432=HEAP32[(($431)>>2)];
   var $433=(($432+($429<<2))|0);
   HEAP32[(($433)>>2)]=$428;
   var $434=$i;
   var $435=$2;
   var $436=(($435+88)|0);
   var $437=HEAP32[(($436)>>2)];
   var $438=(($437+($434<<2))|0);
   var $439=HEAP32[(($438)>>2)];
   var $440=(($439)|(0))!=0;
   if ($440) { label = 73; break; } else { label = 72; break; }
  case 72: 
   var $442=HEAP32[((_stderr)>>2)];
   var $443=_SDL_GetError();
   var $444=_fprintf($442, ((608)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$443,tempVarArgs)); STACKTOP=tempVarArgs;
   $1=0;
   label = 136; break;
  case 73: 
   var $446=$2;
   var $447=(($446+48)|0);
   var $448=HEAP32[(($447)>>2)];
   var $449=(($448)|(0))!=0;
   if ($449) { label = 75; break; } else { label = 74; break; }
  case 74: 
   var $451=$2;
   var $452=(($451+52)|0);
   var $453=HEAP32[(($452)>>2)];
   var $454=(($453)|(0))!=0;
   if ($454) { label = 75; break; } else { label = 76; break; }
  case 75: 
   var $456=$i;
   var $457=$2;
   var $458=(($457+88)|0);
   var $459=HEAP32[(($458)>>2)];
   var $460=(($459+($456<<2))|0);
   var $461=HEAP32[(($460)>>2)];
   var $462=$2;
   var $463=(($462+48)|0);
   var $464=HEAP32[(($463)>>2)];
   var $465=$2;
   var $466=(($465+52)|0);
   var $467=HEAP32[(($466)>>2)];
   _SDL_SetWindowMinimumSize($461, $464, $467);
   label = 76; break;
  case 76: 
   var $469=$2;
   var $470=(($469+56)|0);
   var $471=HEAP32[(($470)>>2)];
   var $472=(($471)|(0))!=0;
   if ($472) { label = 78; break; } else { label = 77; break; }
  case 77: 
   var $474=$2;
   var $475=(($474+60)|0);
   var $476=HEAP32[(($475)>>2)];
   var $477=(($476)|(0))!=0;
   if ($477) { label = 78; break; } else { label = 79; break; }
  case 78: 
   var $479=$i;
   var $480=$2;
   var $481=(($480+88)|0);
   var $482=HEAP32[(($481)>>2)];
   var $483=(($482+($479<<2))|0);
   var $484=HEAP32[(($483)>>2)];
   var $485=$2;
   var $486=(($485+56)|0);
   var $487=HEAP32[(($486)>>2)];
   var $488=$2;
   var $489=(($488+60)|0);
   var $490=HEAP32[(($489)>>2)];
   _SDL_SetWindowMaximumSize($484, $487, $490);
   label = 79; break;
  case 79: 
   var $492=$i;
   var $493=$2;
   var $494=(($493+88)|0);
   var $495=HEAP32[(($494)>>2)];
   var $496=(($495+($492<<2))|0);
   var $497=HEAP32[(($496)>>2)];
   _SDL_GetWindowSize($497, $w, $h);
   var $498=$2;
   var $499=(($498+28)|0);
   var $500=HEAP32[(($499)>>2)];
   var $501=$500 & 32;
   var $502=(($501)|(0))!=0;
   if ($502) { label = 83; break; } else { label = 80; break; }
  case 80: 
   var $504=HEAP32[(($w)>>2)];
   var $505=$2;
   var $506=(($505+40)|0);
   var $507=HEAP32[(($506)>>2)];
   var $508=(($504)|(0))!=(($507)|(0));
   if ($508) { label = 82; break; } else { label = 81; break; }
  case 81: 
   var $510=HEAP32[(($h)>>2)];
   var $511=$2;
   var $512=(($511+44)|0);
   var $513=HEAP32[(($512)>>2)];
   var $514=(($510)|(0))!=(($513)|(0));
   if ($514) { label = 82; break; } else { label = 83; break; }
  case 82: 
   var $516=$2;
   var $517=(($516+40)|0);
   var $518=HEAP32[(($517)>>2)];
   var $519=$2;
   var $520=(($519+44)|0);
   var $521=HEAP32[(($520)>>2)];
   var $522=HEAP32[(($w)>>2)];
   var $523=HEAP32[(($h)>>2)];
   var $524=_printf(((568)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 32)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$518,HEAP32[(((tempVarArgs)+(8))>>2)]=$521,HEAP32[(((tempVarArgs)+(16))>>2)]=$522,HEAP32[(((tempVarArgs)+(24))>>2)]=$523,tempVarArgs)); STACKTOP=tempVarArgs;
   var $525=HEAP32[(($w)>>2)];
   var $526=$2;
   var $527=(($526+40)|0);
   HEAP32[(($527)>>2)]=$525;
   var $528=HEAP32[(($h)>>2)];
   var $529=$2;
   var $530=(($529+44)|0);
   HEAP32[(($530)>>2)]=$528;
   label = 83; break;
  case 83: 
   var $532=$i;
   var $533=$2;
   var $534=(($533+88)|0);
   var $535=HEAP32[(($534)>>2)];
   var $536=(($535+($532<<2))|0);
   var $537=HEAP32[(($536)>>2)];
   var $538=_SDL_SetWindowDisplayMode($537, $fullscreen_mode);
   var $539=(($538)|(0)) < 0;
   if ($539) { label = 84; break; } else { label = 85; break; }
  case 84: 
   var $541=HEAP32[((_stderr)>>2)];
   var $542=_SDL_GetError();
   var $543=_fprintf($541, ((520)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$542,tempVarArgs)); STACKTOP=tempVarArgs;
   $1=0;
   label = 136; break;
  case 85: 
   var $545=$2;
   var $546=(($545+24)|0);
   var $547=HEAP32[(($546)>>2)];
   var $548=(($547)|(0))!=0;
   if ($548) { label = 86; break; } else { label = 89; break; }
  case 86: 
   var $550=$2;
   var $551=(($550+24)|0);
   var $552=HEAP32[(($551)>>2)];
   var $553=_SDLTest_LoadIcon($552);
   $icon=$553;
   var $554=$icon;
   var $555=(($554)|(0))!=0;
   if ($555) { label = 87; break; } else { label = 88; break; }
  case 87: 
   var $557=$i;
   var $558=$2;
   var $559=(($558+88)|0);
   var $560=HEAP32[(($559)>>2)];
   var $561=(($560+($557<<2))|0);
   var $562=HEAP32[(($561)>>2)];
   var $563=$icon;
   _SDL_SetWindowIcon($562, $563);
   var $564=$icon;
   _SDL_FreeSurface($564);
   label = 88; break;
  case 88: 
   label = 89; break;
  case 89: 
   var $567=$i;
   var $568=$2;
   var $569=(($568+88)|0);
   var $570=HEAP32[(($569)>>2)];
   var $571=(($570+($567<<2))|0);
   var $572=HEAP32[(($571)>>2)];
   _SDL_ShowWindow($572);
   var $573=$i;
   var $574=$2;
   var $575=(($574+104)|0);
   var $576=HEAP32[(($575)>>2)];
   var $577=(($576+($573<<2))|0);
   HEAP32[(($577)>>2)]=0;
   var $578=$2;
   var $579=(($578+100)|0);
   var $580=HEAP32[(($579)>>2)];
   var $581=(($580)|(0))!=0;
   if ($581) { label = 113; break; } else { label = 90; break; }
  case 90: 
   var $583=$2;
   var $584=(($583+92)|0);
   var $585=HEAP32[(($584)>>2)];
   var $586=(($585)|(0))!=0;
   if ($586) { label = 92; break; } else { label = 91; break; }
  case 91: 
   var $588=$2;
   var $589=(($588+28)|0);
   var $590=HEAP32[(($589)>>2)];
   var $591=$590 & 2;
   var $592=(($591)|(0))!=0;
   if ($592) { label = 113; break; } else { label = 92; break; }
  case 92: 
   $m=-1;
   var $594=$2;
   var $595=(($594+92)|0);
   var $596=HEAP32[(($595)>>2)];
   var $597=(($596)|(0))!=0;
   if ($597) { label = 93; break; } else { label = 102; break; }
  case 93: 
   var $599=_SDL_GetNumRenderDrivers();
   $n=$599;
   $j=0;
   label = 94; break;
  case 94: 
   var $601=$j;
   var $602=$n;
   var $603=(($601)|(0)) < (($602)|(0));
   if ($603) { label = 95; break; } else { label = 99; break; }
  case 95: 
   var $605=$j;
   var $606=_SDL_GetRenderDriverInfo($605, $info1);
   var $607=(($info1)|0);
   var $608=HEAP32[(($607)>>2)];
   var $609=$2;
   var $610=(($609+92)|0);
   var $611=HEAP32[(($610)>>2)];
   var $612=_SDL_strcasecmp($608, $611);
   var $613=(($612)|(0))==0;
   if ($613) { label = 96; break; } else { label = 97; break; }
  case 96: 
   var $615=$j;
   $m=$615;
   label = 99; break;
  case 97: 
   label = 98; break;
  case 98: 
   var $618=$j;
   var $619=((($618)+(1))|0);
   $j=$619;
   label = 94; break;
  case 99: 
   var $621=$m;
   var $622=$n;
   var $623=(($621)|(0))==(($622)|(0));
   if ($623) { label = 100; break; } else { label = 101; break; }
  case 100: 
   var $625=HEAP32[((_stderr)>>2)];
   var $626=$2;
   var $627=(($626+92)|0);
   var $628=HEAP32[(($627)>>2)];
   var $629=_fprintf($625, ((472)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$628,tempVarArgs)); STACKTOP=tempVarArgs;
   $1=0;
   label = 136; break;
  case 101: 
   label = 102; break;
  case 102: 
   var $632=$i;
   var $633=$2;
   var $634=(($633+88)|0);
   var $635=HEAP32[(($634)>>2)];
   var $636=(($635+($632<<2))|0);
   var $637=HEAP32[(($636)>>2)];
   var $638=$m;
   var $639=$2;
   var $640=(($639+96)|0);
   var $641=HEAP32[(($640)>>2)];
   var $642=_SDL_CreateRenderer($637, $638, $641);
   var $643=$i;
   var $644=$2;
   var $645=(($644+104)|0);
   var $646=HEAP32[(($645)>>2)];
   var $647=(($646+($643<<2))|0);
   HEAP32[(($647)>>2)]=$642;
   var $648=$i;
   var $649=$2;
   var $650=(($649+104)|0);
   var $651=HEAP32[(($650)>>2)];
   var $652=(($651+($648<<2))|0);
   var $653=HEAP32[(($652)>>2)];
   var $654=(($653)|(0))!=0;
   if ($654) { label = 104; break; } else { label = 103; break; }
  case 103: 
   var $656=HEAP32[((_stderr)>>2)];
   var $657=_SDL_GetError();
   var $658=_fprintf($656, ((440)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$657,tempVarArgs)); STACKTOP=tempVarArgs;
   $1=0;
   label = 136; break;
  case 104: 
   var $660=$2;
   var $661=(($660+64)|0);
   var $662=HEAP32[(($661)>>2)];
   var $663=(($662)|(0))!=0;
   if ($663) { label = 105; break; } else { label = 107; break; }
  case 105: 
   var $665=$2;
   var $666=(($665+68)|0);
   var $667=HEAP32[(($666)>>2)];
   var $668=(($667)|(0))!=0;
   if ($668) { label = 106; break; } else { label = 107; break; }
  case 106: 
   var $670=$i;
   var $671=$2;
   var $672=(($671+104)|0);
   var $673=HEAP32[(($672)>>2)];
   var $674=(($673+($670<<2))|0);
   var $675=HEAP32[(($674)>>2)];
   var $676=$2;
   var $677=(($676+64)|0);
   var $678=HEAP32[(($677)>>2)];
   var $679=$2;
   var $680=(($679+68)|0);
   var $681=HEAP32[(($680)>>2)];
   var $682=_SDL_RenderSetLogicalSize($675, $678, $681);
   label = 110; break;
  case 107: 
   var $684=$2;
   var $685=(($684+72)|0);
   var $686=HEAPF32[(($685)>>2)];
   var $687=$686 != 0;
   if ($687) { label = 108; break; } else { label = 109; break; }
  case 108: 
   var $689=$i;
   var $690=$2;
   var $691=(($690+104)|0);
   var $692=HEAP32[(($691)>>2)];
   var $693=(($692+($689<<2))|0);
   var $694=HEAP32[(($693)>>2)];
   var $695=$2;
   var $696=(($695+72)|0);
   var $697=HEAPF32[(($696)>>2)];
   var $698=$2;
   var $699=(($698+72)|0);
   var $700=HEAPF32[(($699)>>2)];
   var $701=_SDL_RenderSetScale($694, $697, $700);
   label = 109; break;
  case 109: 
   label = 110; break;
  case 110: 
   var $704=$2;
   var $705=(($704+8)|0);
   var $706=HEAP32[(($705)>>2)];
   var $707=$706 & 4;
   var $708=(($707)|(0))!=0;
   if ($708) { label = 111; break; } else { label = 112; break; }
  case 111: 
   var $710=HEAP32[((_stderr)>>2)];
   var $711=_fprintf($710, ((416)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   var $712=$i;
   var $713=$2;
   var $714=(($713+104)|0);
   var $715=HEAP32[(($714)>>2)];
   var $716=(($715+($712<<2))|0);
   var $717=HEAP32[(($716)>>2)];
   var $718=_SDL_GetRendererInfo($717, $info2);
   _SDLTest_PrintRenderer($info2);
   label = 112; break;
  case 112: 
   label = 113; break;
  case 113: 
   label = 114; break;
  case 114: 
   var $722=$i;
   var $723=((($722)+(1))|0);
   $i=$723;
   label = 67; break;
  case 115: 
   label = 116; break;
  case 116: 
   var $726=$2;
   var $727=(($726+4)|0);
   var $728=HEAP32[(($727)>>2)];
   var $729=$728 & 16;
   var $730=(($729)|(0))!=0;
   if ($730) { label = 117; break; } else { label = 135; break; }
  case 117: 
   var $732=$2;
   var $733=(($732+8)|0);
   var $734=HEAP32[(($733)>>2)];
   var $735=$734 & 16;
   var $736=(($735)|(0))!=0;
   if ($736) { label = 118; break; } else { label = 128; break; }
  case 118: 
   var $738=_SDL_GetNumAudioDrivers();
   $n=$738;
   var $739=$n;
   var $740=(($739)|(0))==0;
   if ($740) { label = 119; break; } else { label = 120; break; }
  case 119: 
   var $742=HEAP32[((_stderr)>>2)];
   var $743=_fprintf($742, ((384)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 127; break;
  case 120: 
   var $745=HEAP32[((_stderr)>>2)];
   var $746=_fprintf($745, ((360)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   $i=0;
   label = 121; break;
  case 121: 
   var $748=$i;
   var $749=$n;
   var $750=(($748)|(0)) < (($749)|(0));
   if ($750) { label = 122; break; } else { label = 126; break; }
  case 122: 
   var $752=$i;
   var $753=(($752)|(0)) > 0;
   if ($753) { label = 123; break; } else { label = 124; break; }
  case 123: 
   var $755=HEAP32[((_stderr)>>2)];
   var $756=_fprintf($755, ((1360)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 124; break;
  case 124: 
   var $758=HEAP32[((_stderr)>>2)];
   var $759=$i;
   var $760=_SDL_GetAudioDriver($759);
   var $761=_fprintf($758, ((1352)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$760,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 125; break;
  case 125: 
   var $763=$i;
   var $764=((($763)+(1))|0);
   $i=$764;
   label = 121; break;
  case 126: 
   var $766=HEAP32[((_stderr)>>2)];
   var $767=_fprintf($766, ((1344)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 127; break;
  case 127: 
   label = 128; break;
  case 128: 
   var $770=$2;
   var $771=(($770+108)|0);
   var $772=HEAP32[(($771)>>2)];
   var $773=_SDL_AudioInit($772);
   var $774=(($773)|(0)) < 0;
   if ($774) { label = 129; break; } else { label = 130; break; }
  case 129: 
   var $776=HEAP32[((_stderr)>>2)];
   var $777=_SDL_GetError();
   var $778=_fprintf($776, ((320)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$777,tempVarArgs)); STACKTOP=tempVarArgs;
   $1=0;
   label = 136; break;
  case 130: 
   var $780=$2;
   var $781=(($780+8)|0);
   var $782=HEAP32[(($781)>>2)];
   var $783=$782 & 1;
   var $784=(($783)|(0))!=0;
   if ($784) { label = 131; break; } else { label = 132; break; }
  case 131: 
   var $786=HEAP32[((_stderr)>>2)];
   var $787=_SDL_GetCurrentAudioDriver();
   var $788=_fprintf($786, ((296)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$787,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 132; break;
  case 132: 
   var $790=$2;
   var $791=(($790+112)|0);
   var $792=_SDL_OpenAudio($791, 0);
   var $793=(($792)|(0)) < 0;
   if ($793) { label = 133; break; } else { label = 134; break; }
  case 133: 
   var $795=HEAP32[((_stderr)>>2)];
   var $796=_SDL_GetError();
   var $797=_fprintf($795, ((248)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$796,tempVarArgs)); STACKTOP=tempVarArgs;
   $1=0;
   label = 136; break;
  case 134: 
   label = 135; break;
  case 135: 
   $1=1;
   label = 136; break;
  case 136: 
   var $801=$1;
   STACKTOP = sp;
   return $801;
  default: assert(0, "bad label: " + label);
 }
}
function _SDLTest_PrintRenderer($info) {
 var label = 0;
 var tempVarArgs = 0;
 var sp  = STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1) switch(label) {
  case 1: 
   var $1;
   var $i;
   var $count;
   var $flag;
   $1=$info;
   var $2=HEAP32[((_stderr)>>2)];
   var $3=$1;
   var $4=(($3)|0);
   var $5=HEAP32[(($4)>>2)];
   var $6=_fprintf($2, ((3576)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$5,tempVarArgs)); STACKTOP=tempVarArgs;
   var $7=HEAP32[((_stderr)>>2)];
   var $8=$1;
   var $9=(($8+4)|0);
   var $10=HEAP32[(($9)>>2)];
   var $11=_fprintf($7, ((3552)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$10,tempVarArgs)); STACKTOP=tempVarArgs;
   var $12=HEAP32[((_stderr)>>2)];
   var $13=_fprintf($12, ((3544)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   $count=0;
   $i=0;
   label = 2; break;
  case 2: 
   var $15=$i;
   var $16=(($15)>>>(0)) < 32;
   if ($16) { label = 3; break; } else { label = 9; break; }
  case 3: 
   var $18=$i;
   var $19=1 << $18;
   $flag=$19;
   var $20=$1;
   var $21=(($20+4)|0);
   var $22=HEAP32[(($21)>>2)];
   var $23=$flag;
   var $24=$22 & $23;
   var $25=(($24)|(0))!=0;
   if ($25) { label = 4; break; } else { label = 7; break; }
  case 4: 
   var $27=$count;
   var $28=(($27)|(0)) > 0;
   if ($28) { label = 5; break; } else { label = 6; break; }
  case 5: 
   var $30=HEAP32[((_stderr)>>2)];
   var $31=_fprintf($30, ((3536)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 6; break;
  case 6: 
   var $33=$flag;
   _SDLTest_PrintRendererFlag($33);
   var $34=$count;
   var $35=((($34)+(1))|0);
   $count=$35;
   label = 7; break;
  case 7: 
   label = 8; break;
  case 8: 
   var $38=$i;
   var $39=((($38)+(1))|0);
   $i=$39;
   label = 2; break;
  case 9: 
   var $41=HEAP32[((_stderr)>>2)];
   var $42=_fprintf($41, ((3512)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   var $43=HEAP32[((_stderr)>>2)];
   var $44=$1;
   var $45=(($44+8)|0);
   var $46=HEAP32[(($45)>>2)];
   var $47=_fprintf($43, ((3480)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$46,tempVarArgs)); STACKTOP=tempVarArgs;
   $i=0;
   label = 10; break;
  case 10: 
   var $49=$i;
   var $50=$1;
   var $51=(($50+8)|0);
   var $52=HEAP32[(($51)>>2)];
   var $53=(($49)|(0)) < (($52)|(0));
   if ($53) { label = 11; break; } else { label = 15; break; }
  case 11: 
   var $55=$i;
   var $56=(($55)|(0)) > 0;
   if ($56) { label = 12; break; } else { label = 13; break; }
  case 12: 
   var $58=HEAP32[((_stderr)>>2)];
   var $59=_fprintf($58, ((3472)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 13; break;
  case 13: 
   var $61=$i;
   var $62=$1;
   var $63=(($62+12)|0);
   var $64=(($63+($61<<2))|0);
   var $65=HEAP32[(($64)>>2)];
   _SDLTest_PrintPixelFormat($65);
   label = 14; break;
  case 14: 
   var $67=$i;
   var $68=((($67)+(1))|0);
   $i=$68;
   label = 10; break;
  case 15: 
   var $70=HEAP32[((_stderr)>>2)];
   var $71=_fprintf($70, ((1344)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   var $72=$1;
   var $73=(($72+76)|0);
   var $74=HEAP32[(($73)>>2)];
   var $75=(($74)|(0))!=0;
   if ($75) { label = 17; break; } else { label = 16; break; }
  case 16: 
   var $77=$1;
   var $78=(($77+80)|0);
   var $79=HEAP32[(($78)>>2)];
   var $80=(($79)|(0))!=0;
   if ($80) { label = 17; break; } else { label = 18; break; }
  case 17: 
   var $82=HEAP32[((_stderr)>>2)];
   var $83=$1;
   var $84=(($83+76)|0);
   var $85=HEAP32[(($84)>>2)];
   var $86=$1;
   var $87=(($86+80)|0);
   var $88=HEAP32[(($87)>>2)];
   var $89=_fprintf($82, ((3440)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 16)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$85,HEAP32[(((tempVarArgs)+(8))>>2)]=$88,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 18; break;
  case 18: 
   STACKTOP = sp;
   return;
  default: assert(0, "bad label: " + label);
 }
}
function _SDLTest_LoadIcon($file) {
 var label = 0;
 var tempVarArgs = 0;
 var sp  = STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1) switch(label) {
  case 1: 
   var $1;
   var $2;
   var $icon;
   $2=$file;
   var $3=$2;
   var $4=_SDL_RWFromFile($3, ((3616)|0));
   var $5=_IMG_Load_RW($4, 1);
   $icon=$5;
   var $6=$icon;
   var $7=(($6)|(0))==0;
   if ($7) { label = 2; break; } else { label = 3; break; }
  case 2: 
   var $9=HEAP32[((_stderr)>>2)];
   var $10=$2;
   var $11=_SDL_GetError();
   var $12=_fprintf($9, ((3592)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 16)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$10,HEAP32[(((tempVarArgs)+(8))>>2)]=$11,tempVarArgs)); STACKTOP=tempVarArgs;
   $1=0;
   label = 6; break;
  case 3: 
   var $14=$icon;
   var $15=(($14+4)|0);
   var $16=HEAP32[(($15)>>2)];
   var $17=(($16+4)|0);
   var $18=HEAP32[(($17)>>2)];
   var $19=(($18)|(0))!=0;
   if ($19) { label = 4; break; } else { label = 5; break; }
  case 4: 
   var $21=$icon;
   var $22=$icon;
   var $23=(($22+20)|0);
   var $24=HEAP32[(($23)>>2)];
   var $25=HEAP8[($24)];
   var $26=(($25)&(255));
   var $27=_SDL_SetColorKey($21, 1, $26);
   label = 5; break;
  case 5: 
   var $29=$icon;
   $1=$29;
   label = 6; break;
  case 6: 
   var $31=$1;
   STACKTOP = sp;
   return $31;
  default: assert(0, "bad label: " + label);
 }
}
function _SDLTest_CommonEvent($state, $event, $done) {
 var label = 0;
 var tempVarArgs = 0;
 var sp  = STACKTOP; STACKTOP = (STACKTOP + 320)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1) switch(label) {
  case 1: 
   var $1;
   var $2;
   var $3;
   var $4;
   var $i;
   var $window;
   var $window1;
   var $window2;
   var $w=sp;
   var $h=(sp)+(8);
   var $window3;
   var $w4=(sp)+(16);
   var $h5=(sp)+(24);
   var $w6=(sp)+(32);
   var $h7=(sp)+(40);
   var $clip=(sp)+(48);
   var $text;
   var $window8;
   var $window9;
   var $flags;
   var $window10;
   var $window11;
   var $flags12;
   var $window13;
   var $flags14;
   var $window15;
   var $flags16;
   var $b;
   var $window17;
   var $message=(sp)+(64);
   var $window18;
   $2=$state;
   $3=$event;
   $4=$done;
   var $5=$2;
   var $6=(($5+8)|0);
   var $7=HEAP32[(($6)>>2)];
   var $8=$7 & 8;
   var $9=(($8)|(0))!=0;
   if ($9) { label = 2; break; } else { label = 3; break; }
  case 2: 
   var $11=$3;
   _SDLTest_PrintEvent($11);
   label = 3; break;
  case 3: 
   var $13=$3;
   var $14=$13;
   var $15=HEAP32[(($14)>>2)];
   if ((($15)|(0))==512) {
    label = 4; break;
   }
   else if ((($15)|(0))==768) {
    label = 9; break;
   }
   else if ((($15)|(0))==256) {
    label = 107; break;
   }
   else if ((($15)|(0))==1024) {
    label = 108; break;
   }
   else {
   label = 109; break;
   }
  case 4: 
   var $17=$3;
   var $18=$17;
   var $19=(($18+12)|0);
   var $20=HEAP8[($19)];
   var $21=(($20)&(255));
   if ((($21)|(0))==14) {
    label = 5; break;
   }
   else {
   label = 8; break;
   }
  case 5: 
   var $23=$3;
   var $24=$23;
   var $25=(($24+8)|0);
   var $26=HEAP32[(($25)>>2)];
   var $27=_SDL_GetWindowFromID($26);
   $window=$27;
   var $28=$window;
   var $29=(($28)|(0))!=0;
   if ($29) { label = 6; break; } else { label = 7; break; }
  case 6: 
   var $31=$window;
   _SDL_DestroyWindow($31);
   label = 7; break;
  case 7: 
   label = 8; break;
  case 8: 
   label = 109; break;
  case 9: 
   var $35=$3;
   var $36=$35;
   var $37=(($36+16)|0);
   var $38=(($37+4)|0);
   var $39=HEAP32[(($38)>>2)];
   if ((($39)|(0))==1073741894) {
    label = 10; break;
   }
   else if ((($39)|(0))==61) {
    label = 19; break;
   }
   else if ((($39)|(0))==45) {
    label = 24; break;
   }
   else if ((($39)|(0))==99) {
    label = 29; break;
   }
   else if ((($39)|(0))==118) {
    label = 46; break;
   }
   else if ((($39)|(0))==103) {
    label = 52; break;
   }
   else if ((($39)|(0))==109) {
    label = 57; break;
   }
   else if ((($39)|(0))==114) {
    label = 65; break;
   }
   else if ((($39)|(0))==122) {
    label = 68; break;
   }
   else if ((($39)|(0))==13) {
    label = 73; break;
   }
   else if ((($39)|(0))==98) {
    label = 89; break;
   }
   else if ((($39)|(0))==48) {
    label = 94; break;
   }
   else if ((($39)|(0))==49) {
    label = 97; break;
   }
   else if ((($39)|(0))==50) {
    label = 100; break;
   }
   else if ((($39)|(0))==27) {
    label = 103; break;
   }
   else if ((($39)|(0))==32) {
    label = 104; break;
   }
   else {
   label = 105; break;
   }
  case 10: 
   var $41=$3;
   var $42=$41;
   var $43=(($42+8)|0);
   var $44=HEAP32[(($43)>>2)];
   var $45=_SDL_GetWindowFromID($44);
   $window1=$45;
   var $46=$window1;
   var $47=(($46)|(0))!=0;
   if ($47) { label = 11; break; } else { label = 18; break; }
  case 11: 
   $i=0;
   label = 12; break;
  case 12: 
   var $50=$i;
   var $51=$2;
   var $52=(($51+84)|0);
   var $53=HEAP32[(($52)>>2)];
   var $54=(($50)|(0)) < (($53)|(0));
   if ($54) { label = 13; break; } else { label = 17; break; }
  case 13: 
   var $56=$window1;
   var $57=$i;
   var $58=$2;
   var $59=(($58+88)|0);
   var $60=HEAP32[(($59)>>2)];
   var $61=(($60+($57<<2))|0);
   var $62=HEAP32[(($61)>>2)];
   var $63=(($56)|(0))==(($62)|(0));
   if ($63) { label = 14; break; } else { label = 15; break; }
  case 14: 
   var $65=$i;
   var $66=$2;
   var $67=(($66+104)|0);
   var $68=HEAP32[(($67)>>2)];
   var $69=(($68+($65<<2))|0);
   var $70=HEAP32[(($69)>>2)];
   _SDLTest_ScreenShot($70);
   label = 15; break;
  case 15: 
   label = 16; break;
  case 16: 
   var $73=$i;
   var $74=((($73)+(1))|0);
   $i=$74;
   label = 12; break;
  case 17: 
   label = 18; break;
  case 18: 
   label = 106; break;
  case 19: 
   var $78=$3;
   var $79=$78;
   var $80=(($79+16)|0);
   var $81=(($80+8)|0);
   var $82=HEAP16[(($81)>>1)];
   var $83=(($82)&(65535));
   var $84=$83 & 192;
   var $85=(($84)|(0))!=0;
   if ($85) { label = 20; break; } else { label = 23; break; }
  case 20: 
   var $87=$3;
   var $88=$87;
   var $89=(($88+8)|0);
   var $90=HEAP32[(($89)>>2)];
   var $91=_SDL_GetWindowFromID($90);
   $window2=$91;
   var $92=$window2;
   var $93=(($92)|(0))!=0;
   if ($93) { label = 21; break; } else { label = 22; break; }
  case 21: 
   var $95=$window2;
   _SDL_GetWindowSize($95, $w, $h);
   var $96=$window2;
   var $97=HEAP32[(($w)>>2)];
   var $98=($97<<1);
   var $99=HEAP32[(($h)>>2)];
   var $100=($99<<1);
   _SDL_SetWindowSize($96, $98, $100);
   label = 22; break;
  case 22: 
   label = 23; break;
  case 23: 
   label = 106; break;
  case 24: 
   var $104=$3;
   var $105=$104;
   var $106=(($105+16)|0);
   var $107=(($106+8)|0);
   var $108=HEAP16[(($107)>>1)];
   var $109=(($108)&(65535));
   var $110=$109 & 192;
   var $111=(($110)|(0))!=0;
   if ($111) { label = 25; break; } else { label = 28; break; }
  case 25: 
   var $113=$3;
   var $114=$113;
   var $115=(($114+8)|0);
   var $116=HEAP32[(($115)>>2)];
   var $117=_SDL_GetWindowFromID($116);
   $window3=$117;
   var $118=$window3;
   var $119=(($118)|(0))!=0;
   if ($119) { label = 26; break; } else { label = 27; break; }
  case 26: 
   var $121=$window3;
   _SDL_GetWindowSize($121, $w4, $h5);
   var $122=$window3;
   var $123=HEAP32[(($w4)>>2)];
   var $124=((((($123)|(0)))/(2))&-1);
   var $125=HEAP32[(($h5)>>2)];
   var $126=((((($125)|(0)))/(2))&-1);
   _SDL_SetWindowSize($122, $124, $126);
   label = 27; break;
  case 27: 
   label = 28; break;
  case 28: 
   label = 106; break;
  case 29: 
   var $130=$3;
   var $131=$130;
   var $132=(($131+16)|0);
   var $133=(($132+8)|0);
   var $134=HEAP16[(($133)>>1)];
   var $135=(($134)&(65535));
   var $136=$135 & 192;
   var $137=(($136)|(0))!=0;
   if ($137) { label = 30; break; } else { label = 31; break; }
  case 30: 
   var $139=_SDL_SetClipboardText(((224)|0));
   var $140=_printf(((192)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 31; break;
  case 31: 
   var $142=$3;
   var $143=$142;
   var $144=(($143+16)|0);
   var $145=(($144+8)|0);
   var $146=HEAP16[(($145)>>1)];
   var $147=(($146)&(65535));
   var $148=$147 & 768;
   var $149=(($148)|(0))!=0;
   if ($149) { label = 32; break; } else { label = 45; break; }
  case 32: 
   $i=0;
   label = 33; break;
  case 33: 
   var $152=$i;
   var $153=$2;
   var $154=(($153+84)|0);
   var $155=HEAP32[(($154)>>2)];
   var $156=(($152)|(0)) < (($155)|(0));
   if ($156) { label = 34; break; } else { label = 44; break; }
  case 34: 
   var $158=$i;
   var $159=$2;
   var $160=(($159+104)|0);
   var $161=HEAP32[(($160)>>2)];
   var $162=(($161+($158<<2))|0);
   var $163=HEAP32[(($162)>>2)];
   var $164=(($163)|(0))!=0;
   if ($164) { label = 35; break; } else { label = 42; break; }
  case 35: 
   var $166=$i;
   var $167=$2;
   var $168=(($167+88)|0);
   var $169=HEAP32[(($168)>>2)];
   var $170=(($169+($166<<2))|0);
   var $171=HEAP32[(($170)>>2)];
   _SDL_GetWindowSize($171, $w6, $h7);
   var $172=$i;
   var $173=$2;
   var $174=(($173+104)|0);
   var $175=HEAP32[(($174)>>2)];
   var $176=(($175+($172<<2))|0);
   var $177=HEAP32[(($176)>>2)];
   _SDL_RenderGetClipRect($177, $clip);
   $1=$clip;
   var $178=$1;
   var $179=(($178)|(0))!=0;
   if ($179) { label = 36; break; } else { var $190 = 1;label = 38; break; }
  case 36: 
   var $181=$1;
   var $182=(($181+8)|0);
   var $183=HEAP32[(($182)>>2)];
   var $184=(($183)|(0)) <= 0;
   if ($184) { var $190 = 1;label = 38; break; } else { label = 37; break; }
  case 37: 
   var $186=$1;
   var $187=(($186+12)|0);
   var $188=HEAP32[(($187)>>2)];
   var $189=(($188)|(0)) <= 0;
   var $190 = $189;label = 38; break;
  case 38: 
   var $190;
   var $191=$190 ? 1 : 0;
   var $192=(($191)|(0))!=0;
   if ($192) { label = 39; break; } else { label = 40; break; }
  case 39: 
   var $194=HEAP32[(($w6)>>2)];
   var $195=((((($194)|(0)))/(4))&-1);
   var $196=(($clip)|0);
   HEAP32[(($196)>>2)]=$195;
   var $197=HEAP32[(($h7)>>2)];
   var $198=((((($197)|(0)))/(4))&-1);
   var $199=(($clip+4)|0);
   HEAP32[(($199)>>2)]=$198;
   var $200=HEAP32[(($w6)>>2)];
   var $201=((((($200)|(0)))/(2))&-1);
   var $202=(($clip+8)|0);
   HEAP32[(($202)>>2)]=$201;
   var $203=HEAP32[(($h7)>>2)];
   var $204=((((($203)|(0)))/(2))&-1);
   var $205=(($clip+12)|0);
   HEAP32[(($205)>>2)]=$204;
   var $206=$i;
   var $207=$2;
   var $208=(($207+104)|0);
   var $209=HEAP32[(($208)>>2)];
   var $210=(($209+($206<<2))|0);
   var $211=HEAP32[(($210)>>2)];
   var $212=_SDL_RenderSetClipRect($211, $clip);
   label = 41; break;
  case 40: 
   var $214=$i;
   var $215=$2;
   var $216=(($215+104)|0);
   var $217=HEAP32[(($216)>>2)];
   var $218=(($217+($214<<2))|0);
   var $219=HEAP32[(($218)>>2)];
   var $220=_SDL_RenderSetClipRect($219, 0);
   label = 41; break;
  case 41: 
   label = 42; break;
  case 42: 
   label = 43; break;
  case 43: 
   var $224=$i;
   var $225=((($224)+(1))|0);
   $i=$225;
   label = 33; break;
  case 44: 
   label = 45; break;
  case 45: 
   label = 106; break;
  case 46: 
   var $229=$3;
   var $230=$229;
   var $231=(($230+16)|0);
   var $232=(($231+8)|0);
   var $233=HEAP16[(($232)>>1)];
   var $234=(($233)&(65535));
   var $235=$234 & 192;
   var $236=(($235)|(0))!=0;
   if ($236) { label = 47; break; } else { label = 51; break; }
  case 47: 
   var $238=_SDL_GetClipboardText();
   $text=$238;
   var $239=$text;
   var $240=HEAP8[($239)];
   var $241=(($240 << 24) >> 24)!=0;
   if ($241) { label = 48; break; } else { label = 49; break; }
  case 48: 
   var $243=$text;
   var $244=_printf(((168)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$243,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 50; break;
  case 49: 
   var $246=_printf(((144)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 50; break;
  case 50: 
   var $248=$text;
   _SDL_free($248);
   label = 51; break;
  case 51: 
   label = 106; break;
  case 52: 
   var $251=$3;
   var $252=$251;
   var $253=(($252+16)|0);
   var $254=(($253+8)|0);
   var $255=HEAP16[(($254)>>1)];
   var $256=(($255)&(65535));
   var $257=$256 & 192;
   var $258=(($257)|(0))!=0;
   if ($258) { label = 53; break; } else { label = 56; break; }
  case 53: 
   var $260=$3;
   var $261=$260;
   var $262=(($261+8)|0);
   var $263=HEAP32[(($262)>>2)];
   var $264=_SDL_GetWindowFromID($263);
   $window8=$264;
   var $265=$window8;
   var $266=(($265)|(0))!=0;
   if ($266) { label = 54; break; } else { label = 55; break; }
  case 54: 
   var $268=$window8;
   var $269=$window8;
   var $270=_SDL_GetWindowGrab($269);
   var $271=(($270)|(0))!=0;
   var $272=$271 ^ 1;
   var $273=$272 ? 1 : 0;
   _SDL_SetWindowGrab($268, $273);
   label = 55; break;
  case 55: 
   label = 56; break;
  case 56: 
   label = 106; break;
  case 57: 
   var $277=$3;
   var $278=$277;
   var $279=(($278+16)|0);
   var $280=(($279+8)|0);
   var $281=HEAP16[(($280)>>1)];
   var $282=(($281)&(65535));
   var $283=$282 & 192;
   var $284=(($283)|(0))!=0;
   if ($284) { label = 58; break; } else { label = 64; break; }
  case 58: 
   var $286=$3;
   var $287=$286;
   var $288=(($287+8)|0);
   var $289=HEAP32[(($288)>>2)];
   var $290=_SDL_GetWindowFromID($289);
   $window9=$290;
   var $291=$window9;
   var $292=(($291)|(0))!=0;
   if ($292) { label = 59; break; } else { label = 63; break; }
  case 59: 
   var $294=$window9;
   var $295;
   $flags=$295;
   var $296=$flags;
   var $297=$296 & 128;
   var $298=(($297)|(0))!=0;
   if ($298) { label = 60; break; } else { label = 61; break; }
  case 60: 
   var $300=$window9;
   _SDL_RestoreWindow($300);
   label = 62; break;
  case 61: 
   var $302=$window9;
   _SDL_MaximizeWindow($302);
   label = 62; break;
  case 62: 
   label = 63; break;
  case 63: 
   label = 64; break;
  case 64: 
   label = 106; break;
  case 65: 
   var $307=$3;
   var $308=$307;
   var $309=(($308+16)|0);
   var $310=(($309+8)|0);
   var $311=HEAP16[(($310)>>1)];
   var $312=(($311)&(65535));
   var $313=$312 & 192;
   var $314=(($313)|(0))!=0;
   if ($314) { label = 66; break; } else { label = 67; break; }
  case 66: 
   var $316=_SDL_GetRelativeMouseMode();
   var $317=(($316)|(0))!=0;
   var $318=$317 ^ 1;
   var $319=$318 ? 1 : 0;
   var $320=_SDL_SetRelativeMouseMode($319);
   label = 67; break;
  case 67: 
   label = 106; break;
  case 68: 
   var $323=$3;
   var $324=$323;
   var $325=(($324+16)|0);
   var $326=(($325+8)|0);
   var $327=HEAP16[(($326)>>1)];
   var $328=(($327)&(65535));
   var $329=$328 & 192;
   var $330=(($329)|(0))!=0;
   if ($330) { label = 69; break; } else { label = 72; break; }
  case 69: 
   var $332=$3;
   var $333=$332;
   var $334=(($333+8)|0);
   var $335=HEAP32[(($334)>>2)];
   var $336=_SDL_GetWindowFromID($335);
   $window10=$336;
   var $337=$window10;
   var $338=(($337)|(0))!=0;
   if ($338) { label = 70; break; } else { label = 71; break; }
  case 70: 
   var $340=$window10;
   _SDL_MinimizeWindow($340);
   label = 71; break;
  case 71: 
   label = 72; break;
  case 72: 
   label = 106; break;
  case 73: 
   var $344=$3;
   var $345=$344;
   var $346=(($345+16)|0);
   var $347=(($346+8)|0);
   var $348=HEAP16[(($347)>>1)];
   var $349=(($348)&(65535));
   var $350=$349 & 192;
   var $351=(($350)|(0))!=0;
   if ($351) { label = 74; break; } else { label = 80; break; }
  case 74: 
   var $353=$3;
   var $354=$353;
   var $355=(($354+8)|0);
   var $356=HEAP32[(($355)>>2)];
   var $357=_SDL_GetWindowFromID($356);
   $window11=$357;
   var $358=$window11;
   var $359=(($358)|(0))!=0;
   if ($359) { label = 75; break; } else { label = 79; break; }
  case 75: 
   var $361=$window11;
   var $362;
   $flags12=$362;
   var $363=$flags12;
   var $364=$363 & 1;
   var $365=(($364)|(0))!=0;
   if ($365) { label = 76; break; } else { label = 77; break; }
  case 76: 
   var $367=$window11;
   var $368=_SDL_SetWindowFullscreen($367, 0);
   label = 78; break;
  case 77: 
   var $370=$window11;
   var $371=_SDL_SetWindowFullscreen($370, 1);
   label = 78; break;
  case 78: 
   label = 79; break;
  case 79: 
   label = 88; break;
  case 80: 
   var $375=$3;
   var $376=$375;
   var $377=(($376+16)|0);
   var $378=(($377+8)|0);
   var $379=HEAP16[(($378)>>1)];
   var $380=(($379)&(65535));
   var $381=$380 & 768;
   var $382=(($381)|(0))!=0;
   if ($382) { label = 81; break; } else { label = 87; break; }
  case 81: 
   var $384=$3;
   var $385=$384;
   var $386=(($385+8)|0);
   var $387=HEAP32[(($386)>>2)];
   var $388=_SDL_GetWindowFromID($387);
   $window13=$388;
   var $389=$window13;
   var $390=(($389)|(0))!=0;
   if ($390) { label = 82; break; } else { label = 86; break; }
  case 82: 
   var $392=$window13;
   var $393;
   $flags14=$393;
   var $394=$flags14;
   var $395=$394 & 1;
   var $396=(($395)|(0))!=0;
   if ($396) { label = 83; break; } else { label = 84; break; }
  case 83: 
   var $398=$window13;
   var $399=_SDL_SetWindowFullscreen($398, 0);
   label = 85; break;
  case 84: 
   var $401=$window13;
   var $402=_SDL_SetWindowFullscreen($401, 4097);
   label = 85; break;
  case 85: 
   label = 86; break;
  case 86: 
   label = 87; break;
  case 87: 
   label = 88; break;
  case 88: 
   label = 106; break;
  case 89: 
   var $408=$3;
   var $409=$408;
   var $410=(($409+16)|0);
   var $411=(($410+8)|0);
   var $412=HEAP16[(($411)>>1)];
   var $413=(($412)&(65535));
   var $414=$413 & 192;
   var $415=(($414)|(0))!=0;
   if ($415) { label = 90; break; } else { label = 93; break; }
  case 90: 
   var $417=$3;
   var $418=$417;
   var $419=(($418+8)|0);
   var $420=HEAP32[(($419)>>2)];
   var $421=_SDL_GetWindowFromID($420);
   $window15=$421;
   var $422=$window15;
   var $423=(($422)|(0))!=0;
   if ($423) { label = 91; break; } else { label = 92; break; }
  case 91: 
   var $425=$window15;
   var $426;
   $flags16=$426;
   var $427=$flags16;
   var $428=$427 & 16;
   var $429=(($428)|(0))!=0;
   var $430=$429 ? 1 : 0;
   $b=$430;
   var $431=$window15;
   var $432=$b;
   _SDL_SetWindowBordered($431, $432);
   label = 92; break;
  case 92: 
   label = 93; break;
  case 93: 
   label = 106; break;
  case 94: 
   var $436=$3;
   var $437=$436;
   var $438=(($437+16)|0);
   var $439=(($438+8)|0);
   var $440=HEAP16[(($439)>>1)];
   var $441=(($440)&(65535));
   var $442=$441 & 192;
   var $443=(($442)|(0))!=0;
   if ($443) { label = 95; break; } else { label = 96; break; }
  case 95: 
   var $445=$3;
   var $446=$445;
   var $447=(($446+8)|0);
   var $448=HEAP32[(($447)>>2)];
   var $449=_SDL_GetWindowFromID($448);
   $window17=$449;
   var $450=$window17;
   var $451=_SDL_ShowSimpleMessageBox(64, ((128)|0), ((112)|0), $450);
   label = 96; break;
  case 96: 
   label = 106; break;
  case 97: 
   var $454=$3;
   var $455=$454;
   var $456=(($455+16)|0);
   var $457=(($456+8)|0);
   var $458=HEAP16[(($457)>>1)];
   var $459=(($458)&(65535));
   var $460=$459 & 192;
   var $461=(($460)|(0))!=0;
   if ($461) { label = 98; break; } else { label = 99; break; }
  case 98: 
   var $463=$3;
   var $464=$463;
   var $465=(($464+8)|0);
   var $466=HEAP32[(($465)>>2)];
   _FullscreenTo(0, $466);
   label = 99; break;
  case 99: 
   label = 106; break;
  case 100: 
   var $469=$3;
   var $470=$469;
   var $471=(($470+16)|0);
   var $472=(($471+8)|0);
   var $473=HEAP16[(($472)>>1)];
   var $474=(($473)&(65535));
   var $475=$474 & 192;
   var $476=(($475)|(0))!=0;
   if ($476) { label = 101; break; } else { label = 102; break; }
  case 101: 
   var $478=$3;
   var $479=$478;
   var $480=(($479+8)|0);
   var $481=HEAP32[(($480)>>2)];
   _FullscreenTo(1, $481);
   label = 102; break;
  case 102: 
   label = 106; break;
  case 103: 
   var $484=$4;
   HEAP32[(($484)>>2)]=1;
   label = 106; break;
  case 104: 
   var $486=$3;
   var $487=$486;
   var $488=(($487+8)|0);
   var $489=HEAP32[(($488)>>2)];
   var $490=_SDL_GetWindowFromID($489);
   $window18=$490;
   var $491=(($message)|0);
   var $492=HEAP32[((((5372)|0))>>2)];
   var $493=HEAP32[((((5376)|0))>>2)];
   var $494=HEAP32[((((5380)|0))>>2)];
   var $495=HEAP32[((((5384)|0))>>2)];
   var $496=_SDL_snprintf($491, 256, ((88)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 32)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$492,HEAP32[(((tempVarArgs)+(8))>>2)]=$493,HEAP32[(((tempVarArgs)+(16))>>2)]=$494,HEAP32[(((tempVarArgs)+(24))>>2)]=$495,tempVarArgs)); STACKTOP=tempVarArgs;
   var $497=(($message)|0);
   var $498=$window18;
   var $499=_SDL_ShowSimpleMessageBox(64, ((64)|0), $497, $498);
   label = 106; break;
  case 105: 
   label = 106; break;
  case 106: 
   label = 109; break;
  case 107: 
   var $503=$4;
   HEAP32[(($503)>>2)]=1;
   label = 109; break;
  case 108: 
   var $505=$3;
   var $506=$505;
   var $507=$506;
   assert(36 % 1 === 0);(_memcpy(5352, $507, 36)|0);
   label = 109; break;
  case 109: 
   STACKTOP = sp;
   return;
  default: assert(0, "bad label: " + label);
 }
}
function _SDLTest_PrintEvent($event) {
 var label = 0;
 var tempVarArgs = 0;
 var sp  = STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1) switch(label) {
  case 1: 
   var $1;
   $1=$event;
   var $2=$1;
   var $3=$2;
   var $4=HEAP32[(($3)>>2)];
   var $5=(($4)|(0))==1024;
   if ($5) { label = 3; break; } else { label = 2; break; }
  case 2: 
   var $7=$1;
   var $8=$7;
   var $9=HEAP32[(($8)>>2)];
   var $10=(($9)|(0))==1794;
   if ($10) { label = 3; break; } else { label = 4; break; }
  case 3: 
   label = 50; break;
  case 4: 
   var $13=HEAP32[((_stderr)>>2)];
   var $14=_fprintf($13, ((5056)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   var $15=$1;
   var $16=$15;
   var $17=HEAP32[(($16)>>2)];
   if ((($17)|(0))==512) {
    label = 5; break;
   }
   else if ((($17)|(0))==768) {
    label = 22; break;
   }
   else if ((($17)|(0))==769) {
    label = 23; break;
   }
   else if ((($17)|(0))==771) {
    label = 24; break;
   }
   else if ((($17)|(0))==1024) {
    label = 25; break;
   }
   else if ((($17)|(0))==1025) {
    label = 26; break;
   }
   else if ((($17)|(0))==1026) {
    label = 27; break;
   }
   else if ((($17)|(0))==1027) {
    label = 28; break;
   }
   else if ((($17)|(0))==1537) {
    label = 29; break;
   }
   else if ((($17)|(0))==1538) {
    label = 30; break;
   }
   else if ((($17)|(0))==1539) {
    label = 42; break;
   }
   else if ((($17)|(0))==1540) {
    label = 43; break;
   }
   else if ((($17)|(0))==2304) {
    label = 44; break;
   }
   else if ((($17)|(0))==1792 | (($17)|(0))==1793) {
    label = 45; break;
   }
   else if ((($17)|(0))==256) {
    label = 46; break;
   }
   else if ((($17)|(0))==32768) {
    label = 47; break;
   }
   else {
   label = 48; break;
   }
  case 5: 
   var $19=$1;
   var $20=$19;
   var $21=(($20+12)|0);
   var $22=HEAP8[($21)];
   var $23=(($22)&(255));
   switch((($23)|(0))) {
   case 1:{
    label = 6; break;
   }
   case 2:{
    label = 7; break;
   }
   case 3:{
    label = 8; break;
   }
   case 4:{
    label = 9; break;
   }
   case 5:{
    label = 10; break;
   }
   case 6:{
    label = 11; break;
   }
   case 7:{
    label = 12; break;
   }
   case 8:{
    label = 13; break;
   }
   case 9:{
    label = 14; break;
   }
   case 10:{
    label = 15; break;
   }
   case 11:{
    label = 16; break;
   }
   case 12:{
    label = 17; break;
   }
   case 13:{
    label = 18; break;
   }
   case 14:{
    label = 19; break;
   }
   default: {
   label = 20; break;
   }
   } break; 
  case 6: 
   var $25=HEAP32[((_stderr)>>2)];
   var $26=$1;
   var $27=$26;
   var $28=(($27+8)|0);
   var $29=HEAP32[(($28)>>2)];
   var $30=_fprintf($25, ((5040)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$29,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 21; break;
  case 7: 
   var $32=HEAP32[((_stderr)>>2)];
   var $33=$1;
   var $34=$33;
   var $35=(($34+8)|0);
   var $36=HEAP32[(($35)>>2)];
   var $37=_fprintf($32, ((5016)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$36,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 21; break;
  case 8: 
   var $39=HEAP32[((_stderr)>>2)];
   var $40=$1;
   var $41=$40;
   var $42=(($41+8)|0);
   var $43=HEAP32[(($42)>>2)];
   var $44=_fprintf($39, ((4992)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$43,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 21; break;
  case 9: 
   var $46=HEAP32[((_stderr)>>2)];
   var $47=$1;
   var $48=$47;
   var $49=(($48+8)|0);
   var $50=HEAP32[(($49)>>2)];
   var $51=$1;
   var $52=$51;
   var $53=(($52+16)|0);
   var $54=HEAP32[(($53)>>2)];
   var $55=$1;
   var $56=$55;
   var $57=(($56+20)|0);
   var $58=HEAP32[(($57)>>2)];
   var $59=_fprintf($46, ((4960)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 24)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$50,HEAP32[(((tempVarArgs)+(8))>>2)]=$54,HEAP32[(((tempVarArgs)+(16))>>2)]=$58,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 21; break;
  case 10: 
   var $61=HEAP32[((_stderr)>>2)];
   var $62=$1;
   var $63=$62;
   var $64=(($63+8)|0);
   var $65=HEAP32[(($64)>>2)];
   var $66=$1;
   var $67=$66;
   var $68=(($67+16)|0);
   var $69=HEAP32[(($68)>>2)];
   var $70=$1;
   var $71=$70;
   var $72=(($71+20)|0);
   var $73=HEAP32[(($72)>>2)];
   var $74=_fprintf($61, ((4928)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 24)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$65,HEAP32[(((tempVarArgs)+(8))>>2)]=$69,HEAP32[(((tempVarArgs)+(16))>>2)]=$73,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 21; break;
  case 11: 
   var $76=HEAP32[((_stderr)>>2)];
   var $77=$1;
   var $78=$77;
   var $79=(($78+8)|0);
   var $80=HEAP32[(($79)>>2)];
   var $81=$1;
   var $82=$81;
   var $83=(($82+16)|0);
   var $84=HEAP32[(($83)>>2)];
   var $85=$1;
   var $86=$85;
   var $87=(($86+20)|0);
   var $88=HEAP32[(($87)>>2)];
   var $89=_fprintf($76, ((4880)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 24)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$80,HEAP32[(((tempVarArgs)+(8))>>2)]=$84,HEAP32[(((tempVarArgs)+(16))>>2)]=$88,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 21; break;
  case 12: 
   var $91=HEAP32[((_stderr)>>2)];
   var $92=$1;
   var $93=$92;
   var $94=(($93+8)|0);
   var $95=HEAP32[(($94)>>2)];
   var $96=_fprintf($91, ((4856)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$95,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 21; break;
  case 13: 
   var $98=HEAP32[((_stderr)>>2)];
   var $99=$1;
   var $100=$99;
   var $101=(($100+8)|0);
   var $102=HEAP32[(($101)>>2)];
   var $103=_fprintf($98, ((4832)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$102,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 21; break;
  case 14: 
   var $105=HEAP32[((_stderr)>>2)];
   var $106=$1;
   var $107=$106;
   var $108=(($107+8)|0);
   var $109=HEAP32[(($108)>>2)];
   var $110=_fprintf($105, ((4800)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$109,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 21; break;
  case 15: 
   var $112=HEAP32[((_stderr)>>2)];
   var $113=$1;
   var $114=$113;
   var $115=(($114+8)|0);
   var $116=HEAP32[(($115)>>2)];
   var $117=_fprintf($112, ((4776)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$116,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 21; break;
  case 16: 
   var $119=HEAP32[((_stderr)>>2)];
   var $120=$1;
   var $121=$120;
   var $122=(($121+8)|0);
   var $123=HEAP32[(($122)>>2)];
   var $124=_fprintf($119, ((4752)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$123,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 21; break;
  case 17: 
   var $126=HEAP32[((_stderr)>>2)];
   var $127=$1;
   var $128=$127;
   var $129=(($128+8)|0);
   var $130=HEAP32[(($129)>>2)];
   var $131=_fprintf($126, ((4720)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$130,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 21; break;
  case 18: 
   var $133=HEAP32[((_stderr)>>2)];
   var $134=$1;
   var $135=$134;
   var $136=(($135+8)|0);
   var $137=HEAP32[(($136)>>2)];
   var $138=_fprintf($133, ((4688)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$137,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 21; break;
  case 19: 
   var $140=HEAP32[((_stderr)>>2)];
   var $141=$1;
   var $142=$141;
   var $143=(($142+8)|0);
   var $144=HEAP32[(($143)>>2)];
   var $145=_fprintf($140, ((4664)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$144,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 21; break;
  case 20: 
   var $147=HEAP32[((_stderr)>>2)];
   var $148=$1;
   var $149=$148;
   var $150=(($149+8)|0);
   var $151=HEAP32[(($150)>>2)];
   var $152=$1;
   var $153=$152;
   var $154=(($153+12)|0);
   var $155=HEAP8[($154)];
   var $156=(($155)&(255));
   var $157=_fprintf($147, ((4632)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 16)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$151,HEAP32[(((tempVarArgs)+(8))>>2)]=$156,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 21; break;
  case 21: 
   label = 49; break;
  case 22: 
   var $160=HEAP32[((_stderr)>>2)];
   var $161=$1;
   var $162=$161;
   var $163=(($162+8)|0);
   var $164=HEAP32[(($163)>>2)];
   var $165=$1;
   var $166=$165;
   var $167=(($166+16)|0);
   var $168=(($167)|0);
   var $169=HEAP32[(($168)>>2)];
   var $170=$1;
   var $171=$170;
   var $172=(($171+16)|0);
   var $173=(($172)|0);
   var $174=HEAP32[(($173)>>2)];
   var $175=_SDL_GetScancodeName($174);
   var $176=$1;
   var $177=$176;
   var $178=(($177+16)|0);
   var $179=(($178+4)|0);
   var $180=HEAP32[(($179)>>2)];
   var $181=$1;
   var $182=$181;
   var $183=(($182+16)|0);
   var $184=(($183+4)|0);
   var $185=HEAP32[(($184)>>2)];
   var $186=_SDL_GetKeyName($185);
   var $187=_fprintf($160, ((4432)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 40)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$164,HEAP32[(((tempVarArgs)+(8))>>2)]=$169,HEAP32[(((tempVarArgs)+(16))>>2)]=$175,HEAP32[(((tempVarArgs)+(24))>>2)]=$180,HEAP32[(((tempVarArgs)+(32))>>2)]=$186,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 49; break;
  case 23: 
   var $189=HEAP32[((_stderr)>>2)];
   var $190=$1;
   var $191=$190;
   var $192=(($191+8)|0);
   var $193=HEAP32[(($192)>>2)];
   var $194=$1;
   var $195=$194;
   var $196=(($195+16)|0);
   var $197=(($196)|0);
   var $198=HEAP32[(($197)>>2)];
   var $199=$1;
   var $200=$199;
   var $201=(($200+16)|0);
   var $202=(($201)|0);
   var $203=HEAP32[(($202)>>2)];
   var $204=_SDL_GetScancodeName($203);
   var $205=$1;
   var $206=$205;
   var $207=(($206+16)|0);
   var $208=(($207+4)|0);
   var $209=HEAP32[(($208)>>2)];
   var $210=$1;
   var $211=$210;
   var $212=(($211+16)|0);
   var $213=(($212+4)|0);
   var $214=HEAP32[(($213)>>2)];
   var $215=_SDL_GetKeyName($214);
   var $216=_fprintf($189, ((4352)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 40)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$193,HEAP32[(((tempVarArgs)+(8))>>2)]=$198,HEAP32[(((tempVarArgs)+(16))>>2)]=$204,HEAP32[(((tempVarArgs)+(24))>>2)]=$209,HEAP32[(((tempVarArgs)+(32))>>2)]=$215,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 49; break;
  case 24: 
   var $218=HEAP32[((_stderr)>>2)];
   var $219=$1;
   var $220=$219;
   var $221=(($220+12)|0);
   var $222=(($221)|0);
   var $223=$1;
   var $224=$223;
   var $225=(($224+8)|0);
   var $226=HEAP32[(($225)>>2)];
   var $227=_fprintf($218, ((4312)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 16)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$222,HEAP32[(((tempVarArgs)+(8))>>2)]=$226,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 49; break;
  case 25: 
   var $229=HEAP32[((_stderr)>>2)];
   var $230=$1;
   var $231=$230;
   var $232=(($231+20)|0);
   var $233=HEAP32[(($232)>>2)];
   var $234=$1;
   var $235=$234;
   var $236=(($235+24)|0);
   var $237=HEAP32[(($236)>>2)];
   var $238=$1;
   var $239=$238;
   var $240=(($239+28)|0);
   var $241=HEAP32[(($240)>>2)];
   var $242=$1;
   var $243=$242;
   var $244=(($243+32)|0);
   var $245=HEAP32[(($244)>>2)];
   var $246=$1;
   var $247=$246;
   var $248=(($247+8)|0);
   var $249=HEAP32[(($248)>>2)];
   var $250=_fprintf($229, ((4256)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 40)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$233,HEAP32[(((tempVarArgs)+(8))>>2)]=$237,HEAP32[(((tempVarArgs)+(16))>>2)]=$241,HEAP32[(((tempVarArgs)+(24))>>2)]=$245,HEAP32[(((tempVarArgs)+(32))>>2)]=$249,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 49; break;
  case 26: 
   var $252=HEAP32[((_stderr)>>2)];
   var $253=$1;
   var $254=$253;
   var $255=(($254+16)|0);
   var $256=HEAP8[($255)];
   var $257=(($256)&(255));
   var $258=$1;
   var $259=$258;
   var $260=(($259+20)|0);
   var $261=HEAP32[(($260)>>2)];
   var $262=$1;
   var $263=$262;
   var $264=(($263+24)|0);
   var $265=HEAP32[(($264)>>2)];
   var $266=$1;
   var $267=$266;
   var $268=(($267+8)|0);
   var $269=HEAP32[(($268)>>2)];
   var $270=_fprintf($252, ((4208)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 32)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$257,HEAP32[(((tempVarArgs)+(8))>>2)]=$261,HEAP32[(((tempVarArgs)+(16))>>2)]=$265,HEAP32[(((tempVarArgs)+(24))>>2)]=$269,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 49; break;
  case 27: 
   var $272=HEAP32[((_stderr)>>2)];
   var $273=$1;
   var $274=$273;
   var $275=(($274+16)|0);
   var $276=HEAP8[($275)];
   var $277=(($276)&(255));
   var $278=$1;
   var $279=$278;
   var $280=(($279+20)|0);
   var $281=HEAP32[(($280)>>2)];
   var $282=$1;
   var $283=$282;
   var $284=(($283+24)|0);
   var $285=HEAP32[(($284)>>2)];
   var $286=$1;
   var $287=$286;
   var $288=(($287+8)|0);
   var $289=HEAP32[(($288)>>2)];
   var $290=_fprintf($272, ((4160)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 32)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$277,HEAP32[(((tempVarArgs)+(8))>>2)]=$281,HEAP32[(((tempVarArgs)+(16))>>2)]=$285,HEAP32[(((tempVarArgs)+(24))>>2)]=$289,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 49; break;
  case 28: 
   var $292=HEAP32[((_stderr)>>2)];
   var $293=$1;
   var $294=$293;
   var $295=(($294+16)|0);
   var $296=HEAP32[(($295)>>2)];
   var $297=$1;
   var $298=$297;
   var $299=(($298+20)|0);
   var $300=HEAP32[(($299)>>2)];
   var $301=$1;
   var $302=$301;
   var $303=(($302+8)|0);
   var $304=HEAP32[(($303)>>2)];
   var $305=_fprintf($292, ((4104)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 24)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$296,HEAP32[(((tempVarArgs)+(8))>>2)]=$300,HEAP32[(((tempVarArgs)+(16))>>2)]=$304,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 49; break;
  case 29: 
   var $307=HEAP32[((_stderr)>>2)];
   var $308=$1;
   var $309=$308;
   var $310=(($309+8)|0);
   var $311=HEAP32[(($310)>>2)];
   var $312=$1;
   var $313=$312;
   var $314=(($313+12)|0);
   var $315=HEAP8[($314)];
   var $316=(($315)&(255));
   var $317=$1;
   var $318=$317;
   var $319=(($318+16)|0);
   var $320=HEAP16[(($319)>>1)];
   var $321=(($320 << 16) >> 16);
   var $322=$1;
   var $323=$322;
   var $324=(($323+18)|0);
   var $325=HEAP16[(($324)>>1)];
   var $326=(($325 << 16) >> 16);
   var $327=_fprintf($307, ((4064)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 32)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$311,HEAP32[(((tempVarArgs)+(8))>>2)]=$316,HEAP32[(((tempVarArgs)+(16))>>2)]=$321,HEAP32[(((tempVarArgs)+(24))>>2)]=$326,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 49; break;
  case 30: 
   var $329=HEAP32[((_stderr)>>2)];
   var $330=$1;
   var $331=$330;
   var $332=(($331+8)|0);
   var $333=HEAP32[(($332)>>2)];
   var $334=$1;
   var $335=$334;
   var $336=(($335+12)|0);
   var $337=HEAP8[($336)];
   var $338=(($337)&(255));
   var $339=_fprintf($329, ((4032)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 16)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$333,HEAP32[(((tempVarArgs)+(8))>>2)]=$338,tempVarArgs)); STACKTOP=tempVarArgs;
   var $340=$1;
   var $341=$340;
   var $342=(($341+13)|0);
   var $343=HEAP8[($342)];
   var $344=(($343)&(255));
   switch((($344)|(0))) {
   case 0:{
    label = 31; break;
   }
   case 1:{
    label = 32; break;
   }
   case 3:{
    label = 33; break;
   }
   case 2:{
    label = 34; break;
   }
   case 6:{
    label = 35; break;
   }
   case 4:{
    label = 36; break;
   }
   case 12:{
    label = 37; break;
   }
   case 8:{
    label = 38; break;
   }
   case 9:{
    label = 39; break;
   }
   default: {
   label = 40; break;
   }
   } break; 
  case 31: 
   var $346=HEAP32[((_stderr)>>2)];
   var $347=_fprintf($346, ((4024)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 41; break;
  case 32: 
   var $349=HEAP32[((_stderr)>>2)];
   var $350=_fprintf($349, ((4000)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 41; break;
  case 33: 
   var $352=HEAP32[((_stderr)>>2)];
   var $353=_fprintf($352, ((3992)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 41; break;
  case 34: 
   var $355=HEAP32[((_stderr)>>2)];
   var $356=_fprintf($355, ((3984)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 41; break;
  case 35: 
   var $358=HEAP32[((_stderr)>>2)];
   var $359=_fprintf($358, ((3960)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 41; break;
  case 36: 
   var $361=HEAP32[((_stderr)>>2)];
   var $362=_fprintf($361, ((3952)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 41; break;
  case 37: 
   var $364=HEAP32[((_stderr)>>2)];
   var $365=_fprintf($364, ((3936)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 41; break;
  case 38: 
   var $367=HEAP32[((_stderr)>>2)];
   var $368=_fprintf($367, ((3928)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 41; break;
  case 39: 
   var $370=HEAP32[((_stderr)>>2)];
   var $371=_fprintf($370, ((3920)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 41; break;
  case 40: 
   var $373=HEAP32[((_stderr)>>2)];
   var $374=_fprintf($373, ((3912)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 41; break;
  case 41: 
   label = 49; break;
  case 42: 
   var $377=HEAP32[((_stderr)>>2)];
   var $378=$1;
   var $379=$378;
   var $380=(($379+8)|0);
   var $381=HEAP32[(($380)>>2)];
   var $382=$1;
   var $383=$382;
   var $384=(($383+12)|0);
   var $385=HEAP8[($384)];
   var $386=(($385)&(255));
   var $387=_fprintf($377, ((3880)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 16)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$381,HEAP32[(((tempVarArgs)+(8))>>2)]=$386,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 49; break;
  case 43: 
   var $389=HEAP32[((_stderr)>>2)];
   var $390=$1;
   var $391=$390;
   var $392=(($391+8)|0);
   var $393=HEAP32[(($392)>>2)];
   var $394=$1;
   var $395=$394;
   var $396=(($395+12)|0);
   var $397=HEAP8[($396)];
   var $398=(($397)&(255));
   var $399=_fprintf($389, ((3816)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 16)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$393,HEAP32[(((tempVarArgs)+(8))>>2)]=$398,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 49; break;
  case 44: 
   var $401=HEAP32[((_stderr)>>2)];
   var $402=_fprintf($401, ((3792)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 49; break;
  case 45: 
   var $404=HEAP32[((_stderr)>>2)];
   var $405=$1;
   var $406=$405;
   var $407=HEAP32[(($406)>>2)];
   var $408=(($407)|(0))==1792;
   var $409=$408 ? (((3688)|0)) : (((3680)|0));
   var $410=$1;
   var $411=$410;
   var $412=(($411+8)|0);
   var $ld$0$0=(($412)|0);
   var $413$0=HEAP32[(($ld$0$0)>>2)];
   var $ld$1$1=(($412+4)|0);
   var $413$1=HEAP32[(($ld$1$1)>>2)];
   var $414=$1;
   var $415=$414;
   var $416=(($415+16)|0);
   var $ld$2$0=(($416)|0);
   var $417$0=HEAP32[(($ld$2$0)>>2)];
   var $ld$3$1=(($416+4)|0);
   var $417$1=HEAP32[(($ld$3$1)>>2)];
   var $418=$1;
   var $419=$418;
   var $420=(($419+24)|0);
   var $421=HEAPF32[(($420)>>2)];
   var $422=$421;
   var $423=$1;
   var $424=$423;
   var $425=(($424+28)|0);
   var $426=HEAPF32[(($425)>>2)];
   var $427=$426;
   var $428=$1;
   var $429=$428;
   var $430=(($429+32)|0);
   var $431=HEAPF32[(($430)>>2)];
   var $432=$431;
   var $433=$1;
   var $434=$433;
   var $435=(($434+36)|0);
   var $436=HEAPF32[(($435)>>2)];
   var $437=$436;
   var $438=$1;
   var $439=$438;
   var $440=(($439+40)|0);
   var $441=HEAPF32[(($440)>>2)];
   var $442=$441;
   var $$etemp$4=((3712)|0);
   var $443=_fprintf($404, $$etemp$4, (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 80)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$409,HEAP32[(((tempVarArgs)+(8))>>2)]=$413$0,HEAP32[(((tempVarArgs)+(16))>>2)]=$413$1,HEAP32[(((tempVarArgs)+(24))>>2)]=$417$0,HEAP32[(((tempVarArgs)+(32))>>2)]=$417$1,HEAPF64[(((tempVarArgs)+(40))>>3)]=$422,HEAPF64[(((tempVarArgs)+(48))>>3)]=$427,HEAPF64[(((tempVarArgs)+(56))>>3)]=$432,HEAPF64[(((tempVarArgs)+(64))>>3)]=$437,HEAPF64[(((tempVarArgs)+(72))>>3)]=$442,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 49; break;
  case 46: 
   var $445=HEAP32[((_stderr)>>2)];
   var $446=_fprintf($445, ((3664)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 49; break;
  case 47: 
   var $448=HEAP32[((_stderr)>>2)];
   var $449=$1;
   var $450=$449;
   var $451=(($450+12)|0);
   var $452=HEAP32[(($451)>>2)];
   var $453=_fprintf($448, ((3648)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$452,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 49; break;
  case 48: 
   var $455=HEAP32[((_stderr)>>2)];
   var $456=$1;
   var $457=$456;
   var $458=HEAP32[(($457)>>2)];
   var $459=_fprintf($455, ((3624)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$458,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 49; break;
  case 49: 
   var $461=HEAP32[((_stderr)>>2)];
   var $462=_fprintf($461, ((1344)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 50; break;
  case 50: 
   STACKTOP = sp;
   return;
  default: assert(0, "bad label: " + label);
 }
}
function _SDLTest_ScreenShot($renderer) {
 var label = 0;
 var tempVarArgs = 0;
 var sp  = STACKTOP; STACKTOP = (STACKTOP + 16)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1) switch(label) {
  case 1: 
   var $1;
   var $viewport=sp;
   var $surface;
   $1=$renderer;
   var $2=$1;
   var $3=(($2)|(0))!=0;
   if ($3) { label = 3; break; } else { label = 2; break; }
  case 2: 
   label = 9; break;
  case 3: 
   var $6=$1;
   _SDL_RenderGetViewport($6, $viewport);
   var $7=(($viewport+8)|0);
   var $8=HEAP32[(($7)>>2)];
   var $9=(($viewport+12)|0);
   var $10=HEAP32[(($9)>>2)];
   var $11=_SDL_CreateRGBSurface(0, $8, $10, 24, 16711680, 65280, 255, 0);
   $surface=$11;
   var $12=$surface;
   var $13=(($12)|(0))!=0;
   if ($13) { label = 5; break; } else { label = 4; break; }
  case 4: 
   var $15=HEAP32[((_stderr)>>2)];
   var $16=_SDL_GetError();
   var $17=_fprintf($15, ((32)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$16,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 9; break;
  case 5: 
   var $19=$1;
   var $20=$surface;
   var $21=(($20+4)|0);
   var $22=HEAP32[(($21)>>2)];
   var $23=(($22)|0);
   var $24=HEAP32[(($23)>>2)];
   var $25=$surface;
   var $26=(($25+20)|0);
   var $27=HEAP32[(($26)>>2)];
   var $28=$surface;
   var $29=(($28+16)|0);
   var $30=HEAP32[(($29)>>2)];
   var $31=_SDL_RenderReadPixels($19, 0, $24, $27, $30);
   var $32=(($31)|(0)) < 0;
   if ($32) { label = 6; break; } else { label = 7; break; }
  case 6: 
   var $34=HEAP32[((_stderr)>>2)];
   var $35=_SDL_GetError();
   var $36=_fprintf($34, ((5144)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$35,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 9; break;
  case 7: 
   var $38=$surface;
   var $39=_SDL_RWFromFile(((5128)|0), ((5120)|0));
   var $40=_SDL_SaveBMP_RW($38, $39, 1);
   var $41=(($40)|(0)) < 0;
   if ($41) { label = 8; break; } else { label = 9; break; }
  case 8: 
   var $43=HEAP32[((_stderr)>>2)];
   var $44=_SDL_GetError();
   var $45=_fprintf($43, ((5072)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$44,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 9; break;
  case 9: 
   STACKTOP = sp;
   return;
  default: assert(0, "bad label: " + label);
 }
}
function _FullscreenTo($index, $windowId) {
 var label = 0;
 var sp  = STACKTOP; STACKTOP = (STACKTOP + 16)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1) switch(label) {
  case 1: 
   var $1;
   var $2;
   var $flags;
   var $rect=sp;
   var $window;
   $1=$index;
   $2=$windowId;
   var $3=$rect;
   HEAP32[(($3)>>2)]=0; HEAP32[((($3)+(4))>>2)]=0; HEAP32[((($3)+(8))>>2)]=0; HEAP32[((($3)+(12))>>2)]=0;
   var $4=$2;
   var $5=_SDL_GetWindowFromID($4);
   $window=$5;
   var $6=$window;
   var $7=(($6)|(0))!=0;
   if ($7) { label = 3; break; } else { label = 2; break; }
  case 2: 
   label = 6; break;
  case 3: 
   var $10=$1;
   var $11=_SDL_GetDisplayBounds($10, $rect);
   var $12=$window;
   var $13;
   $flags=$13;
   var $14=$flags;
   var $15=$14 & 1;
   var $16=(($15)|(0))!=0;
   if ($16) { label = 4; break; } else { label = 5; break; }
  case 4: 
   var $18=$window;
   var $19=_SDL_SetWindowFullscreen($18, 0);
   _SDL_Delay(15);
   label = 5; break;
  case 5: 
   var $21=$window;
   var $22=(($rect)|0);
   var $23=HEAP32[(($22)>>2)];
   var $24=(($rect+4)|0);
   var $25=HEAP32[(($24)>>2)];
   _SDL_SetWindowPosition($21, $23, $25);
   var $26=$window;
   var $27=_SDL_SetWindowFullscreen($26, 1);
   label = 6; break;
  case 6: 
   STACKTOP = sp;
   return;
  default: assert(0, "bad label: " + label);
 }
}
function _SDLTest_CommonQuit($state) {
 var label = 0;
 label = 1; 
 while(1) switch(label) {
  case 1: 
   var $1;
   var $i;
   $1=$state;
   var $2=$1;
   var $3=(($2+88)|0);
   var $4=HEAP32[(($3)>>2)];
   var $5=(($4)|(0))!=0;
   if ($5) { label = 2; break; } else { label = 3; break; }
  case 2: 
   var $7=$1;
   var $8=(($7+88)|0);
   var $9=HEAP32[(($8)>>2)];
   var $10=$9;
   _SDL_free($10);
   label = 3; break;
  case 3: 
   var $12=$1;
   var $13=(($12+104)|0);
   var $14=HEAP32[(($13)>>2)];
   var $15=(($14)|(0))!=0;
   if ($15) { label = 4; break; } else { label = 11; break; }
  case 4: 
   $i=0;
   label = 5; break;
  case 5: 
   var $18=$i;
   var $19=$1;
   var $20=(($19+84)|0);
   var $21=HEAP32[(($20)>>2)];
   var $22=(($18)|(0)) < (($21)|(0));
   if ($22) { label = 6; break; } else { label = 10; break; }
  case 6: 
   var $24=$i;
   var $25=$1;
   var $26=(($25+104)|0);
   var $27=HEAP32[(($26)>>2)];
   var $28=(($27+($24<<2))|0);
   var $29=HEAP32[(($28)>>2)];
   var $30=(($29)|(0))!=0;
   if ($30) { label = 7; break; } else { label = 8; break; }
  case 7: 
   var $32=$i;
   var $33=$1;
   var $34=(($33+104)|0);
   var $35=HEAP32[(($34)>>2)];
   var $36=(($35+($32<<2))|0);
   var $37=HEAP32[(($36)>>2)];
   _SDL_DestroyRenderer($37);
   label = 8; break;
  case 8: 
   label = 9; break;
  case 9: 
   var $40=$i;
   var $41=((($40)+(1))|0);
   $i=$41;
   label = 5; break;
  case 10: 
   var $43=$1;
   var $44=(($43+104)|0);
   var $45=HEAP32[(($44)>>2)];
   var $46=$45;
   _SDL_free($46);
   label = 11; break;
  case 11: 
   var $48=$1;
   var $49=(($48+4)|0);
   var $50=HEAP32[(($49)>>2)];
   var $51=$50 & 32;
   var $52=(($51)|(0))!=0;
   if ($52) { label = 12; break; } else { label = 13; break; }
  case 12: 
   _SDL_VideoQuit();
   label = 13; break;
  case 13: 
   var $55=$1;
   var $56=(($55+4)|0);
   var $57=HEAP32[(($56)>>2)];
   var $58=$57 & 16;
   var $59=(($58)|(0))!=0;
   if ($59) { label = 14; break; } else { label = 15; break; }
  case 14: 
   _SDL_AudioQuit();
   label = 15; break;
  case 15: 
   var $62=$1;
   var $63=$62;
   _SDL_free($63);
   return;
  default: assert(0, "bad label: " + label);
 }
}
function _SDLTest_PrintRendererFlag($flag) {
 var label = 0;
 var tempVarArgs = 0;
 var sp  = STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1) switch(label) {
  case 1: 
   var $1;
   $1=$flag;
   var $2=$1;
   if ((($2)|(0))==4) {
    label = 2; break;
   }
   else if ((($2)|(0))==2) {
    label = 3; break;
   }
   else {
   label = 4; break;
   }
  case 2: 
   var $4=HEAP32[((_stderr)>>2)];
   var $5=_fprintf($4, ((3008)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 5; break;
  case 3: 
   var $7=HEAP32[((_stderr)>>2)];
   var $8=_fprintf($7, ((2984)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 5; break;
  case 4: 
   var $10=HEAP32[((_stderr)>>2)];
   var $11=$1;
   var $12=_fprintf($10, ((3024)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$11,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 5; break;
  case 5: 
   STACKTOP = sp;
   return;
  default: assert(0, "bad label: " + label);
 }
}
function _SDLTest_PrintPixelFormat($format) {
 var label = 0;
 var tempVarArgs = 0;
 var sp  = STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1) switch(label) {
  case 1: 
   var $1;
   $1=$format;
   var $2=$1;
   if ((($2)|(0))==0) {
    label = 2; break;
   }
   else if ((($2)|(0))==286261504) {
    label = 3; break;
   }
   else if ((($2)|(0))==287310080) {
    label = 4; break;
   }
   else if ((($2)|(0))==303039488) {
    label = 5; break;
   }
   else if ((($2)|(0))==304088064) {
    label = 6; break;
   }
   else if ((($2)|(0))==318769153) {
    label = 7; break;
   }
   else if ((($2)|(0))==336660481) {
    label = 8; break;
   }
   else if ((($2)|(0))==353504258) {
    label = 9; break;
   }
   else if ((($2)|(0))==353570562) {
    label = 10; break;
   }
   else if ((($2)|(0))==357764866) {
    label = 11; break;
   }
   else if ((($2)|(0))==355602434) {
    label = 12; break;
   }
   else if ((($2)|(0))==359796738) {
    label = 13; break;
   }
   else if ((($2)|(0))==355667970) {
    label = 14; break;
   }
   else if ((($2)|(0))==359862274) {
    label = 15; break;
   }
   else if ((($2)|(0))==353701890) {
    label = 16; break;
   }
   else if ((($2)|(0))==357896194) {
    label = 17; break;
   }
   else if ((($2)|(0))==386930691) {
    label = 18; break;
   }
   else if ((($2)|(0))==390076419) {
    label = 19; break;
   }
   else if ((($2)|(0))==370546692) {
    label = 20; break;
   }
   else if ((($2)|(0))==374740996) {
    label = 21; break;
   }
   else if ((($2)|(0))==372645892) {
    label = 22; break;
   }
   else if ((($2)|(0))==373694468) {
    label = 23; break;
   }
   else if ((($2)|(0))==376840196) {
    label = 24; break;
   }
   else if ((($2)|(0))==377888772) {
    label = 25; break;
   }
   else if ((($2)|(0))==372711428) {
    label = 26; break;
   }
   else if ((($2)|(0))==842094169) {
    label = 27; break;
   }
   else if ((($2)|(0))==1448433993) {
    label = 28; break;
   }
   else if ((($2)|(0))==844715353) {
    label = 29; break;
   }
   else if ((($2)|(0))==1498831189) {
    label = 30; break;
   }
   else if ((($2)|(0))==1431918169) {
    label = 31; break;
   }
   else {
   label = 32; break;
   }
  case 2: 
   var $4=HEAP32[((_stderr)>>2)];
   var $5=_fprintf($4, ((3432)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 3: 
   var $7=HEAP32[((_stderr)>>2)];
   var $8=_fprintf($7, ((3416)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 4: 
   var $10=HEAP32[((_stderr)>>2)];
   var $11=_fprintf($10, ((3376)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 5: 
   var $13=HEAP32[((_stderr)>>2)];
   var $14=_fprintf($13, ((3360)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 6: 
   var $16=HEAP32[((_stderr)>>2)];
   var $17=_fprintf($16, ((3344)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 7: 
   var $19=HEAP32[((_stderr)>>2)];
   var $20=_fprintf($19, ((3336)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 8: 
   var $22=HEAP32[((_stderr)>>2)];
   var $23=_fprintf($22, ((3328)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 9: 
   var $25=HEAP32[((_stderr)>>2)];
   var $26=_fprintf($25, ((3320)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 10: 
   var $28=HEAP32[((_stderr)>>2)];
   var $29=_fprintf($28, ((3312)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 11: 
   var $31=HEAP32[((_stderr)>>2)];
   var $32=_fprintf($31, ((3304)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 12: 
   var $34=HEAP32[((_stderr)>>2)];
   var $35=_fprintf($34, ((3288)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 13: 
   var $37=HEAP32[((_stderr)>>2)];
   var $38=_fprintf($37, ((3272)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 14: 
   var $40=HEAP32[((_stderr)>>2)];
   var $41=_fprintf($40, ((3240)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 15: 
   var $43=HEAP32[((_stderr)>>2)];
   var $44=_fprintf($43, ((3224)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 16: 
   var $46=HEAP32[((_stderr)>>2)];
   var $47=_fprintf($46, ((3216)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 17: 
   var $49=HEAP32[((_stderr)>>2)];
   var $50=_fprintf($49, ((3208)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 18: 
   var $52=HEAP32[((_stderr)>>2)];
   var $53=_fprintf($52, ((3200)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 19: 
   var $55=HEAP32[((_stderr)>>2)];
   var $56=_fprintf($55, ((3192)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 20: 
   var $58=HEAP32[((_stderr)>>2)];
   var $59=_fprintf($58, ((3184)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 21: 
   var $61=HEAP32[((_stderr)>>2)];
   var $62=_fprintf($61, ((3176)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 22: 
   var $64=HEAP32[((_stderr)>>2)];
   var $65=_fprintf($64, ((3160)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 23: 
   var $67=HEAP32[((_stderr)>>2)];
   var $68=_fprintf($67, ((3144)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 24: 
   var $70=HEAP32[((_stderr)>>2)];
   var $71=_fprintf($70, ((3112)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 25: 
   var $73=HEAP32[((_stderr)>>2)];
   var $74=_fprintf($73, ((3096)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 26: 
   var $76=HEAP32[((_stderr)>>2)];
   var $77=_fprintf($76, ((3072)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 27: 
   var $79=HEAP32[((_stderr)>>2)];
   var $80=_fprintf($79, ((3064)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 28: 
   var $82=HEAP32[((_stderr)>>2)];
   var $83=_fprintf($82, ((3056)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 29: 
   var $85=HEAP32[((_stderr)>>2)];
   var $86=_fprintf($85, ((3048)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 30: 
   var $88=HEAP32[((_stderr)>>2)];
   var $89=_fprintf($88, ((3040)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 31: 
   var $91=HEAP32[((_stderr)>>2)];
   var $92=_fprintf($91, ((3032)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+7)>>3)<<3),(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 32: 
   var $94=HEAP32[((_stderr)>>2)];
   var $95=$1;
   var $96=_fprintf($94, ((3024)|0), (tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,(assert((STACKTOP|0) < (STACK_MAX|0))|0),HEAP32[((tempVarArgs)>>2)]=$95,tempVarArgs)); STACKTOP=tempVarArgs;
   label = 33; break;
  case 33: 
   STACKTOP = sp;
   return;
  default: assert(0, "bad label: " + label);
 }
}
function _SDLTest_FuzzerInit($execKey$0, $execKey$1) {
 var label = 0;
 var sp  = STACKTOP; STACKTOP = (STACKTOP + 8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var $1=sp;
 var $a;
 var $b;
 var $st$0$0=(($1)|0);
 HEAP32[(($st$0$0)>>2)]=$execKey$0;
 var $st$1$1=(($1+4)|0);
 HEAP32[(($st$1$1)>>2)]=$execKey$1;
 var $ld$2$0=(($1)|0);
 var $2$0=HEAP32[(($ld$2$0)>>2)];
 var $ld$3$1=(($1+4)|0);
 var $2$1=HEAP32[(($ld$3$1)>>2)];
 var $3$0=$2$1;
 var $3$1=0;
 var $$etemp$4$0=-1;
 var $$etemp$4$1=0;
 var $4$0=$3$0 & $$etemp$4$0;
 var $4$1=$3$1 & $$etemp$4$1;
 var $5$0=$4$0;
 var $5=$5$0;
 $a=$5;
 var $ld$5$0=(($1)|0);
 var $6$0=HEAP32[(($ld$5$0)>>2)];
 var $ld$6$1=(($1+4)|0);
 var $6$1=HEAP32[(($ld$6$1)>>2)];
 var $$etemp$7$0=-1;
 var $$etemp$7$1=0;
 var $7$0=$6$0 & $$etemp$7$0;
 var $7$1=$6$1 & $$etemp$7$1;
 var $8$0=$7$0;
 var $8=$8$0;
 $b=$8;
 var $9=_SDL_memset(5264, 0, 20);
 var $10=$a;
 var $11=$b;
 _SDLTest_RandomInit(5264, $10, $11);
 HEAP32[((5304)>>2)]=0;
 STACKTOP = sp;
 return;
}
function _SDLTest_RandomUint32() {
 var label = 0;
 var $1=HEAP32[((5304)>>2)];
 var $2=((($1)+(1))|0);
 HEAP32[((5304)>>2)]=$2;
 var $3=_SDLTest_Random(5264);
 return $3;
}
function _SDLTest_RandomIntegerInRange($pMin, $pMax) {
 var label = 0;
 var sp  = STACKTOP; STACKTOP = (STACKTOP + 32)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1) switch(label) {
  case 1: 
   var $1;
   var $2;
   var $3;
   var $min=sp;
   var $max=(sp)+(8);
   var $temp=(sp)+(16);
   var $number=(sp)+(24);
   $2=$pMin;
   $3=$pMax;
   var $4=$2;
   var $5$0=$4;
   var $5$1=((($4)|(0)) < 0 ? -1 : 0);
   var $st$0$0=(($min)|0);
   HEAP32[(($st$0$0)>>2)]=$5$0;
   var $st$1$1=(($min+4)|0);
   HEAP32[(($st$1$1)>>2)]=$5$1;
   var $6=$3;
   var $7$0=$6;
   var $7$1=((($6)|(0)) < 0 ? -1 : 0);
   var $st$2$0=(($max)|0);
   HEAP32[(($st$2$0)>>2)]=$7$0;
   var $st$3$1=(($max+4)|0);
   HEAP32[(($st$3$1)>>2)]=$7$1;
   var $8=$2;
   var $9=$3;
   var $10=(($8)|(0)) > (($9)|(0));
   if ($10) { label = 2; break; } else { label = 3; break; }
  case 2: 
   var $ld$4$0=(($min)|0);
   var $12$0=HEAP32[(($ld$4$0)>>2)];
   var $ld$5$1=(($min+4)|0);
   var $12$1=HEAP32[(($ld$5$1)>>2)];
   var $st$6$0=(($temp)|0);
   HEAP32[(($st$6$0)>>2)]=$12$0;
   var $st$7$1=(($temp+4)|0);
   HEAP32[(($st$7$1)>>2)]=$12$1;
   var $ld$8$0=(($max)|0);
   var $13$0=HEAP32[(($ld$8$0)>>2)];
   var $ld$9$1=(($max+4)|0);
   var $13$1=HEAP32[(($ld$9$1)>>2)];
   var $st$10$0=(($min)|0);
   HEAP32[(($st$10$0)>>2)]=$13$0;
   var $st$11$1=(($min+4)|0);
   HEAP32[(($st$11$1)>>2)]=$13$1;
   var $ld$12$0=(($temp)|0);
   var $14$0=HEAP32[(($ld$12$0)>>2)];
   var $ld$13$1=(($temp+4)|0);
   var $14$1=HEAP32[(($ld$13$1)>>2)];
   var $st$14$0=(($max)|0);
   HEAP32[(($st$14$0)>>2)]=$14$0;
   var $st$15$1=(($max+4)|0);
   HEAP32[(($st$15$1)>>2)]=$14$1;
   label = 6; break;
  case 3: 
   var $16=$2;
   var $17=$3;
   var $18=(($16)|(0))==(($17)|(0));
   if ($18) { label = 4; break; } else { label = 5; break; }
  case 4: 
   var $ld$16$0=(($min)|0);
   var $20$0=HEAP32[(($ld$16$0)>>2)];
   var $ld$17$1=(($min+4)|0);
   var $20$1=HEAP32[(($ld$17$1)>>2)];
   var $21$0=$20$0;
   var $21=$21$0;
   $1=$21;
   label = 7; break;
  case 5: 
   label = 6; break;
  case 6: 
   var $24=_SDLTest_RandomUint32();
   var $25$0=$24;
   var $25$1=0;
   var $st$18$0=(($number)|0);
   HEAP32[(($st$18$0)>>2)]=$25$0;
   var $st$19$1=(($number+4)|0);
   HEAP32[(($st$19$1)>>2)]=$25$1;
   var $ld$20$0=(($number)|0);
   var $26$0=HEAP32[(($ld$20$0)>>2)];
   var $ld$21$1=(($number+4)|0);
   var $26$1=HEAP32[(($ld$21$1)>>2)];
   var $ld$22$0=(($max)|0);
   var $27$0=HEAP32[(($ld$22$0)>>2)];
   var $ld$23$1=(($max+4)|0);
   var $27$1=HEAP32[(($ld$23$1)>>2)];
   var $$etemp$24$0=1;
   var $$etemp$24$1=0;
   var $28$0 = _i64Add($27$0,$27$1,$$etemp$24$0,$$etemp$24$1); var $28$1 = tempRet0;
   var $ld$25$0=(($min)|0);
   var $29$0=HEAP32[(($ld$25$0)>>2)];
   var $ld$26$1=(($min+4)|0);
   var $29$1=HEAP32[(($ld$26$1)>>2)];
   var $30$0 = _i64Subtract($28$0,$28$1,$29$0,$29$1); var $30$1 = tempRet0;
   var $31$0 = ___remdi3($26$0,$26$1,$30$0,$30$1); var $31$1 = tempRet0;
   var $ld$27$0=(($min)|0);
   var $32$0=HEAP32[(($ld$27$0)>>2)];
   var $ld$28$1=(($min+4)|0);
   var $32$1=HEAP32[(($ld$28$1)>>2)];
   var $33$0 = _i64Add($31$0,$31$1,$32$0,$32$1); var $33$1 = tempRet0;
   var $34$0=$33$0;
   var $34=$34$0;
   $1=$34;
   label = 7; break;
  case 7: 
   var $36=$1;
   STACKTOP = sp;
   return $36;
  default: assert(0, "bad label: " + label);
 }
}
function _SDLTest_RandomInit($rndContext, $xi, $ci) {
 var label = 0;
 label = 1; 
 while(1) switch(label) {
  case 1: 
   var $1;
   var $2;
   var $3;
   $1=$rndContext;
   $2=$xi;
   $3=$ci;
   var $4=$1;
   var $5=(($4)|(0))==0;
   if ($5) { label = 2; break; } else { label = 3; break; }
  case 2: 
   label = 6; break;
  case 3: 
   var $8=$1;
   var $9=(($8)|0);
   HEAP32[(($9)>>2)]=1655692410;
   var $10=$1;
   var $11=(($10+4)|0);
   HEAP32[(($11)>>2)]=30903;
   var $12=$1;
   var $13=(($12+8)|0);
   HEAP32[(($13)>>2)]=0;
   var $14=$2;
   var $15=(($14)|(0))!=0;
   if ($15) { label = 4; break; } else { label = 5; break; }
  case 4: 
   var $17=$2;
   var $18=$1;
   var $19=(($18+4)|0);
   HEAP32[(($19)>>2)]=$17;
   label = 5; break;
  case 5: 
   var $21=$3;
   var $22=$1;
   var $23=(($22+8)|0);
   HEAP32[(($23)>>2)]=$21;
   var $24=$1;
   var $25=(($24)|0);
   var $26=HEAP32[(($25)>>2)];
   var $27=$26 >>> 16;
   var $28=$1;
   var $29=(($28+12)|0);
   HEAP32[(($29)>>2)]=$27;
   var $30=$1;
   var $31=(($30)|0);
   var $32=HEAP32[(($31)>>2)];
   var $33=$32 & 65535;
   var $34=$1;
   var $35=(($34+16)|0);
   HEAP32[(($35)>>2)]=$33;
   label = 6; break;
  case 6: 
   return;
  default: assert(0, "bad label: " + label);
 }
}
function _SDLTest_Random($rndContext) {
 var label = 0;
 label = 1; 
 while(1) switch(label) {
  case 1: 
   var $1;
   var $2;
   var $xh;
   var $xl;
   $2=$rndContext;
   var $3=$2;
   var $4=(($3)|(0))==0;
   if ($4) { label = 2; break; } else { label = 3; break; }
  case 2: 
   $1=-1;
   label = 6; break;
  case 3: 
   var $7=$2;
   var $8=(($7+4)|0);
   var $9=HEAP32[(($8)>>2)];
   var $10=$9 >>> 16;
   $xh=$10;
   var $11=$2;
   var $12=(($11+4)|0);
   var $13=HEAP32[(($12)>>2)];
   var $14=$13 & 65535;
   $xl=$14;
   var $15=$2;
   var $16=(($15+4)|0);
   var $17=HEAP32[(($16)>>2)];
   var $18=$2;
   var $19=(($18)|0);
   var $20=HEAP32[(($19)>>2)];
   var $21=(Math.imul($17,$20)|0);
   var $22=$2;
   var $23=(($22+8)|0);
   var $24=HEAP32[(($23)>>2)];
   var $25=((($21)+($24))|0);
   var $26=$2;
   var $27=(($26+4)|0);
   HEAP32[(($27)>>2)]=$25;
   var $28=$xh;
   var $29=$2;
   var $30=(($29+12)|0);
   var $31=HEAP32[(($30)>>2)];
   var $32=(Math.imul($28,$31)|0);
   var $33=$xh;
   var $34=$2;
   var $35=(($34+16)|0);
   var $36=HEAP32[(($35)>>2)];
   var $37=(Math.imul($33,$36)|0);
   var $38=$37 >>> 16;
   var $39=((($32)+($38))|0);
   var $40=$xl;
   var $41=$2;
   var $42=(($41+12)|0);
   var $43=HEAP32[(($42)>>2)];
   var $44=(Math.imul($40,$43)|0);
   var $45=$44 >>> 16;
   var $46=((($39)+($45))|0);
   var $47=$2;
   var $48=(($47+8)|0);
   HEAP32[(($48)>>2)]=$46;
   var $49=$xl;
   var $50=$2;
   var $51=(($50+16)|0);
   var $52=HEAP32[(($51)>>2)];
   var $53=(Math.imul($49,$52)|0);
   var $54=$2;
   var $55=(($54+8)|0);
   var $56=HEAP32[(($55)>>2)];
   var $57=$56 ^ -1;
   var $58=((($57)+(1))|0);
   var $59=(($53)>>>(0)) >= (($58)>>>(0));
   if ($59) { label = 4; break; } else { label = 5; break; }
  case 4: 
   var $61=$2;
   var $62=(($61+8)|0);
   var $63=HEAP32[(($62)>>2)];
   var $64=((($63)+(1))|0);
   HEAP32[(($62)>>2)]=$64;
   label = 5; break;
  case 5: 
   var $66=$2;
   var $67=(($66+4)|0);
   var $68=HEAP32[(($67)>>2)];
   $1=$68;
   label = 6; break;
  case 6: 
   var $70=$1;
   return $70;
  default: assert(0, "bad label: " + label);
 }
}
// EMSCRIPTEN_END_FUNCS
function _i64Add(a, b, c, d) {
    /*
      x = a + b*2^32
      y = c + d*2^32
      result = l + h*2^32
    */
    a = a|0; b = b|0; c = c|0; d = d|0;
    var l = 0, h = 0;
    l = (a + c)>>>0;
    h = (b + d + (((l>>>0) < (a>>>0))|0))>>>0; // Add carry from low word to high word on overflow.
    return tempRet0 = h,l|0;
  }
function _i64Subtract(a, b, c, d) {
    a = a|0; b = b|0; c = c|0; d = d|0;
    var l = 0, h = 0;
    l = (a - c)>>>0;
    h = (b - d)>>>0;
    h = (b - d - (((c>>>0) > (a>>>0))|0))>>>0; // Borrow one from high word to low word on underflow.
    return tempRet0 = h,l|0;
  }
function _bitshift64Shl(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = (high << bits) | ((low&(ander << (32 - bits))) >>> (32 - bits));
      return low << bits;
    }
    tempRet0 = low << (bits - 32);
    return 0;
  }
function _bitshift64Lshr(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = high >>> bits;
      return (low >>> bits) | ((high&ander) << (32 - bits));
    }
    tempRet0 = 0;
    return (high >>> (bits - 32))|0;
  }
function _bitshift64Ashr(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = high >> bits;
      return (low >>> bits) | ((high&ander) << (32 - bits));
    }
    tempRet0 = (high|0) < 0 ? -1 : 0;
    return (high >> (bits - 32))|0;
  }
function _llvm_ctlz_i32(x) {
    x = x|0;
    var ret = 0;
    ret = HEAP8[(((ctlz_i8)+(x >>> 24))|0)];
    if ((ret|0) < 8) return ret|0;
    var ret = HEAP8[(((ctlz_i8)+((x >> 16)&0xff))|0)];
    if ((ret|0) < 8) return (ret + 8)|0;
    var ret = HEAP8[(((ctlz_i8)+((x >> 8)&0xff))|0)];
    if ((ret|0) < 8) return (ret + 16)|0;
    return (HEAP8[(((ctlz_i8)+(x&0xff))|0)] + 24)|0;
  }
/* PRE_ASM */ var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
function _llvm_cttz_i32(x) {
    x = x|0;
    var ret = 0;
    ret = HEAP8[(((cttz_i8)+(x & 0xff))|0)];
    if ((ret|0) < 8) return ret|0;
    var ret = HEAP8[(((cttz_i8)+((x >> 8)&0xff))|0)];
    if ((ret|0) < 8) return (ret + 8)|0;
    var ret = HEAP8[(((cttz_i8)+((x >> 16)&0xff))|0)];
    if ((ret|0) < 8) return (ret + 16)|0;
    return (HEAP8[(((cttz_i8)+(x >>> 24))|0)] + 24)|0;
  }
/* PRE_ASM */ var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);
// ======== compiled code from system/lib/compiler-rt , see readme therein
function ___muldsi3($a, $b) {
  $a = $a | 0;
  $b = $b | 0;
  var $1 = 0, $2 = 0, $3 = 0, $6 = 0, $8 = 0, $11 = 0, $12 = 0;
  $1 = $a & 65535;
  $2 = $b & 65535;
  $3 = Math.imul($2, $1) | 0;
  $6 = $a >>> 16;
  $8 = ($3 >>> 16) + (Math.imul($2, $6) | 0) | 0;
  $11 = $b >>> 16;
  $12 = Math.imul($11, $1) | 0;
  return (tempRet0 = (($8 >>> 16) + (Math.imul($11, $6) | 0) | 0) + ((($8 & 65535) + $12 | 0) >>> 16) | 0, 0 | ($8 + $12 << 16 | $3 & 65535)) | 0;
}
function ___divdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $1$0 = 0, $1$1 = 0, $2$0 = 0, $2$1 = 0, $4$0 = 0, $4$1 = 0, $6$0 = 0, $7$0 = 0, $7$1 = 0, $8$0 = 0, $10$0 = 0;
  $1$0 = $a$1 >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $1$1 = (($a$1 | 0) < 0 ? -1 : 0) >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $2$0 = $b$1 >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $2$1 = (($b$1 | 0) < 0 ? -1 : 0) >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $4$0 = _i64Subtract($1$0 ^ $a$0, $1$1 ^ $a$1, $1$0, $1$1) | 0;
  $4$1 = tempRet0;
  $6$0 = _i64Subtract($2$0 ^ $b$0, $2$1 ^ $b$1, $2$0, $2$1) | 0;
  $7$0 = $2$0 ^ $1$0;
  $7$1 = $2$1 ^ $1$1;
  $8$0 = ___udivmoddi4($4$0, $4$1, $6$0, tempRet0, 0) | 0;
  $10$0 = _i64Subtract($8$0 ^ $7$0, tempRet0 ^ $7$1, $7$0, $7$1) | 0;
  return (tempRet0 = tempRet0, $10$0) | 0;
}
function ___remdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $rem = 0, $1$0 = 0, $1$1 = 0, $2$0 = 0, $2$1 = 0, $4$0 = 0, $4$1 = 0, $6$0 = 0, $10$0 = 0, $10$1 = 0, __stackBase__ = 0;
  __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 8 | 0;
  $rem = __stackBase__ | 0;
  $1$0 = $a$1 >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $1$1 = (($a$1 | 0) < 0 ? -1 : 0) >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $2$0 = $b$1 >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $2$1 = (($b$1 | 0) < 0 ? -1 : 0) >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $4$0 = _i64Subtract($1$0 ^ $a$0, $1$1 ^ $a$1, $1$0, $1$1) | 0;
  $4$1 = tempRet0;
  $6$0 = _i64Subtract($2$0 ^ $b$0, $2$1 ^ $b$1, $2$0, $2$1) | 0;
  ___udivmoddi4($4$0, $4$1, $6$0, tempRet0, $rem) | 0;
  $10$0 = _i64Subtract(HEAP32[$rem >> 2] ^ $1$0, HEAP32[$rem + 4 >> 2] ^ $1$1, $1$0, $1$1) | 0;
  $10$1 = tempRet0;
  STACKTOP = __stackBase__;
  return (tempRet0 = $10$1, $10$0) | 0;
}
function ___muldi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $x_sroa_0_0_extract_trunc = 0, $y_sroa_0_0_extract_trunc = 0, $1$0 = 0, $1$1 = 0, $2 = 0;
  $x_sroa_0_0_extract_trunc = $a$0;
  $y_sroa_0_0_extract_trunc = $b$0;
  $1$0 = ___muldsi3($x_sroa_0_0_extract_trunc, $y_sroa_0_0_extract_trunc) | 0;
  $1$1 = tempRet0;
  $2 = Math.imul($a$1, $y_sroa_0_0_extract_trunc) | 0;
  return (tempRet0 = ((Math.imul($b$1, $x_sroa_0_0_extract_trunc) | 0) + $2 | 0) + $1$1 | $1$1 & 0, 0 | $1$0 & -1) | 0;
}
function ___udivdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $1$0 = 0;
  $1$0 = ___udivmoddi4($a$0, $a$1, $b$0, $b$1, 0) | 0;
  return (tempRet0 = tempRet0, $1$0) | 0;
}
function ___uremdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $rem = 0, __stackBase__ = 0;
  __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 8 | 0;
  $rem = __stackBase__ | 0;
  ___udivmoddi4($a$0, $a$1, $b$0, $b$1, $rem) | 0;
  STACKTOP = __stackBase__;
  return (tempRet0 = HEAP32[$rem + 4 >> 2] | 0, HEAP32[$rem >> 2] | 0) | 0;
}
function ___udivmoddi4($a$0, $a$1, $b$0, $b$1, $rem) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  $rem = $rem | 0;
  var $n_sroa_0_0_extract_trunc = 0, $n_sroa_1_4_extract_shift$0 = 0, $n_sroa_1_4_extract_trunc = 0, $d_sroa_0_0_extract_trunc = 0, $d_sroa_1_4_extract_shift$0 = 0, $d_sroa_1_4_extract_trunc = 0, $4 = 0, $17 = 0, $37 = 0, $49 = 0, $51 = 0, $57 = 0, $58 = 0, $66 = 0, $78 = 0, $86 = 0, $88 = 0, $89 = 0, $91 = 0, $92 = 0, $95 = 0, $105 = 0, $117 = 0, $119 = 0, $125 = 0, $126 = 0, $130 = 0, $q_sroa_1_1_ph = 0, $q_sroa_0_1_ph = 0, $r_sroa_1_1_ph = 0, $r_sroa_0_1_ph = 0, $sr_1_ph = 0, $d_sroa_0_0_insert_insert99$0 = 0, $d_sroa_0_0_insert_insert99$1 = 0, $137$0 = 0, $137$1 = 0, $carry_0203 = 0, $sr_1202 = 0, $r_sroa_0_1201 = 0, $r_sroa_1_1200 = 0, $q_sroa_0_1199 = 0, $q_sroa_1_1198 = 0, $147 = 0, $149 = 0, $r_sroa_0_0_insert_insert42$0 = 0, $r_sroa_0_0_insert_insert42$1 = 0, $150$1 = 0, $151$0 = 0, $152 = 0, $154$0 = 0, $r_sroa_0_0_extract_trunc = 0, $r_sroa_1_4_extract_trunc = 0, $155 = 0, $carry_0_lcssa$0 = 0, $carry_0_lcssa$1 = 0, $r_sroa_0_1_lcssa = 0, $r_sroa_1_1_lcssa = 0, $q_sroa_0_1_lcssa = 0, $q_sroa_1_1_lcssa = 0, $q_sroa_0_0_insert_ext75$0 = 0, $q_sroa_0_0_insert_ext75$1 = 0, $q_sroa_0_0_insert_insert77$1 = 0, $_0$0 = 0, $_0$1 = 0;
  $n_sroa_0_0_extract_trunc = $a$0;
  $n_sroa_1_4_extract_shift$0 = $a$1;
  $n_sroa_1_4_extract_trunc = $n_sroa_1_4_extract_shift$0;
  $d_sroa_0_0_extract_trunc = $b$0;
  $d_sroa_1_4_extract_shift$0 = $b$1;
  $d_sroa_1_4_extract_trunc = $d_sroa_1_4_extract_shift$0;
  if (($n_sroa_1_4_extract_trunc | 0) == 0) {
    $4 = ($rem | 0) != 0;
    if (($d_sroa_1_4_extract_trunc | 0) == 0) {
      if ($4) {
        HEAP32[$rem >> 2] = ($n_sroa_0_0_extract_trunc >>> 0) % ($d_sroa_0_0_extract_trunc >>> 0);
        HEAP32[$rem + 4 >> 2] = 0;
      }
      $_0$1 = 0;
      $_0$0 = ($n_sroa_0_0_extract_trunc >>> 0) / ($d_sroa_0_0_extract_trunc >>> 0) >>> 0;
      return (tempRet0 = $_0$1, $_0$0) | 0;
    } else {
      if (!$4) {
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      HEAP32[$rem >> 2] = $a$0 & -1;
      HEAP32[$rem + 4 >> 2] = $a$1 & 0;
      $_0$1 = 0;
      $_0$0 = 0;
      return (tempRet0 = $_0$1, $_0$0) | 0;
    }
  }
  $17 = ($d_sroa_1_4_extract_trunc | 0) == 0;
  do {
    if (($d_sroa_0_0_extract_trunc | 0) == 0) {
      if ($17) {
        if (($rem | 0) != 0) {
          HEAP32[$rem >> 2] = ($n_sroa_1_4_extract_trunc >>> 0) % ($d_sroa_0_0_extract_trunc >>> 0);
          HEAP32[$rem + 4 >> 2] = 0;
        }
        $_0$1 = 0;
        $_0$0 = ($n_sroa_1_4_extract_trunc >>> 0) / ($d_sroa_0_0_extract_trunc >>> 0) >>> 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      if (($n_sroa_0_0_extract_trunc | 0) == 0) {
        if (($rem | 0) != 0) {
          HEAP32[$rem >> 2] = 0;
          HEAP32[$rem + 4 >> 2] = ($n_sroa_1_4_extract_trunc >>> 0) % ($d_sroa_1_4_extract_trunc >>> 0);
        }
        $_0$1 = 0;
        $_0$0 = ($n_sroa_1_4_extract_trunc >>> 0) / ($d_sroa_1_4_extract_trunc >>> 0) >>> 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      $37 = $d_sroa_1_4_extract_trunc - 1 | 0;
      if (($37 & $d_sroa_1_4_extract_trunc | 0) == 0) {
        if (($rem | 0) != 0) {
          HEAP32[$rem >> 2] = 0 | $a$0 & -1;
          HEAP32[$rem + 4 >> 2] = $37 & $n_sroa_1_4_extract_trunc | $a$1 & 0;
        }
        $_0$1 = 0;
        $_0$0 = $n_sroa_1_4_extract_trunc >>> ((_llvm_cttz_i32($d_sroa_1_4_extract_trunc | 0) | 0) >>> 0);
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      $49 = _llvm_ctlz_i32($d_sroa_1_4_extract_trunc | 0) | 0;
      $51 = $49 - (_llvm_ctlz_i32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
      if ($51 >>> 0 <= 30) {
        $57 = $51 + 1 | 0;
        $58 = 31 - $51 | 0;
        $sr_1_ph = $57;
        $r_sroa_0_1_ph = $n_sroa_1_4_extract_trunc << $58 | $n_sroa_0_0_extract_trunc >>> ($57 >>> 0);
        $r_sroa_1_1_ph = $n_sroa_1_4_extract_trunc >>> ($57 >>> 0);
        $q_sroa_0_1_ph = 0;
        $q_sroa_1_1_ph = $n_sroa_0_0_extract_trunc << $58;
        break;
      }
      if (($rem | 0) == 0) {
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      HEAP32[$rem >> 2] = 0 | $a$0 & -1;
      HEAP32[$rem + 4 >> 2] = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
      $_0$1 = 0;
      $_0$0 = 0;
      return (tempRet0 = $_0$1, $_0$0) | 0;
    } else {
      if (!$17) {
        $117 = _llvm_ctlz_i32($d_sroa_1_4_extract_trunc | 0) | 0;
        $119 = $117 - (_llvm_ctlz_i32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
        if ($119 >>> 0 <= 31) {
          $125 = $119 + 1 | 0;
          $126 = 31 - $119 | 0;
          $130 = $119 - 31 >> 31;
          $sr_1_ph = $125;
          $r_sroa_0_1_ph = $n_sroa_0_0_extract_trunc >>> ($125 >>> 0) & $130 | $n_sroa_1_4_extract_trunc << $126;
          $r_sroa_1_1_ph = $n_sroa_1_4_extract_trunc >>> ($125 >>> 0) & $130;
          $q_sroa_0_1_ph = 0;
          $q_sroa_1_1_ph = $n_sroa_0_0_extract_trunc << $126;
          break;
        }
        if (($rem | 0) == 0) {
          $_0$1 = 0;
          $_0$0 = 0;
          return (tempRet0 = $_0$1, $_0$0) | 0;
        }
        HEAP32[$rem >> 2] = 0 | $a$0 & -1;
        HEAP32[$rem + 4 >> 2] = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      $66 = $d_sroa_0_0_extract_trunc - 1 | 0;
      if (($66 & $d_sroa_0_0_extract_trunc | 0) != 0) {
        $86 = (_llvm_ctlz_i32($d_sroa_0_0_extract_trunc | 0) | 0) + 33 | 0;
        $88 = $86 - (_llvm_ctlz_i32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
        $89 = 64 - $88 | 0;
        $91 = 32 - $88 | 0;
        $92 = $91 >> 31;
        $95 = $88 - 32 | 0;
        $105 = $95 >> 31;
        $sr_1_ph = $88;
        $r_sroa_0_1_ph = $91 - 1 >> 31 & $n_sroa_1_4_extract_trunc >>> ($95 >>> 0) | ($n_sroa_1_4_extract_trunc << $91 | $n_sroa_0_0_extract_trunc >>> ($88 >>> 0)) & $105;
        $r_sroa_1_1_ph = $105 & $n_sroa_1_4_extract_trunc >>> ($88 >>> 0);
        $q_sroa_0_1_ph = $n_sroa_0_0_extract_trunc << $89 & $92;
        $q_sroa_1_1_ph = ($n_sroa_1_4_extract_trunc << $89 | $n_sroa_0_0_extract_trunc >>> ($95 >>> 0)) & $92 | $n_sroa_0_0_extract_trunc << $91 & $88 - 33 >> 31;
        break;
      }
      if (($rem | 0) != 0) {
        HEAP32[$rem >> 2] = $66 & $n_sroa_0_0_extract_trunc;
        HEAP32[$rem + 4 >> 2] = 0;
      }
      if (($d_sroa_0_0_extract_trunc | 0) == 1) {
        $_0$1 = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
        $_0$0 = 0 | $a$0 & -1;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      } else {
        $78 = _llvm_cttz_i32($d_sroa_0_0_extract_trunc | 0) | 0;
        $_0$1 = 0 | $n_sroa_1_4_extract_trunc >>> ($78 >>> 0);
        $_0$0 = $n_sroa_1_4_extract_trunc << 32 - $78 | $n_sroa_0_0_extract_trunc >>> ($78 >>> 0) | 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
    }
  } while (0);
  if (($sr_1_ph | 0) == 0) {
    $q_sroa_1_1_lcssa = $q_sroa_1_1_ph;
    $q_sroa_0_1_lcssa = $q_sroa_0_1_ph;
    $r_sroa_1_1_lcssa = $r_sroa_1_1_ph;
    $r_sroa_0_1_lcssa = $r_sroa_0_1_ph;
    $carry_0_lcssa$1 = 0;
    $carry_0_lcssa$0 = 0;
  } else {
    $d_sroa_0_0_insert_insert99$0 = 0 | $b$0 & -1;
    $d_sroa_0_0_insert_insert99$1 = $d_sroa_1_4_extract_shift$0 | $b$1 & 0;
    $137$0 = _i64Add($d_sroa_0_0_insert_insert99$0, $d_sroa_0_0_insert_insert99$1, -1, -1) | 0;
    $137$1 = tempRet0;
    $q_sroa_1_1198 = $q_sroa_1_1_ph;
    $q_sroa_0_1199 = $q_sroa_0_1_ph;
    $r_sroa_1_1200 = $r_sroa_1_1_ph;
    $r_sroa_0_1201 = $r_sroa_0_1_ph;
    $sr_1202 = $sr_1_ph;
    $carry_0203 = 0;
    while (1) {
      $147 = $q_sroa_0_1199 >>> 31 | $q_sroa_1_1198 << 1;
      $149 = $carry_0203 | $q_sroa_0_1199 << 1;
      $r_sroa_0_0_insert_insert42$0 = 0 | ($r_sroa_0_1201 << 1 | $q_sroa_1_1198 >>> 31);
      $r_sroa_0_0_insert_insert42$1 = $r_sroa_0_1201 >>> 31 | $r_sroa_1_1200 << 1 | 0;
      _i64Subtract($137$0, $137$1, $r_sroa_0_0_insert_insert42$0, $r_sroa_0_0_insert_insert42$1) | 0;
      $150$1 = tempRet0;
      $151$0 = $150$1 >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1;
      $152 = $151$0 & 1;
      $154$0 = _i64Subtract($r_sroa_0_0_insert_insert42$0, $r_sroa_0_0_insert_insert42$1, $151$0 & $d_sroa_0_0_insert_insert99$0, ((($150$1 | 0) < 0 ? -1 : 0) >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1) & $d_sroa_0_0_insert_insert99$1) | 0;
      $r_sroa_0_0_extract_trunc = $154$0;
      $r_sroa_1_4_extract_trunc = tempRet0;
      $155 = $sr_1202 - 1 | 0;
      if (($155 | 0) == 0) {
        break;
      } else {
        $q_sroa_1_1198 = $147;
        $q_sroa_0_1199 = $149;
        $r_sroa_1_1200 = $r_sroa_1_4_extract_trunc;
        $r_sroa_0_1201 = $r_sroa_0_0_extract_trunc;
        $sr_1202 = $155;
        $carry_0203 = $152;
      }
    }
    $q_sroa_1_1_lcssa = $147;
    $q_sroa_0_1_lcssa = $149;
    $r_sroa_1_1_lcssa = $r_sroa_1_4_extract_trunc;
    $r_sroa_0_1_lcssa = $r_sroa_0_0_extract_trunc;
    $carry_0_lcssa$1 = 0;
    $carry_0_lcssa$0 = $152;
  }
  $q_sroa_0_0_insert_ext75$0 = $q_sroa_0_1_lcssa;
  $q_sroa_0_0_insert_ext75$1 = 0;
  $q_sroa_0_0_insert_insert77$1 = $q_sroa_1_1_lcssa | $q_sroa_0_0_insert_ext75$1;
  if (($rem | 0) != 0) {
    HEAP32[$rem >> 2] = 0 | $r_sroa_0_1_lcssa;
    HEAP32[$rem + 4 >> 2] = $r_sroa_1_1_lcssa | 0;
  }
  $_0$1 = (0 | $q_sroa_0_0_insert_ext75$0) >>> 31 | $q_sroa_0_0_insert_insert77$1 << 1 | ($q_sroa_0_0_insert_ext75$1 << 1 | $q_sroa_0_0_insert_ext75$0 >>> 31) & 0 | $carry_0_lcssa$1;
  $_0$0 = ($q_sroa_0_0_insert_ext75$0 << 1 | 0 >>> 31) & -2 | $carry_0_lcssa$0;
  return (tempRet0 = $_0$1, $_0$0) | 0;
}
// =======================================================================
// EMSCRIPTEN_END_FUNCS
// TODO: strip out parts of this we do not need
//======= begin closure i64 code =======
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */
var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };
  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.
    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };
  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.
  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};
  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }
    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };
  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };
  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };
  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }
    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));
    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };
  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.
  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;
  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);
  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);
  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);
  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);
  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);
  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };
  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };
  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (this.isZero()) {
      return '0';
    }
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }
    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));
    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };
  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };
  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };
  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };
  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };
  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };
  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };
  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };
  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }
    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }
    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };
  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };
  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };
  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }
    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }
    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }
    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));
      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);
      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }
      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }
      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };
  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };
  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };
  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };
  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };
  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };
  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };
  //======= begin jsbn =======
  var navigator = { appName: 'Modern Browser' }; // polyfill a little
  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/
  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */
  // Basic JavaScript BN library - subset useful for RSA encryption.
  // Bits per digit
  var dbits;
  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);
  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }
  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }
  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.
  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;
  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }
  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }
  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }
  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }
  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }
  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }
  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }
  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }
  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }
  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }
  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }
  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }
  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }
  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }
  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }
  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }
  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }
  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }
  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }
  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }
  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;
  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }
  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }
  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }
  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }
  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;
  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }
  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }
  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }
  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;
  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;
  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);
  // jsbn2 stuff
  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }
  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }
  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }
  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }
  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }
  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }
  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }
  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;
  //======= end jsbn =======
  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();
//======= end closure i64 code =======
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
var calledRun = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun && shouldRunNow) run();
  if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    calledRun = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + (new Error().stack);
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}
//@ sourceMappingURL=testsprite2.test.js.map