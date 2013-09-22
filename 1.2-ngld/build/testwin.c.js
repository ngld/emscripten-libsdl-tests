// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
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
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
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
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2 + 2*i;
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
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
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+7)>>3)<<3); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+7)>>3)<<3); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = ((((DYNAMICTOP)+7)>>3)<<3); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+(((low)>>>(0))))+((+(((high)>>>(0))))*(+(4294967296)))) : ((+(((low)>>>(0))))+((+(((high)|(0))))*(+(4294967296))))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
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
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math.abs(tempDouble))) >= (+(1)) ? (tempDouble > (+(0)) ? ((Math.min((+(Math.floor((tempDouble)/(+(4294967296))))), (+(4294967295))))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+(4294967296)))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
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
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
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
function getEmptySlot(x) {
  var slot = null;
  for (var i = 0; i < x.length; i++) {
    if (x[i] === null) {
      slot = i;
      break;
    }
  }
  if (slot === null) {
    slot = x.length;
  }
  return slot;
}
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
      dependenciesFulfilled();
      dependenciesFulfilled = null;
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 1472;
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });
var _stderr;
var _stderr = _stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([68,111,117,98,108,101,45,98,117,102,102,101,114,105,110,103,32,101,110,97,98,108,101,100,0,0,0,0,0,0,0,0,40,105,109,97,103,101,32,115,117,114,102,97,99,101,32,108,111,99,97,116,101,100,32,105,110,32,37,115,32,109,101,109,111,114,121,41,10,0,0,0,67,111,117,108,100,110,39,116,32,99,111,110,118,101,114,116,32,105,109,97,103,101,58,32,37,115,10,0,0,0,0,0,67,111,110,118,101,114,116,105,110,103,32,112,105,99,116,117,114,101,10,0,0,0,0,0,87,97,114,110,105,110,103,58,32,67,111,117,108,100,110,39,116,32,115,101,116,32,97,108,108,32,111,102,32,116,104,101,32,99,111,108,111,114,115,44,32,98,117,116,32,83,68,76,32,119,105,108,108,32,109,97,112,32,116,104,101,32,105,109,97,103,101,10,32,32,32,32,32,32,32,32,32,40,99,111,108,111,114,109,97,112,32,102,97,100,105,110,103,32,119,105,108,108,32,115,117,102,102,101,114,32,45,32,116,114,121,32,116,104,101,32,45,119,97,114,112,32,111,112,116,105,111,110,41,10,0,0,0,0,0,0,116,101,115,116,119,105,110,58,32,115,101,116,116,105,110,103,32,99,111,108,111,114,115,10,0,0,0,0,0,0,0,0,84,105,109,101,58,32,37,100,32,109,105,108,108,105,115,101,99,111,110,100,115,10,0,0,37,115,0,0,0,0,0,0,116,101,115,116,119,105,110,0,83,68,76,32,116,101,115,116,32,119,105,110,100,111,119,0,40,118,105,100,101,111,32,115,117,114,102,97,99,101,32,108,111,99,97,116,101,100,32,105,110,32,37,115,32,109,101,109,111,114,121,41,10,0,0,0,32,102,117,108,108,115,99,114,101,101,110,0,0,0,0,0,83,101,116,37,115,32,37,100,120,37,100,120,37,100,32,109,111,100,101,10,0,0,0,0,67,111,117,108,100,110,39,116,32,115,101,116,32,37,100,120,37,100,120,37,100,32,118,105,100,101,111,32,109,111,100,101,58,32,37,115,10,0,0,0,45,102,117,108,108,115,99,114,101,101,110,0,0,0,0,0,45,102,108,105,112,0,0,0,67,111,117,108,100,110,39,116,32,108,111,97,100,32,37,115,58,32,37,115,10,0,0,0,45,104,119,0,0,0,0,0,45,119,97,114,112,0,0,0,84,104,101,32,45,98,112,112,32,111,112,116,105,111,110,32,114,101,113,117,105,114,101,115,32,97,110,32,97,114,103,117,109,101,110,116,10,0,0,0,45,98,112,112,0,0,0,0,84,104,101,32,45,104,101,105,103,104,116,32,111,112,116,105,111,110,32,114,101,113,117,105,114,101,115,32,97,110,32,97,114,103,117,109,101,110,116,10,0,0,0,0,0,0,0,0,45,104,101,105,103,104,116,0,84,104,101,32,45,119,105,100,116,104,32,111,112,116,105,111,110,32,114,101,113,117,105,114,101,115,32,97,110,32,97,114,103,117,109,101,110,116,10,0,45,119,105,100,116,104,0,0,84,104,101,32,45,100,101,108,97,121,32,111,112,116,105,111,110,32,114,101,113,117,105,114,101,115,32,97,110,32,97,114,103,117,109,101,110,116,10,0,45,100,101,108,97,121,0,0,114,98,0,0,0,0,0,0,45,110,111,102,97,100,101,0,45,115,112,101,101,100,121,0,67,111,117,108,100,110,39,116,32,105,110,105,116,105,97,108,105,122,101,32,83,68,76,58,32,37,115,10,0,0,0,0,116,101,115,116,119,105,110,58,32,102,97,100,105,110,103,32,111,118,101,114,10,0,0,0,116,101,115,116,119,105,110,58,32,102,97,100,105,110,103,32,105,110,46,46,46,10,0,0,116,101,115,116,119,105,110,58,32,102,97,100,105,110,103,32,111,117,116,46,46,46,10,0,66,108,105,116,32,102,97,105,108,101,100,58,32,37,115,10,0,0,0,0,0,0,0,0,116,101,115,116,119,105,110,58,32,109,111,118,105,110,103,32,105,109,97,103,101,10,0,0,115,121,115,116,101,109,0,0,118,105,100,101,111,0,0,0,76,111,97,100,105,110,103,32,112,105,99,116,117,114,101,58,32,37,115,10,0,0,0,0,115,97,109,112,108,101,46,98,109,112,0,0,0,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
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
  var _llvm_dbg_declare=undefined;
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
          var size = Math.min(contents.length - position, length);
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
          var size = Math.min(contents.length - position, length);
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
  Module["_strlen"] = _strlen;
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
      }};var SDL={defaults:{width:320,height:200,copyOnLock:true},version:null,surfaces:{},cursors:{},canvasPool:[],events:[],fonts:[null],timers:["reserved"],audios:[null],rwops:[null],music:{audio:null,volume:1},mixerFrequency:22050,mixerFormat:32784,mixerNumChannels:2,mixerChunkSize:1024,channelMinimumNumber:0,GL:false,keyboardState:null,keyboardMap:{},canRequestFullscreen:false,isRequestingFullscreen:false,windowTitle:null,windowIcon:null,textInput:false,startTime:null,buttonState:0,modState:0,DOMButtons:[0,0,0],DOMEventToSDLEvent:{},keyCodes:{16:1249,17:1248,18:1250,33:1099,34:1102,37:1104,38:1106,39:1103,40:1105,46:127,96:1112,97:1113,98:1114,99:1115,100:1116,101:1117,102:1118,103:1119,104:1120,105:1121,112:1082,113:1083,114:1084,115:1085,116:1086,117:1087,118:1088,119:1089,120:1090,121:1091,122:1092,123:1093,173:45,188:44,190:46,191:47,192:96},scanCodes:{9:43,13:40,27:41,32:44,44:54,46:55,47:56,48:39,49:30,50:31,51:32,52:33,53:34,54:35,55:36,56:37,57:38,92:49,97:4,98:5,99:6,100:7,101:8,102:9,103:10,104:11,105:12,106:13,107:14,108:15,109:16,110:17,111:18,112:19,113:20,114:21,115:22,116:23,117:24,118:25,119:26,120:27,121:28,122:29,305:224,308:226},loadRect:function (rect) {
        return {
          x: HEAP32[((rect + 0)>>2)],
          y: HEAP32[((rect + 4)>>2)],
          w: HEAP32[((rect + 8)>>2)],
          h: HEAP32[((rect + 12)>>2)]
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
        var surf = _malloc(60);  // SDL_Surface has 15 fields of quantum size
        var buffer = _malloc(width*height*4); // TODO: only allocate when locked the first time
        var pixelFormat = _malloc(48);
        flags |= 1; // SDL_HWSURFACE - this tells SDL_MUSTLOCK that this needs to be locked
        //surface with SDL_HWPALETTE flag is 8bpp surface (1 byte)
        var is_SDL_HWPALETTE = flags & 0x00200000;  
        var bpp = is_SDL_HWPALETTE ? 1 : 4;
        HEAP32[((surf)>>2)]=flags         // SDL_Surface.flags
        HEAP32[(((surf)+(4))>>2)]=pixelFormat // SDL_Surface.format TODO
        HEAP32[(((surf)+(8))>>2)]=width         // SDL_Surface.w
        HEAP32[(((surf)+(12))>>2)]=height        // SDL_Surface.h
        HEAP32[(((surf)+(16))>>2)]=width * bpp       // SDL_Surface.pitch, assuming RGBA or indexed for now,
                                                                                 // since that is what ImageData gives us in browsers
        HEAP32[(((surf)+(20))>>2)]=buffer      // SDL_Surface.pixels
        HEAP32[(((surf)+(36))>>2)]=0      // SDL_Surface.offset
        HEAP32[(((surf)+(56))>>2)]=1
        HEAP32[((pixelFormat)>>2)]=-2042224636 // SDL_PIXELFORMAT_RGBA8888
        HEAP32[(((pixelFormat)+(4))>>2)]=0 // TODO
        HEAP8[(((pixelFormat)+(8))|0)]=bpp * 8
        HEAP8[(((pixelFormat)+(9))|0)]=bpp
        HEAP8[(((pixelFormat)+(36))|0)]=255
        HEAP32[(((pixelFormat)+(12))>>2)]=rmask || 0x000000ff
        HEAP32[(((pixelFormat)+(16))>>2)]=gmask || 0x0000ff00
        HEAP32[(((pixelFormat)+(20))>>2)]=bmask || 0x00ff0000
        HEAP32[(((pixelFormat)+(24))>>2)]=amask || 0xff000000
        // Decide if we want to use WebGL or not
        var useWebGL = (flags & 67108864) != 0;
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
        var refcount = HEAP32[(((surf)+(56))>>2)];
        if (refcount > 1) {
          HEAP32[(((surf)+(56))>>2)]=refcount - 1;
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
          _memcpy(ptr, event, 28); // XXX
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
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type]
            HEAP8[(((ptr)+(8))|0)]=down ? 1 : 0
            HEAP8[(((ptr)+(9))|0)]=0 // TODO
            HEAP32[(((ptr)+(12))>>2)]=scan
            HEAP32[(((ptr)+(16))>>2)]=key
            HEAP16[(((ptr)+(20))>>1)]=SDL.modState
            // some non-character keys (e.g. backspace and tab) won't have keypressCharCode set, fill in with the keyCode.
            HEAP32[(((ptr)+(24))>>2)]=event.keypressCharCode || key
            break;
          }
          case 'keypress': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type]
            // Not filling in windowID for now
            var cStr = intArrayFromString(String.fromCharCode(event.charCode));
            for (var i = 0; i < cStr.length; ++i) {
              HEAP8[(((ptr)+(8 + i))|0)]=cStr[i];
            }
            break;
          }
          case 'mousedown': case 'mouseup': case 'mousemove': {
            if (event.type != 'mousemove') {
              var down = event.type === 'mousedown';
              HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP8[(((ptr)+(8))|0)]=event.button+1; // DOM buttons are 0-2, SDL 1-3
              HEAP8[(((ptr)+(9))|0)]=down ? 1 : 0;
              HEAP32[(((ptr)+(12))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(16))>>2)]=Browser.mouseY;
            } else {
              HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP8[(((ptr)+(8))|0)]=SDL.buttonState;
              HEAP32[(((ptr)+(12))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(16))>>2)]=Browser.mouseY;
              HEAP32[(((ptr)+(20))>>2)]=Browser.mouseMovementX;
              HEAP32[(((ptr)+(24))>>2)]=Browser.mouseMovementY;
            }
            break;
          }
          case 'unload': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            break;
          }
          case 'resize': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(4))>>2)]=event.w;
            HEAP32[(((ptr)+(8))>>2)]=event.h;
            break;
          }
          default: throw 'Unhandled SDL event: ' + event.type;
        }
      },estimateTextWidth:function (fontData, text) {
        var h = fontData.size;
        var fontString = h + 'px ' + fontData.name;
        var tempCtx = SDL.ttfContext;
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
  function _SDL_GetError() {
      if (!SDL.errorMessage) {
        SDL.errorMessage = allocate(intArrayFromString("unknown SDL-emscripten error"), 'i8', ALLOC_NORMAL);
      }
      return SDL.errorMessage;
    }
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }
  function _SDL_SetColors(surf, colors, firstColor, nColors) {
      var surfData = SDL.surfaces[surf];
      // we should create colors array
      // only once cause client code
      // often wants to change portion 
      // of palette not all palette.
      if (!surfData.colors) {
        surfData.colors = new Uint8Array(256 * 3); //256 RGB colors
      } 
      for (var i = firstColor; i < firstColor + nColors; i++) {
        var index = i *3;
        surfData.colors[index] = HEAPU8[(((colors)+(i*4))|0)];
        surfData.colors[index +1] = HEAPU8[(((colors)+(i*4 +1))|0)];
        surfData.colors[index +2] = HEAPU8[(((colors)+(i*4 +2))|0)];
      }
      return 1;
    }
  function _SDL_MapRGB(fmt, r, g, b) {
      // Canvas screens are always RGBA. We assume the machine is little-endian.
      return r&0xff|(g&0xff)<<8|(b&0xff)<<16|0xff000000;
    }
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  function _SDL_UnlockSurface(surf) {
      assert(!SDL.GL); // in GL mode we do not keep around 2D canvases and contexts
      var surfData = SDL.surfaces[surf];
      surfData.locked--;
      if (surfData.locked > 0) return;
      // Copy pixel data to image
      if (surfData.isFlagSet(0x00200000 /* SDL_HWPALETTE */)) {
        SDL.copyIndexedColorData(surfData);
      } else if (!surfData.colors) {
        var data = surfData.image.data;
        var buffer = surfData.buffer;
        assert(buffer % 4 == 0, 'Invalid buffer offset: ' + buffer);
        var src = buffer >> 2;
        var dst = 0;
        var isScreen = surf == SDL.screen;
        var data32 = new Uint32Array(data.buffer);
        var num = data32.length;
        while (dst < num) {
          // HEAP32[src++] is an optimization. Instead, we could do HEAP32[(((buffer)+(dst))>>2)];
          data32[dst++] = HEAP32[src++] | (isScreen ? 0xff000000 : 0);
        }
      } else {
        var width = Module['canvas'].width;
        var height = Module['canvas'].height;
        var s = surfData.buffer;
        var data = surfData.image.data;
        var colors = surfData.colors;
        for (var y = 0; y < height; y++) {
          var base = y*width*4;
          for (var x = 0; x < width; x++) {
            // See comment above about signs
            var val = HEAPU8[((s++)|0)] * 3;
            var start = base + x*4;
            data[start]   = colors[val];
            data[start+1] = colors[val+1];
            data[start+2] = colors[val+2];
          }
          s += width*3;
        }
      }
      // Copy to canvas
      surfData.ctx.putImageData(surfData.image, 0, 0);
      // Note that we save the image, so future writes are fast. But, memory is not yet released
    }
  function _SDL_UpdateRect(surf, x, y, w, h) {
      // We actually do the whole screen in Unlock...
    }
  function _SDL_DisplayFormatAlpha(surf) {
      var oldData = SDL.surfaces[surf];
      var ret = SDL.makeSurface(oldData.width, oldData.height, oldData.flags, false, 'copy:' + oldData.source);
      var newData = SDL.surfaces[ret];
      //newData.ctx.putImageData(oldData.ctx.getImageData(0, 0, oldData.width, oldData.height), 0, 0);
      newData.ctx.drawImage(oldData.canvas, 0, 0);
      return ret;
    }var _SDL_DisplayFormat=_SDL_DisplayFormatAlpha;
  function _SDL_FreeSurface(surf) {
      if (surf) SDL.freeSurface(surf);
    }
  function _SDL_UpperBlit(src, srcrect, dst, dstrect) {
      var srcData = SDL.surfaces[src];
      var dstData = SDL.surfaces[dst];
      var sr, dr;
      if (srcrect) {
        sr = SDL.loadRect(srcrect);
      } else {
        sr = { x: 0, y: 0, w: srcData.width, h: srcData.height };
      }
      if (dstrect) {
        dr = SDL.loadRect(dstrect);
      } else {
        dr = { x: 0, y: 0, w: -1, h: -1 };
      }
      // This should fix issues with negative values for x or y.
      // It only works as long as dr and sr have the same size... otherwise the result will be slightly distorted.
      if (sr.x < 0) {
        sr.w += sr.x;
        dr.x -= sr.x;
        dr.w += sr.x;
        sr.x = 0;
      }
      if (sr.y < 0) {
        sr.h += sr.y;
        dr.y -= sr.y;
        dr.h += sr.y;
        sr.y = 0;
      }
      if (dr.x < 0) {
        dr.w += dr.x;
        sr.x -= dr.x;
        sr.w += dr.x;
        dr.x = 0;
      }
      if (dr.y < 0) {
        dr.h += dr.y;
        sr.y -= dr.y;
        sr.h += dr.y;
        dr.y = 0;
      }
      if(sr.w < 1 || sr.h < 1 || dr.w < 1 || dr.h < 1) return 1;
      dstData.ctx.globalAlpha = srcData.alpha / 255;
      dstData.ctx.drawImage(srcData.canvas, sr.x, sr.y, sr.w, sr.h, dr.x, dr.y, sr.w, sr.h);
      dstData.ctx.globalAlpha = 1;
      if (dst != SDL.screen) {
        // XXX As in IMG_Load, for compatibility we write out |pixels|
        console.log('WARNING: copying canvas data to memory for compatibility');
        _SDL_LockSurface(dst);
        dstData.locked--; // The surface is not actually locked in this hack
      }
      return 0;
    }
  function _SDL_Flip(surf) {
      // We actually do this in Unlock, since the screen surface has as its canvas
      // backing the page canvas element
    }
  function _SDL_UpdateRects(surf, numrects, rects) {
      // We actually do the whole screen in Unlock...
    }
  function _SDL_Init(what) {
      SDL.startTime = Date.now();
      // capture all key events. we just keep down and up, but also capture press to prevent default actions
      if (!Module['doNotCaptureKeyboard']) {
        document.addEventListener("keydown", SDL.receiveEvent);
        document.addEventListener("keyup", SDL.receiveEvent);
        document.addEventListener("keypress", SDL.receiveEvent);
        window.addEventListener("blur", SDL.receiveEvent);
        document.addEventListener("visibilitychange", SDL.receiveEvent);
      }
      window.addEventListener("unload", SDL.receiveEvent);
      SDL.keyboardState = _malloc(0x10000); // Our SDL needs 512, but 64K is safe for older SDLs
      _memset(SDL.keyboardState, 0, 0x10000);
      // Initialize this structure carefully for closure
      SDL.DOMEventToSDLEvent['keydown'] = 0x300 /* SDL_KEYDOWN */;
      SDL.DOMEventToSDLEvent['keyup'] = 0x301 /* SDL_KEYUP */;
      SDL.DOMEventToSDLEvent['keypress'] = 0x303 /* SDL_TEXTINPUT */;
      SDL.DOMEventToSDLEvent['mousedown'] = 0x401 /* SDL_MOUSEBUTTONDOWN */;
      SDL.DOMEventToSDLEvent['mouseup'] = 0x402 /* SDL_MOUSEBUTTONUP */;
      SDL.DOMEventToSDLEvent['mousemove'] = 0x400 /* SDL_MOUSEMOTION */;
      SDL.DOMEventToSDLEvent['unload'] = 0x100 /* SDL_QUIT */;
      SDL.DOMEventToSDLEvent['resize'] = 0x7001 /* SDL_VIDEORESIZE/SDL_EVENT_COMPAT2 */;
      return 0; // success
    }
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }function __parseInt(str, endptr, base, min, max, bits, unsign) {
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
      // Check for a plus/minus sign.
      var multiplier = 1;
      if (HEAP8[(str)] == 45) {
        multiplier = -1;
        str++;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
      // Find base.
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            str++;
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
      // Get digits.
      var chr;
      var ret = 0;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          ret = ret * finalBase + digit;
          str++;
        }
      }
      // Apply sign.
      ret *= multiplier;
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str
      }
      // Unsign if needed.
      if (unsign) {
        if (Math.abs(ret) > max) {
          ret = max;
          ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          ret = unSign(ret, bits);
        }
      }
      // Validate range.
      if (ret > max || ret < min) {
        ret = ret > max ? max : min;
        ___setErrNo(ERRNO_CODES.ERANGE);
      }
      if (bits == 64) {
        return ((asm["setTempRet0"]((tempDouble=ret,(+(Math.abs(tempDouble))) >= (+(1)) ? (tempDouble > (+(0)) ? ((Math.min((+(Math.floor((tempDouble)/(+(4294967296))))), (+(4294967295))))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+(4294967296)))))))>>>0) : 0)),ret>>>0)|0);
      }
      return ret;
    }function _strtol(str, endptr, base) {
      return __parseInt(str, endptr, base, -2147483648, 2147483647, 32);  // LONG_MIN, LONG_MAX.
    }function _atoi(ptr) {
      return _strtol(ptr, null, 10);
    }
  function _SDL_SetVideoMode(width, height, depth, flags) {
      ['mousedown', 'mouseup', 'mousemove', 'DOMMouseScroll', 'mousewheel', 'mouseout'].forEach(function(event) {
        Module['canvas'].addEventListener(event, SDL.receiveEvent, true);
      });
      Browser.setCanvasSize(width, height, true);
      // Free the old surface first.
      if (SDL.screen) {
        SDL.freeSurface(SDL.screen);
        SDL.screen = null;
      }
      SDL.screen = SDL.makeSurface(width, height, flags, true, 'screen');
      if (!SDL.addedResizeListener) {
        SDL.addedResizeListener = true;
        Browser.resizeListeners.push(function(w, h) {
          SDL.receiveEvent({
            type: 'resize',
            w: w,
            h: h
          });
        });
      }
      return SDL.screen;
    }
  function _SDL_WM_SetCaption(title, icon) {
      if(title) {
        document.title = SDL.windowTitle = Pointer_stringify(title);
      }
      if(icon) {
        SDL.windowIcon = Pointer_stringify(icon);
      }
    }
  function _SDL_GetTicks() {
      return Math.floor(Date.now() - SDL.startTime);
    }
  function _SDL_Quit() {
      for (var i = 0; i < SDL.numChannels; ++i) {
        if (SDL.channels[i].audio) {
          SDL.channels[i].audio.pause();
        }
      }
      if (SDL.music.audio) {
        SDL.music.audio.pause();
      }
      Module.print('SDL_Quit called (and ignored)');
    }
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module.print('exit(' + status + ') called');
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }
  function _llvm_dbg_value() {
  Module['printErr']('missing function: llvm_dbg_value'); abort(-1);
  }
  function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      return _write(stream, s, _strlen(s));
    }
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return -1;
      } else {
        return chr;
      }
    }function _puts(s) {
      // int puts(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/puts.html
      // NOTE: puts() always writes an extra newline.
      var stdout = HEAP32[((_stdout)>>2)];
      var ret = _fputs(s, stdout);
      if (ret < 0) {
        return ret;
      } else {
        var newlineRet = _fputc(10, stdout);
        return (newlineRet < 0) ? -1 : ret + 1;
      }
    }
  function _abort() {
      Module['abort']();
    }
  function ___errno_location() {
      return ___errno_state;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function() { Browser.getUserMedia() }
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var Math_min = Math.min;
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm = (function(global, env, buffer) {
  'use asm';
  var HEAP8 = new global.Int8Array(buffer);
  var HEAP16 = new global.Int16Array(buffer);
  var HEAP32 = new global.Int32Array(buffer);
  var HEAPU8 = new global.Uint8Array(buffer);
  var HEAPU16 = new global.Uint16Array(buffer);
  var HEAPU32 = new global.Uint32Array(buffer);
  var HEAPF32 = new global.Float32Array(buffer);
  var HEAPF64 = new global.Float64Array(buffer);
  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;
  var _stderr=env._stderr|0;
  var NaN=+env.NaN;
  var Infinity=+env.Infinity;
  var __THREW__ = 0;
  var threwValue = 0;
  var setjmpId = 0;
  var undef = 0;
  var tempInt = 0, tempBigInt = 0, tempBigIntP = 0, tempBigIntS = 0, tempBigIntR = 0.0, tempBigIntI = 0, tempBigIntD = 0, tempValue = 0, tempDouble = 0.0;
  var tempRet0 = 0;
  var tempRet1 = 0;
  var tempRet2 = 0;
  var tempRet3 = 0;
  var tempRet4 = 0;
  var tempRet5 = 0;
  var tempRet6 = 0;
  var tempRet7 = 0;
  var tempRet8 = 0;
  var tempRet9 = 0;
  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var abort=env.abort;
  var assert=env.assert;
  var asmPrintInt=env.asmPrintInt;
  var asmPrintFloat=env.asmPrintFloat;
  var Math_min=env.min;
  var invoke_ii=env.invoke_ii;
  var invoke_v=env.invoke_v;
  var invoke_iii=env.invoke_iii;
  var invoke_vi=env.invoke_vi;
  var _strncmp=env._strncmp;
  var _SDL_Flip=env._SDL_Flip;
  var _sysconf=env._sysconf;
  var _SDL_MapRGB=env._SDL_MapRGB;
  var _abort=env._abort;
  var _fprintf=env._fprintf;
  var _printf=env._printf;
  var _SDL_UpdateRects=env._SDL_UpdateRects;
  var _fflush=env._fflush;
  var _SDL_LockSurface=env._SDL_LockSurface;
  var __reallyNegative=env.__reallyNegative;
  var _SDL_SetVideoMode=env._SDL_SetVideoMode;
  var _strtol=env._strtol;
  var _SDL_DisplayFormatAlpha=env._SDL_DisplayFormatAlpha;
  var _SDL_UnlockSurface=env._SDL_UnlockSurface;
  var ___setErrNo=env.___setErrNo;
  var _fwrite=env._fwrite;
  var _SDL_RWFromFile=env._SDL_RWFromFile;
  var _send=env._send;
  var _write=env._write;
  var _fputs=env._fputs;
  var _SDL_UpperBlit=env._SDL_UpperBlit;
  var _SDL_Quit=env._SDL_Quit;
  var _exit=env._exit;
  var _SDL_UpdateRect=env._SDL_UpdateRect;
  var _SDL_GetError=env._SDL_GetError;
  var _isspace=env._isspace;
  var __parseInt=env.__parseInt;
  var _fputc=env._fputc;
  var _llvm_dbg_value=env._llvm_dbg_value;
  var __formatString=env.__formatString;
  var _IMG_Load_RW=env._IMG_Load_RW;
  var _SDL_SetColors=env._SDL_SetColors;
  var _SDL_GetTicks=env._SDL_GetTicks;
  var _SDL_WM_SetCaption=env._SDL_WM_SetCaption;
  var _pwrite=env._pwrite;
  var _puts=env._puts;
  var _sbrk=env._sbrk;
  var _SDL_Init=env._SDL_Init;
  var ___errno_location=env.___errno_location;
  var _atoi=env._atoi;
  var _SDL_FreeSurface=env._SDL_FreeSurface;
  var _time=env._time;
  var __exit=env.__exit;
  var _SDL_FreeRW=env._SDL_FreeRW;
  var _strcmp=env._strcmp;
// EMSCRIPTEN_START_FUNCS
function _malloc($bytes) {
 $bytes = $bytes | 0;
 var $8 = 0, $9 = 0, $10 = 0, $11 = 0, $17 = 0, $18 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $35 = 0, $40 = 0, $45 = 0, $56 = 0, $59 = 0, $62 = 0, $64 = 0, $65 = 0, $67 = 0, $69 = 0, $71 = 0, $73 = 0, $75 = 0, $77 = 0, $79 = 0, $82 = 0, $83 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $100 = 0, $105 = 0, $106 = 0, $109 = 0, $111 = 0, $117 = 0, $120 = 0, $121 = 0, $122 = 0, $124 = 0, $125 = 0, $126 = 0, $132 = 0, $133 = 0, $_pre_phi = 0, $F4_0 = 0, $145 = 0, $150 = 0, $152 = 0, $153 = 0, $155 = 0, $157 = 0, $159 = 0, $161 = 0, $163 = 0, $165 = 0, $167 = 0, $172 = 0, $rsize_0_i = 0, $v_0_i = 0, $t_0_i = 0, $179 = 0, $183 = 0, $185 = 0, $189 = 0, $190 = 0, $192 = 0, $193 = 0, $196 = 0, $197 = 0, $201 = 0, $203 = 0, $207 = 0, $211 = 0, $215 = 0, $220 = 0, $221 = 0, $224 = 0, $225 = 0, $RP_0_i = 0, $R_0_i = 0, $227 = 0, $228 = 0, $231 = 0, $232 = 0, $R_1_i = 0, $242 = 0, $244 = 0, $258 = 0, $274 = 0, $286 = 0, $300 = 0, $304 = 0, $315 = 0, $318 = 0, $319 = 0, $320 = 0, $322 = 0, $323 = 0, $324 = 0, $330 = 0, $331 = 0, $_pre_phi_i = 0, $F1_0_i = 0, $342 = 0, $348 = 0, $349 = 0, $350 = 0, $353 = 0, $354 = 0, $361 = 0, $362 = 0, $365 = 0, $367 = 0, $370 = 0, $375 = 0, $idx_0_i = 0, $383 = 0, $391 = 0, $rst_0_i = 0, $sizebits_0_i = 0, $t_0_i116 = 0, $rsize_0_i117 = 0, $v_0_i118 = 0, $396 = 0, $397 = 0, $rsize_1_i = 0, $v_1_i = 0, $403 = 0, $406 = 0, $rst_1_i = 0, $t_1_i = 0, $rsize_2_i = 0, $v_2_i = 0, $414 = 0, $417 = 0, $422 = 0, $424 = 0, $425 = 0, $427 = 0, $429 = 0, $431 = 0, $433 = 0, $435 = 0, $437 = 0, $439 = 0, $t_2_ph_i = 0, $v_330_i = 0, $rsize_329_i = 0, $t_228_i = 0, $449 = 0, $450 = 0, $_rsize_3_i = 0, $t_2_v_3_i = 0, $452 = 0, $455 = 0, $v_3_lcssa_i = 0, $rsize_3_lcssa_i = 0, $463 = 0, $464 = 0, $467 = 0, $468 = 0, $472 = 0, $474 = 0, $478 = 0, $482 = 0, $486 = 0, $491 = 0, $492 = 0, $495 = 0, $496 = 0, $RP_0_i119 = 0, $R_0_i120 = 0, $498 = 0, $499 = 0, $502 = 0, $503 = 0, $R_1_i122 = 0, $513 = 0, $515 = 0, $529 = 0, $545 = 0, $557 = 0, $571 = 0, $575 = 0, $586 = 0, $589 = 0, $591 = 0, $592 = 0, $593 = 0, $599 = 0, $600 = 0, $_pre_phi_i128 = 0, $F5_0_i = 0, $612 = 0, $613 = 0, $620 = 0, $621 = 0, $624 = 0, $626 = 0, $629 = 0, $634 = 0, $I7_0_i = 0, $641 = 0, $648 = 0, $649 = 0, $668 = 0, $T_0_i = 0, $K12_0_i = 0, $677 = 0, $678 = 0, $694 = 0, $695 = 0, $697 = 0, $711 = 0, $nb_0 = 0, $714 = 0, $717 = 0, $718 = 0, $721 = 0, $736 = 0, $743 = 0, $746 = 0, $747 = 0, $748 = 0, $762 = 0, $771 = 0, $772 = 0, $773 = 0, $774 = 0, $775 = 0, $776 = 0, $779 = 0, $782 = 0, $783 = 0, $791 = 0, $794 = 0, $sp_0_i_i = 0, $796 = 0, $797 = 0, $800 = 0, $806 = 0, $809 = 0, $812 = 0, $813 = 0, $814 = 0, $ssize_0_i = 0, $824 = 0, $825 = 0, $829 = 0, $835 = 0, $836 = 0, $840 = 0, $843 = 0, $847 = 0, $ssize_1_i = 0, $br_0_i = 0, $tsize_0_i = 0, $tbase_0_i = 0, $849 = 0, $856 = 0, $860 = 0, $ssize_2_i = 0, $tsize_0303639_i = 0, $tsize_1_i = 0, $876 = 0, $877 = 0, $881 = 0, $883 = 0, $_tbase_1_i = 0, $tbase_245_i = 0, $tsize_244_i = 0, $886 = 0, $890 = 0, $893 = 0, $i_02_i_i = 0, $899 = 0, $901 = 0, $908 = 0, $914 = 0, $917 = 0, $sp_067_i = 0, $925 = 0, $926 = 0, $927 = 0, $932 = 0, $939 = 0, $944 = 0, $946 = 0, $947 = 0, $949 = 0, $955 = 0, $958 = 0, $968 = 0, $sp_160_i = 0, $970 = 0, $975 = 0, $982 = 0, $986 = 0, $993 = 0, $996 = 0, $1003 = 0, $1004 = 0, $1005 = 0, $_sum_i21_i = 0, $1009 = 0, $1010 = 0, $1011 = 0, $1019 = 0, $1028 = 0, $_sum2_i23_i = 0, $1037 = 0, $1041 = 0, $1042 = 0, $1047 = 0, $1050 = 0, $1053 = 0, $1076 = 0, $_pre_phi57_i_i = 0, $1081 = 0, $1084 = 0, $1087 = 0, $1092 = 0, $1097 = 0, $1101 = 0, $_sum67_i_i = 0, $1107 = 0, $1108 = 0, $1112 = 0, $1113 = 0, $RP_0_i_i = 0, $R_0_i_i = 0, $1115 = 0, $1116 = 0, $1119 = 0, $1120 = 0, $R_1_i_i = 0, $1132 = 0, $1134 = 0, $1148 = 0, $_sum3233_i_i = 0, $1165 = 0, $1178 = 0, $qsize_0_i_i = 0, $oldfirst_0_i_i = 0, $1194 = 0, $1202 = 0, $1205 = 0, $1207 = 0, $1208 = 0, $1209 = 0, $1215 = 0, $1216 = 0, $_pre_phi_i25_i = 0, $F4_0_i_i = 0, $1228 = 0, $1229 = 0, $1236 = 0, $1237 = 0, $1240 = 0, $1242 = 0, $1245 = 0, $1250 = 0, $I7_0_i_i = 0, $1257 = 0, $1264 = 0, $1265 = 0, $1284 = 0, $T_0_i27_i = 0, $K8_0_i_i = 0, $1293 = 0, $1294 = 0, $1310 = 0, $1311 = 0, $1313 = 0, $1327 = 0, $sp_0_i_i_i = 0, $1330 = 0, $1334 = 0, $1335 = 0, $1341 = 0, $1348 = 0, $1349 = 0, $1353 = 0, $1354 = 0, $1358 = 0, $1364 = 0, $1367 = 0, $1377 = 0, $1380 = 0, $1381 = 0, $1389 = 0, $1392 = 0, $1398 = 0, $1401 = 0, $1403 = 0, $1404 = 0, $1405 = 0, $1411 = 0, $1412 = 0, $_pre_phi_i_i = 0, $F_0_i_i = 0, $1422 = 0, $1423 = 0, $1430 = 0, $1431 = 0, $1434 = 0, $1436 = 0, $1439 = 0, $1444 = 0, $I1_0_i_i = 0, $1451 = 0, $1455 = 0, $1456 = 0, $1471 = 0, $T_0_i_i = 0, $K2_0_i_i = 0, $1480 = 0, $1481 = 0, $1494 = 0, $1495 = 0, $1497 = 0, $1507 = 0, $1510 = 0, $1511 = 0, $1512 = 0, $mem_0 = 0, label = 0;
 do {
  if ($bytes >>> 0 < 245) {
   if ($bytes >>> 0 < 11) {
    $8 = 16; //@line 1369
   } else {
    $8 = $bytes + 11 & -8; //@line 1373
   }
   $9 = $8 >>> 3; //@line 1376
   $10 = HEAP32[252] | 0; //@line 1377
   $11 = $10 >>> ($9 >>> 0); //@line 1378
   if (($11 & 3 | 0) != 0) {
    $17 = ($11 & 1 ^ 1) + $9 | 0; //@line 1384
    $18 = $17 << 1; //@line 1385
    $20 = 1048 + ($18 << 2) | 0; //@line 1387
    $21 = 1048 + ($18 + 2 << 2) | 0; //@line 1389
    $22 = HEAP32[$21 >> 2] | 0; //@line 1390
    $23 = $22 + 8 | 0; //@line 1391
    $24 = HEAP32[$23 >> 2] | 0; //@line 1392
    do {
     if (($20 | 0) == ($24 | 0)) {
      HEAP32[252] = $10 & ~(1 << $17); //@line 1399
     } else {
      if ($24 >>> 0 < (HEAP32[256] | 0) >>> 0) {
       _abort(); //@line 1405
       return 0; //@line 1405
      }
      $35 = $24 + 12 | 0; //@line 1408
      if ((HEAP32[$35 >> 2] | 0) == ($22 | 0)) {
       HEAP32[$35 >> 2] = $20; //@line 1412
       HEAP32[$21 >> 2] = $24; //@line 1413
       break;
      } else {
       _abort(); //@line 1416
       return 0; //@line 1416
      }
     }
    } while (0);
    $40 = $17 << 3; //@line 1421
    HEAP32[$22 + 4 >> 2] = $40 | 3; //@line 1424
    $45 = $22 + ($40 | 4) | 0; //@line 1428
    HEAP32[$45 >> 2] = HEAP32[$45 >> 2] | 1; //@line 1431
    $mem_0 = $23; //@line 1433
    return $mem_0 | 0; //@line 1436
   }
   if ($8 >>> 0 <= (HEAP32[254] | 0) >>> 0) {
    $nb_0 = $8; //@line 1441
    break;
   }
   if (($11 | 0) != 0) {
    $56 = 2 << $9; //@line 1447
    $59 = $11 << $9 & ($56 | -$56); //@line 1450
    $62 = ($59 & -$59) - 1 | 0; //@line 1453
    $64 = $62 >>> 12 & 16; //@line 1455
    $65 = $62 >>> ($64 >>> 0); //@line 1456
    $67 = $65 >>> 5 & 8; //@line 1458
    $69 = $65 >>> ($67 >>> 0); //@line 1460
    $71 = $69 >>> 2 & 4; //@line 1462
    $73 = $69 >>> ($71 >>> 0); //@line 1464
    $75 = $73 >>> 1 & 2; //@line 1466
    $77 = $73 >>> ($75 >>> 0); //@line 1468
    $79 = $77 >>> 1 & 1; //@line 1470
    $82 = ($67 | $64 | $71 | $75 | $79) + ($77 >>> ($79 >>> 0)) | 0; //@line 1473
    $83 = $82 << 1; //@line 1474
    $85 = 1048 + ($83 << 2) | 0; //@line 1476
    $86 = 1048 + ($83 + 2 << 2) | 0; //@line 1478
    $87 = HEAP32[$86 >> 2] | 0; //@line 1479
    $88 = $87 + 8 | 0; //@line 1480
    $89 = HEAP32[$88 >> 2] | 0; //@line 1481
    do {
     if (($85 | 0) == ($89 | 0)) {
      HEAP32[252] = $10 & ~(1 << $82); //@line 1488
     } else {
      if ($89 >>> 0 < (HEAP32[256] | 0) >>> 0) {
       _abort(); //@line 1494
       return 0; //@line 1494
      }
      $100 = $89 + 12 | 0; //@line 1497
      if ((HEAP32[$100 >> 2] | 0) == ($87 | 0)) {
       HEAP32[$100 >> 2] = $85; //@line 1501
       HEAP32[$86 >> 2] = $89; //@line 1502
       break;
      } else {
       _abort(); //@line 1505
       return 0; //@line 1505
      }
     }
    } while (0);
    $105 = $82 << 3; //@line 1510
    $106 = $105 - $8 | 0; //@line 1511
    HEAP32[$87 + 4 >> 2] = $8 | 3; //@line 1514
    $109 = $87; //@line 1515
    $111 = $109 + $8 | 0; //@line 1517
    HEAP32[$109 + ($8 | 4) >> 2] = $106 | 1; //@line 1522
    HEAP32[$109 + $105 >> 2] = $106; //@line 1525
    $117 = HEAP32[254] | 0; //@line 1526
    if (($117 | 0) != 0) {
     $120 = HEAP32[257] | 0; //@line 1529
     $121 = $117 >>> 3; //@line 1530
     $122 = $121 << 1; //@line 1531
     $124 = 1048 + ($122 << 2) | 0; //@line 1533
     $125 = HEAP32[252] | 0; //@line 1534
     $126 = 1 << $121; //@line 1535
     do {
      if (($125 & $126 | 0) == 0) {
       HEAP32[252] = $125 | $126; //@line 1541
       $F4_0 = $124;
       $_pre_phi = 1048 + ($122 + 2 << 2) | 0;
      } else {
       $132 = 1048 + ($122 + 2 << 2) | 0; //@line 1547
       $133 = HEAP32[$132 >> 2] | 0; //@line 1548
       if ($133 >>> 0 >= (HEAP32[256] | 0) >>> 0) {
        $F4_0 = $133;
        $_pre_phi = $132;
        break;
       }
       _abort(); //@line 1556
       return 0; //@line 1556
      }
     } while (0);
     HEAP32[$_pre_phi >> 2] = $120; //@line 1562
     HEAP32[$F4_0 + 12 >> 2] = $120; //@line 1564
     HEAP32[$120 + 8 >> 2] = $F4_0; //@line 1566
     HEAP32[$120 + 12 >> 2] = $124; //@line 1568
    }
    HEAP32[254] = $106; //@line 1570
    HEAP32[257] = $111; //@line 1571
    $mem_0 = $88; //@line 1573
    return $mem_0 | 0; //@line 1576
   }
   $145 = HEAP32[253] | 0; //@line 1578
   if (($145 | 0) == 0) {
    $nb_0 = $8; //@line 1581
    break;
   }
   $150 = ($145 & -$145) - 1 | 0; //@line 1586
   $152 = $150 >>> 12 & 16; //@line 1588
   $153 = $150 >>> ($152 >>> 0); //@line 1589
   $155 = $153 >>> 5 & 8; //@line 1591
   $157 = $153 >>> ($155 >>> 0); //@line 1593
   $159 = $157 >>> 2 & 4; //@line 1595
   $161 = $157 >>> ($159 >>> 0); //@line 1597
   $163 = $161 >>> 1 & 2; //@line 1599
   $165 = $161 >>> ($163 >>> 0); //@line 1601
   $167 = $165 >>> 1 & 1; //@line 1603
   $172 = HEAP32[1312 + (($155 | $152 | $159 | $163 | $167) + ($165 >>> ($167 >>> 0)) << 2) >> 2] | 0; //@line 1608
   $t_0_i = $172;
   $v_0_i = $172;
   $rsize_0_i = (HEAP32[$172 + 4 >> 2] & -8) - $8 | 0;
   while (1) {
    $179 = HEAP32[$t_0_i + 16 >> 2] | 0; //@line 1619
    if (($179 | 0) == 0) {
     $183 = HEAP32[$t_0_i + 20 >> 2] | 0; //@line 1623
     if (($183 | 0) == 0) {
      break;
     } else {
      $185 = $183; //@line 1628
     }
    } else {
     $185 = $179; //@line 1631
    }
    $189 = (HEAP32[$185 + 4 >> 2] & -8) - $8 | 0; //@line 1637
    $190 = $189 >>> 0 < $rsize_0_i >>> 0; //@line 1638
    $t_0_i = $185;
    $v_0_i = $190 ? $185 : $v_0_i;
    $rsize_0_i = $190 ? $189 : $rsize_0_i;
   }
   $192 = $v_0_i; //@line 1643
   $193 = HEAP32[256] | 0; //@line 1644
   if ($192 >>> 0 < $193 >>> 0) {
    _abort(); //@line 1647
    return 0; //@line 1647
   }
   $196 = $192 + $8 | 0; //@line 1650
   $197 = $196; //@line 1651
   if ($192 >>> 0 >= $196 >>> 0) {
    _abort(); //@line 1654
    return 0; //@line 1654
   }
   $201 = HEAP32[$v_0_i + 24 >> 2] | 0; //@line 1658
   $203 = HEAP32[$v_0_i + 12 >> 2] | 0; //@line 1660
   do {
    if (($203 | 0) == ($v_0_i | 0)) {
     $220 = $v_0_i + 20 | 0; //@line 1664
     $221 = HEAP32[$220 >> 2] | 0; //@line 1665
     if (($221 | 0) == 0) {
      $224 = $v_0_i + 16 | 0; //@line 1668
      $225 = HEAP32[$224 >> 2] | 0; //@line 1669
      if (($225 | 0) == 0) {
       $R_1_i = 0; //@line 1672
       break;
      } else {
       $R_0_i = $225;
       $RP_0_i = $224;
      }
     } else {
      $R_0_i = $221;
      $RP_0_i = $220;
     }
     while (1) {
      $227 = $R_0_i + 20 | 0; //@line 1683
      $228 = HEAP32[$227 >> 2] | 0; //@line 1684
      if (($228 | 0) != 0) {
       $R_0_i = $228;
       $RP_0_i = $227;
       continue;
      }
      $231 = $R_0_i + 16 | 0; //@line 1690
      $232 = HEAP32[$231 >> 2] | 0; //@line 1691
      if (($232 | 0) == 0) {
       break;
      } else {
       $R_0_i = $232;
       $RP_0_i = $231;
      }
     }
     if ($RP_0_i >>> 0 < $193 >>> 0) {
      _abort(); //@line 1702
      return 0; //@line 1702
     } else {
      HEAP32[$RP_0_i >> 2] = 0; //@line 1705
      $R_1_i = $R_0_i; //@line 1706
      break;
     }
    } else {
     $207 = HEAP32[$v_0_i + 8 >> 2] | 0; //@line 1711
     if ($207 >>> 0 < $193 >>> 0) {
      _abort(); //@line 1715
      return 0; //@line 1715
     }
     $211 = $207 + 12 | 0; //@line 1718
     if ((HEAP32[$211 >> 2] | 0) != ($v_0_i | 0)) {
      _abort(); //@line 1722
      return 0; //@line 1722
     }
     $215 = $203 + 8 | 0; //@line 1725
     if ((HEAP32[$215 >> 2] | 0) == ($v_0_i | 0)) {
      HEAP32[$211 >> 2] = $203; //@line 1729
      HEAP32[$215 >> 2] = $207; //@line 1730
      $R_1_i = $203; //@line 1731
      break;
     } else {
      _abort(); //@line 1734
      return 0; //@line 1734
     }
    }
   } while (0);
   L227 : do {
    if (($201 | 0) != 0) {
     $242 = $v_0_i + 28 | 0; //@line 1743
     $244 = 1312 + (HEAP32[$242 >> 2] << 2) | 0; //@line 1745
     do {
      if (($v_0_i | 0) == (HEAP32[$244 >> 2] | 0)) {
       HEAP32[$244 >> 2] = $R_1_i; //@line 1750
       if (($R_1_i | 0) != 0) {
        break;
       }
       HEAP32[253] = HEAP32[253] & ~(1 << HEAP32[$242 >> 2]); //@line 1760
       break L227;
      } else {
       if ($201 >>> 0 < (HEAP32[256] | 0) >>> 0) {
        _abort(); //@line 1767
        return 0; //@line 1767
       }
       $258 = $201 + 16 | 0; //@line 1770
       if ((HEAP32[$258 >> 2] | 0) == ($v_0_i | 0)) {
        HEAP32[$258 >> 2] = $R_1_i; //@line 1774
       } else {
        HEAP32[$201 + 20 >> 2] = $R_1_i; //@line 1777
       }
       if (($R_1_i | 0) == 0) {
        break L227;
       }
      }
     } while (0);
     if ($R_1_i >>> 0 < (HEAP32[256] | 0) >>> 0) {
      _abort(); //@line 1789
      return 0; //@line 1789
     }
     HEAP32[$R_1_i + 24 >> 2] = $201; //@line 1793
     $274 = HEAP32[$v_0_i + 16 >> 2] | 0; //@line 1795
     do {
      if (($274 | 0) != 0) {
       if ($274 >>> 0 < (HEAP32[256] | 0) >>> 0) {
        _abort(); //@line 1803
        return 0; //@line 1803
       } else {
        HEAP32[$R_1_i + 16 >> 2] = $274; //@line 1807
        HEAP32[$274 + 24 >> 2] = $R_1_i; //@line 1809
        break;
       }
      }
     } while (0);
     $286 = HEAP32[$v_0_i + 20 >> 2] | 0; //@line 1815
     if (($286 | 0) == 0) {
      break;
     }
     if ($286 >>> 0 < (HEAP32[256] | 0) >>> 0) {
      _abort(); //@line 1824
      return 0; //@line 1824
     } else {
      HEAP32[$R_1_i + 20 >> 2] = $286; //@line 1828
      HEAP32[$286 + 24 >> 2] = $R_1_i; //@line 1830
      break;
     }
    }
   } while (0);
   if ($rsize_0_i >>> 0 < 16) {
    $300 = $rsize_0_i + $8 | 0; //@line 1837
    HEAP32[$v_0_i + 4 >> 2] = $300 | 3; //@line 1840
    $304 = $192 + ($300 + 4) | 0; //@line 1843
    HEAP32[$304 >> 2] = HEAP32[$304 >> 2] | 1; //@line 1846
   } else {
    HEAP32[$v_0_i + 4 >> 2] = $8 | 3; //@line 1850
    HEAP32[$192 + ($8 | 4) >> 2] = $rsize_0_i | 1; //@line 1855
    HEAP32[$192 + ($rsize_0_i + $8) >> 2] = $rsize_0_i; //@line 1859
    $315 = HEAP32[254] | 0; //@line 1860
    if (($315 | 0) != 0) {
     $318 = HEAP32[257] | 0; //@line 1863
     $319 = $315 >>> 3; //@line 1864
     $320 = $319 << 1; //@line 1865
     $322 = 1048 + ($320 << 2) | 0; //@line 1867
     $323 = HEAP32[252] | 0; //@line 1868
     $324 = 1 << $319; //@line 1869
     do {
      if (($323 & $324 | 0) == 0) {
       HEAP32[252] = $323 | $324; //@line 1875
       $F1_0_i = $322;
       $_pre_phi_i = 1048 + ($320 + 2 << 2) | 0;
      } else {
       $330 = 1048 + ($320 + 2 << 2) | 0; //@line 1881
       $331 = HEAP32[$330 >> 2] | 0; //@line 1882
       if ($331 >>> 0 >= (HEAP32[256] | 0) >>> 0) {
        $F1_0_i = $331;
        $_pre_phi_i = $330;
        break;
       }
       _abort(); //@line 1890
       return 0; //@line 1890
      }
     } while (0);
     HEAP32[$_pre_phi_i >> 2] = $318; //@line 1896
     HEAP32[$F1_0_i + 12 >> 2] = $318; //@line 1898
     HEAP32[$318 + 8 >> 2] = $F1_0_i; //@line 1900
     HEAP32[$318 + 12 >> 2] = $322; //@line 1902
    }
    HEAP32[254] = $rsize_0_i; //@line 1904
    HEAP32[257] = $197; //@line 1905
   }
   $342 = $v_0_i + 8 | 0; //@line 1907
   if (($342 | 0) == 0) {
    $nb_0 = $8; //@line 1911
    break;
   } else {
    $mem_0 = $342; //@line 1914
   }
   return $mem_0 | 0; //@line 1918
  } else {
   if ($bytes >>> 0 > 4294967231) {
    $nb_0 = -1; //@line 1922
    break;
   }
   $348 = $bytes + 11 | 0; //@line 1925
   $349 = $348 & -8; //@line 1926
   $350 = HEAP32[253] | 0; //@line 1927
   if (($350 | 0) == 0) {
    $nb_0 = $349; //@line 1930
    break;
   }
   $353 = -$349 | 0; //@line 1933
   $354 = $348 >>> 8; //@line 1934
   do {
    if (($354 | 0) == 0) {
     $idx_0_i = 0; //@line 1938
    } else {
     if ($349 >>> 0 > 16777215) {
      $idx_0_i = 31; //@line 1942
      break;
     }
     $361 = ($354 + 1048320 | 0) >>> 16 & 8; //@line 1947
     $362 = $354 << $361; //@line 1948
     $365 = ($362 + 520192 | 0) >>> 16 & 4; //@line 1951
     $367 = $362 << $365; //@line 1953
     $370 = ($367 + 245760 | 0) >>> 16 & 2; //@line 1956
     $375 = 14 - ($365 | $361 | $370) + ($367 << $370 >>> 15) | 0; //@line 1961
     $idx_0_i = $349 >>> (($375 + 7 | 0) >>> 0) & 1 | $375 << 1; //@line 1967
    }
   } while (0);
   $383 = HEAP32[1312 + ($idx_0_i << 2) >> 2] | 0; //@line 1972
   L275 : do {
    if (($383 | 0) == 0) {
     $v_2_i = 0;
     $rsize_2_i = $353;
     $t_1_i = 0;
    } else {
     if (($idx_0_i | 0) == 31) {
      $391 = 0; //@line 1980
     } else {
      $391 = 25 - ($idx_0_i >>> 1) | 0; //@line 1984
     }
     $v_0_i118 = 0;
     $rsize_0_i117 = $353;
     $t_0_i116 = $383;
     $sizebits_0_i = $349 << $391;
     $rst_0_i = 0;
     while (1) {
      $396 = HEAP32[$t_0_i116 + 4 >> 2] & -8; //@line 1997
      $397 = $396 - $349 | 0; //@line 1998
      if ($397 >>> 0 < $rsize_0_i117 >>> 0) {
       if (($396 | 0) == ($349 | 0)) {
        $v_2_i = $t_0_i116;
        $rsize_2_i = $397;
        $t_1_i = $t_0_i116;
        break L275;
       } else {
        $v_1_i = $t_0_i116;
        $rsize_1_i = $397;
       }
      } else {
       $v_1_i = $v_0_i118;
       $rsize_1_i = $rsize_0_i117;
      }
      $403 = HEAP32[$t_0_i116 + 20 >> 2] | 0; //@line 2014
      $406 = HEAP32[$t_0_i116 + 16 + ($sizebits_0_i >>> 31 << 2) >> 2] | 0; //@line 2017
      $rst_1_i = ($403 | 0) == 0 | ($403 | 0) == ($406 | 0) ? $rst_0_i : $403; //@line 2021
      if (($406 | 0) == 0) {
       $v_2_i = $v_1_i;
       $rsize_2_i = $rsize_1_i;
       $t_1_i = $rst_1_i;
       break;
      } else {
       $v_0_i118 = $v_1_i;
       $rsize_0_i117 = $rsize_1_i;
       $t_0_i116 = $406;
       $sizebits_0_i = $sizebits_0_i << 1;
       $rst_0_i = $rst_1_i;
      }
     }
    }
   } while (0);
   if (($t_1_i | 0) == 0 & ($v_2_i | 0) == 0) {
    $414 = 2 << $idx_0_i; //@line 2040
    $417 = $350 & ($414 | -$414); //@line 2043
    if (($417 | 0) == 0) {
     $nb_0 = $349; //@line 2046
     break;
    }
    $422 = ($417 & -$417) - 1 | 0; //@line 2051
    $424 = $422 >>> 12 & 16; //@line 2053
    $425 = $422 >>> ($424 >>> 0); //@line 2054
    $427 = $425 >>> 5 & 8; //@line 2056
    $429 = $425 >>> ($427 >>> 0); //@line 2058
    $431 = $429 >>> 2 & 4; //@line 2060
    $433 = $429 >>> ($431 >>> 0); //@line 2062
    $435 = $433 >>> 1 & 2; //@line 2064
    $437 = $433 >>> ($435 >>> 0); //@line 2066
    $439 = $437 >>> 1 & 1; //@line 2068
    $t_2_ph_i = HEAP32[1312 + (($427 | $424 | $431 | $435 | $439) + ($437 >>> ($439 >>> 0)) << 2) >> 2] | 0; //@line 2074
   } else {
    $t_2_ph_i = $t_1_i; //@line 2076
   }
   if (($t_2_ph_i | 0) == 0) {
    $rsize_3_lcssa_i = $rsize_2_i;
    $v_3_lcssa_i = $v_2_i;
   } else {
    $t_228_i = $t_2_ph_i;
    $rsize_329_i = $rsize_2_i;
    $v_330_i = $v_2_i;
    while (1) {
     $449 = (HEAP32[$t_228_i + 4 >> 2] & -8) - $349 | 0; //@line 2091
     $450 = $449 >>> 0 < $rsize_329_i >>> 0; //@line 2092
     $_rsize_3_i = $450 ? $449 : $rsize_329_i; //@line 2093
     $t_2_v_3_i = $450 ? $t_228_i : $v_330_i; //@line 2094
     $452 = HEAP32[$t_228_i + 16 >> 2] | 0; //@line 2096
     if (($452 | 0) != 0) {
      $t_228_i = $452;
      $rsize_329_i = $_rsize_3_i;
      $v_330_i = $t_2_v_3_i;
      continue;
     }
     $455 = HEAP32[$t_228_i + 20 >> 2] | 0; //@line 2103
     if (($455 | 0) == 0) {
      $rsize_3_lcssa_i = $_rsize_3_i;
      $v_3_lcssa_i = $t_2_v_3_i;
      break;
     } else {
      $t_228_i = $455;
      $rsize_329_i = $_rsize_3_i;
      $v_330_i = $t_2_v_3_i;
     }
    }
   }
   if (($v_3_lcssa_i | 0) == 0) {
    $nb_0 = $349; //@line 2117
    break;
   }
   if ($rsize_3_lcssa_i >>> 0 >= ((HEAP32[254] | 0) - $349 | 0) >>> 0) {
    $nb_0 = $349; //@line 2124
    break;
   }
   $463 = $v_3_lcssa_i; //@line 2127
   $464 = HEAP32[256] | 0; //@line 2128
   if ($463 >>> 0 < $464 >>> 0) {
    _abort(); //@line 2131
    return 0; //@line 2131
   }
   $467 = $463 + $349 | 0; //@line 2134
   $468 = $467; //@line 2135
   if ($463 >>> 0 >= $467 >>> 0) {
    _abort(); //@line 2138
    return 0; //@line 2138
   }
   $472 = HEAP32[$v_3_lcssa_i + 24 >> 2] | 0; //@line 2142
   $474 = HEAP32[$v_3_lcssa_i + 12 >> 2] | 0; //@line 2144
   do {
    if (($474 | 0) == ($v_3_lcssa_i | 0)) {
     $491 = $v_3_lcssa_i + 20 | 0; //@line 2148
     $492 = HEAP32[$491 >> 2] | 0; //@line 2149
     if (($492 | 0) == 0) {
      $495 = $v_3_lcssa_i + 16 | 0; //@line 2152
      $496 = HEAP32[$495 >> 2] | 0; //@line 2153
      if (($496 | 0) == 0) {
       $R_1_i122 = 0; //@line 2156
       break;
      } else {
       $R_0_i120 = $496;
       $RP_0_i119 = $495;
      }
     } else {
      $R_0_i120 = $492;
      $RP_0_i119 = $491;
     }
     while (1) {
      $498 = $R_0_i120 + 20 | 0; //@line 2167
      $499 = HEAP32[$498 >> 2] | 0; //@line 2168
      if (($499 | 0) != 0) {
       $R_0_i120 = $499;
       $RP_0_i119 = $498;
       continue;
      }
      $502 = $R_0_i120 + 16 | 0; //@line 2174
      $503 = HEAP32[$502 >> 2] | 0; //@line 2175
      if (($503 | 0) == 0) {
       break;
      } else {
       $R_0_i120 = $503;
       $RP_0_i119 = $502;
      }
     }
     if ($RP_0_i119 >>> 0 < $464 >>> 0) {
      _abort(); //@line 2186
      return 0; //@line 2186
     } else {
      HEAP32[$RP_0_i119 >> 2] = 0; //@line 2189
      $R_1_i122 = $R_0_i120; //@line 2190
      break;
     }
    } else {
     $478 = HEAP32[$v_3_lcssa_i + 8 >> 2] | 0; //@line 2195
     if ($478 >>> 0 < $464 >>> 0) {
      _abort(); //@line 2199
      return 0; //@line 2199
     }
     $482 = $478 + 12 | 0; //@line 2202
     if ((HEAP32[$482 >> 2] | 0) != ($v_3_lcssa_i | 0)) {
      _abort(); //@line 2206
      return 0; //@line 2206
     }
     $486 = $474 + 8 | 0; //@line 2209
     if ((HEAP32[$486 >> 2] | 0) == ($v_3_lcssa_i | 0)) {
      HEAP32[$482 >> 2] = $474; //@line 2213
      HEAP32[$486 >> 2] = $478; //@line 2214
      $R_1_i122 = $474; //@line 2215
      break;
     } else {
      _abort(); //@line 2218
      return 0; //@line 2218
     }
    }
   } while (0);
   L325 : do {
    if (($472 | 0) != 0) {
     $513 = $v_3_lcssa_i + 28 | 0; //@line 2227
     $515 = 1312 + (HEAP32[$513 >> 2] << 2) | 0; //@line 2229
     do {
      if (($v_3_lcssa_i | 0) == (HEAP32[$515 >> 2] | 0)) {
       HEAP32[$515 >> 2] = $R_1_i122; //@line 2234
       if (($R_1_i122 | 0) != 0) {
        break;
       }
       HEAP32[253] = HEAP32[253] & ~(1 << HEAP32[$513 >> 2]); //@line 2244
       break L325;
      } else {
       if ($472 >>> 0 < (HEAP32[256] | 0) >>> 0) {
        _abort(); //@line 2251
        return 0; //@line 2251
       }
       $529 = $472 + 16 | 0; //@line 2254
       if ((HEAP32[$529 >> 2] | 0) == ($v_3_lcssa_i | 0)) {
        HEAP32[$529 >> 2] = $R_1_i122; //@line 2258
       } else {
        HEAP32[$472 + 20 >> 2] = $R_1_i122; //@line 2261
       }
       if (($R_1_i122 | 0) == 0) {
        break L325;
       }
      }
     } while (0);
     if ($R_1_i122 >>> 0 < (HEAP32[256] | 0) >>> 0) {
      _abort(); //@line 2273
      return 0; //@line 2273
     }
     HEAP32[$R_1_i122 + 24 >> 2] = $472; //@line 2277
     $545 = HEAP32[$v_3_lcssa_i + 16 >> 2] | 0; //@line 2279
     do {
      if (($545 | 0) != 0) {
       if ($545 >>> 0 < (HEAP32[256] | 0) >>> 0) {
        _abort(); //@line 2287
        return 0; //@line 2287
       } else {
        HEAP32[$R_1_i122 + 16 >> 2] = $545; //@line 2291
        HEAP32[$545 + 24 >> 2] = $R_1_i122; //@line 2293
        break;
       }
      }
     } while (0);
     $557 = HEAP32[$v_3_lcssa_i + 20 >> 2] | 0; //@line 2299
     if (($557 | 0) == 0) {
      break;
     }
     if ($557 >>> 0 < (HEAP32[256] | 0) >>> 0) {
      _abort(); //@line 2308
      return 0; //@line 2308
     } else {
      HEAP32[$R_1_i122 + 20 >> 2] = $557; //@line 2312
      HEAP32[$557 + 24 >> 2] = $R_1_i122; //@line 2314
      break;
     }
    }
   } while (0);
   do {
    if ($rsize_3_lcssa_i >>> 0 < 16) {
     $571 = $rsize_3_lcssa_i + $349 | 0; //@line 2322
     HEAP32[$v_3_lcssa_i + 4 >> 2] = $571 | 3; //@line 2325
     $575 = $463 + ($571 + 4) | 0; //@line 2328
     HEAP32[$575 >> 2] = HEAP32[$575 >> 2] | 1; //@line 2331
    } else {
     HEAP32[$v_3_lcssa_i + 4 >> 2] = $349 | 3; //@line 2335
     HEAP32[$463 + ($349 | 4) >> 2] = $rsize_3_lcssa_i | 1; //@line 2340
     HEAP32[$463 + ($rsize_3_lcssa_i + $349) >> 2] = $rsize_3_lcssa_i; //@line 2344
     $586 = $rsize_3_lcssa_i >>> 3; //@line 2345
     if ($rsize_3_lcssa_i >>> 0 < 256) {
      $589 = $586 << 1; //@line 2348
      $591 = 1048 + ($589 << 2) | 0; //@line 2350
      $592 = HEAP32[252] | 0; //@line 2351
      $593 = 1 << $586; //@line 2352
      do {
       if (($592 & $593 | 0) == 0) {
        HEAP32[252] = $592 | $593; //@line 2358
        $F5_0_i = $591;
        $_pre_phi_i128 = 1048 + ($589 + 2 << 2) | 0;
       } else {
        $599 = 1048 + ($589 + 2 << 2) | 0; //@line 2364
        $600 = HEAP32[$599 >> 2] | 0; //@line 2365
        if ($600 >>> 0 >= (HEAP32[256] | 0) >>> 0) {
         $F5_0_i = $600;
         $_pre_phi_i128 = $599;
         break;
        }
        _abort(); //@line 2373
        return 0; //@line 2373
       }
      } while (0);
      HEAP32[$_pre_phi_i128 >> 2] = $468; //@line 2379
      HEAP32[$F5_0_i + 12 >> 2] = $468; //@line 2381
      HEAP32[$463 + ($349 + 8) >> 2] = $F5_0_i; //@line 2385
      HEAP32[$463 + ($349 + 12) >> 2] = $591; //@line 2389
      break;
     }
     $612 = $467; //@line 2392
     $613 = $rsize_3_lcssa_i >>> 8; //@line 2393
     do {
      if (($613 | 0) == 0) {
       $I7_0_i = 0; //@line 2397
      } else {
       if ($rsize_3_lcssa_i >>> 0 > 16777215) {
        $I7_0_i = 31; //@line 2401
        break;
       }
       $620 = ($613 + 1048320 | 0) >>> 16 & 8; //@line 2406
       $621 = $613 << $620; //@line 2407
       $624 = ($621 + 520192 | 0) >>> 16 & 4; //@line 2410
       $626 = $621 << $624; //@line 2412
       $629 = ($626 + 245760 | 0) >>> 16 & 2; //@line 2415
       $634 = 14 - ($624 | $620 | $629) + ($626 << $629 >>> 15) | 0; //@line 2420
       $I7_0_i = $rsize_3_lcssa_i >>> (($634 + 7 | 0) >>> 0) & 1 | $634 << 1; //@line 2426
      }
     } while (0);
     $641 = 1312 + ($I7_0_i << 2) | 0; //@line 2430
     HEAP32[$463 + ($349 + 28) >> 2] = $I7_0_i; //@line 2434
     HEAP32[$463 + ($349 + 20) >> 2] = 0; //@line 2440
     HEAP32[$463 + ($349 + 16) >> 2] = 0; //@line 2442
     $648 = HEAP32[253] | 0; //@line 2443
     $649 = 1 << $I7_0_i; //@line 2444
     if (($648 & $649 | 0) == 0) {
      HEAP32[253] = $648 | $649; //@line 2449
      HEAP32[$641 >> 2] = $612; //@line 2450
      HEAP32[$463 + ($349 + 24) >> 2] = $641; //@line 2455
      HEAP32[$463 + ($349 + 12) >> 2] = $612; //@line 2459
      HEAP32[$463 + ($349 + 8) >> 2] = $612; //@line 2463
      break;
     }
     if (($I7_0_i | 0) == 31) {
      $668 = 0; //@line 2469
     } else {
      $668 = 25 - ($I7_0_i >>> 1) | 0; //@line 2473
     }
     $K12_0_i = $rsize_3_lcssa_i << $668;
     $T_0_i = HEAP32[$641 >> 2] | 0;
     while (1) {
      if ((HEAP32[$T_0_i + 4 >> 2] & -8 | 0) == ($rsize_3_lcssa_i | 0)) {
       break;
      }
      $677 = $T_0_i + 16 + ($K12_0_i >>> 31 << 2) | 0; //@line 2489
      $678 = HEAP32[$677 >> 2] | 0; //@line 2490
      if (($678 | 0) == 0) {
       label = 256; //@line 2494
       break;
      } else {
       $K12_0_i = $K12_0_i << 1;
       $T_0_i = $678;
      }
     }
     if ((label | 0) == 256) {
      if ($677 >>> 0 < (HEAP32[256] | 0) >>> 0) {
       _abort(); //@line 2505
       return 0; //@line 2505
      } else {
       HEAP32[$677 >> 2] = $612; //@line 2508
       HEAP32[$463 + ($349 + 24) >> 2] = $T_0_i; //@line 2512
       HEAP32[$463 + ($349 + 12) >> 2] = $612; //@line 2516
       HEAP32[$463 + ($349 + 8) >> 2] = $612; //@line 2520
       break;
      }
     }
     $694 = $T_0_i + 8 | 0; //@line 2524
     $695 = HEAP32[$694 >> 2] | 0; //@line 2525
     $697 = HEAP32[256] | 0; //@line 2527
     if ($T_0_i >>> 0 < $697 >>> 0) {
      _abort(); //@line 2530
      return 0; //@line 2530
     }
     if ($695 >>> 0 < $697 >>> 0) {
      _abort(); //@line 2536
      return 0; //@line 2536
     } else {
      HEAP32[$695 + 12 >> 2] = $612; //@line 2540
      HEAP32[$694 >> 2] = $612; //@line 2541
      HEAP32[$463 + ($349 + 8) >> 2] = $695; //@line 2545
      HEAP32[$463 + ($349 + 12) >> 2] = $T_0_i; //@line 2549
      HEAP32[$463 + ($349 + 24) >> 2] = 0; //@line 2553
      break;
     }
    }
   } while (0);
   $711 = $v_3_lcssa_i + 8 | 0; //@line 2558
   if (($711 | 0) == 0) {
    $nb_0 = $349; //@line 2562
    break;
   } else {
    $mem_0 = $711; //@line 2565
   }
   return $mem_0 | 0; //@line 2569
  }
 } while (0);
 $714 = HEAP32[254] | 0; //@line 2573
 if ($nb_0 >>> 0 <= $714 >>> 0) {
  $717 = $714 - $nb_0 | 0; //@line 2576
  $718 = HEAP32[257] | 0; //@line 2577
  if ($717 >>> 0 > 15) {
   $721 = $718; //@line 2580
   HEAP32[257] = $721 + $nb_0; //@line 2583
   HEAP32[254] = $717; //@line 2584
   HEAP32[$721 + ($nb_0 + 4) >> 2] = $717 | 1; //@line 2589
   HEAP32[$721 + $714 >> 2] = $717; //@line 2592
   HEAP32[$718 + 4 >> 2] = $nb_0 | 3; //@line 2595
  } else {
   HEAP32[254] = 0; //@line 2597
   HEAP32[257] = 0; //@line 2598
   HEAP32[$718 + 4 >> 2] = $714 | 3; //@line 2601
   $736 = $718 + ($714 + 4) | 0; //@line 2605
   HEAP32[$736 >> 2] = HEAP32[$736 >> 2] | 1; //@line 2608
  }
  $mem_0 = $718 + 8 | 0; //@line 2612
  return $mem_0 | 0; //@line 2615
 }
 $743 = HEAP32[255] | 0; //@line 2617
 if ($nb_0 >>> 0 < $743 >>> 0) {
  $746 = $743 - $nb_0 | 0; //@line 2620
  HEAP32[255] = $746; //@line 2621
  $747 = HEAP32[258] | 0; //@line 2622
  $748 = $747; //@line 2623
  HEAP32[258] = $748 + $nb_0; //@line 2626
  HEAP32[$748 + ($nb_0 + 4) >> 2] = $746 | 1; //@line 2631
  HEAP32[$747 + 4 >> 2] = $nb_0 | 3; //@line 2634
  $mem_0 = $747 + 8 | 0; //@line 2637
  return $mem_0 | 0; //@line 2640
 }
 do {
  if ((HEAP32[244] | 0) == 0) {
   $762 = _sysconf(30) | 0; //@line 2646
   if (($762 - 1 & $762 | 0) == 0) {
    HEAP32[246] = $762; //@line 2651
    HEAP32[245] = $762; //@line 2652
    HEAP32[247] = -1; //@line 2653
    HEAP32[248] = -1; //@line 2654
    HEAP32[249] = 0; //@line 2655
    HEAP32[363] = 0; //@line 2656
    HEAP32[244] = (_time(0) | 0) & -16 ^ 1431655768; //@line 2660
    break;
   } else {
    _abort(); //@line 2663
    return 0; //@line 2663
   }
  }
 } while (0);
 $771 = $nb_0 + 48 | 0; //@line 2668
 $772 = HEAP32[246] | 0; //@line 2669
 $773 = $nb_0 + 47 | 0; //@line 2670
 $774 = $772 + $773 | 0; //@line 2671
 $775 = -$772 | 0; //@line 2672
 $776 = $774 & $775; //@line 2673
 if ($776 >>> 0 <= $nb_0 >>> 0) {
  $mem_0 = 0; //@line 2676
  return $mem_0 | 0; //@line 2679
 }
 $779 = HEAP32[362] | 0; //@line 2681
 do {
  if (($779 | 0) != 0) {
   $782 = HEAP32[360] | 0; //@line 2685
   $783 = $782 + $776 | 0; //@line 2686
   if ($783 >>> 0 <= $782 >>> 0 | $783 >>> 0 > $779 >>> 0) {
    $mem_0 = 0; //@line 2691
   } else {
    break;
   }
   return $mem_0 | 0; //@line 2697
  }
 } while (0);
 L417 : do {
  if ((HEAP32[363] & 4 | 0) == 0) {
   $791 = HEAP32[258] | 0; //@line 2705
   L419 : do {
    if (($791 | 0) == 0) {
     label = 286; //@line 2709
    } else {
     $794 = $791; //@line 2711
     $sp_0_i_i = 1456; //@line 2712
     while (1) {
      $796 = $sp_0_i_i | 0; //@line 2715
      $797 = HEAP32[$796 >> 2] | 0; //@line 2716
      if ($797 >>> 0 <= $794 >>> 0) {
       $800 = $sp_0_i_i + 4 | 0; //@line 2719
       if (($797 + (HEAP32[$800 >> 2] | 0) | 0) >>> 0 > $794 >>> 0) {
        break;
       }
      }
      $806 = HEAP32[$sp_0_i_i + 8 >> 2] | 0; //@line 2728
      if (($806 | 0) == 0) {
       label = 286; //@line 2731
       break L419;
      } else {
       $sp_0_i_i = $806; //@line 2734
      }
     }
     if (($sp_0_i_i | 0) == 0) {
      label = 286; //@line 2739
      break;
     }
     $840 = $774 - (HEAP32[255] | 0) & $775; //@line 2744
     if ($840 >>> 0 >= 2147483647) {
      $tsize_0303639_i = 0; //@line 2747
      break;
     }
     $843 = _sbrk($840 | 0) | 0; //@line 2750
     $847 = ($843 | 0) == ((HEAP32[$796 >> 2] | 0) + (HEAP32[$800 >> 2] | 0) | 0); //@line 2754
     $tbase_0_i = $847 ? $843 : -1;
     $tsize_0_i = $847 ? $840 : 0;
     $br_0_i = $843;
     $ssize_1_i = $840;
     label = 295; //@line 2758
    }
   } while (0);
   do {
    if ((label | 0) == 286) {
     $809 = _sbrk(0) | 0; //@line 2763
     if (($809 | 0) == -1) {
      $tsize_0303639_i = 0; //@line 2766
      break;
     }
     $812 = $809; //@line 2769
     $813 = HEAP32[245] | 0; //@line 2770
     $814 = $813 - 1 | 0; //@line 2771
     if (($814 & $812 | 0) == 0) {
      $ssize_0_i = $776; //@line 2775
     } else {
      $ssize_0_i = $776 - $812 + ($814 + $812 & -$813) | 0; //@line 2782
     }
     $824 = HEAP32[360] | 0; //@line 2785
     $825 = $824 + $ssize_0_i | 0; //@line 2786
     if (!($ssize_0_i >>> 0 > $nb_0 >>> 0 & $ssize_0_i >>> 0 < 2147483647)) {
      $tsize_0303639_i = 0; //@line 2791
      break;
     }
     $829 = HEAP32[362] | 0; //@line 2794
     if (($829 | 0) != 0) {
      if ($825 >>> 0 <= $824 >>> 0 | $825 >>> 0 > $829 >>> 0) {
       $tsize_0303639_i = 0; //@line 2801
       break;
      }
     }
     $835 = _sbrk($ssize_0_i | 0) | 0; //@line 2805
     $836 = ($835 | 0) == ($809 | 0); //@line 2806
     $tbase_0_i = $836 ? $809 : -1;
     $tsize_0_i = $836 ? $ssize_0_i : 0;
     $br_0_i = $835;
     $ssize_1_i = $ssize_0_i;
     label = 295; //@line 2810
    }
   } while (0);
   L439 : do {
    if ((label | 0) == 295) {
     $849 = -$ssize_1_i | 0; //@line 2819
     if (($tbase_0_i | 0) != -1) {
      $tsize_244_i = $tsize_0_i;
      $tbase_245_i = $tbase_0_i;
      label = 306; //@line 2823
      break L417;
     }
     do {
      if (($br_0_i | 0) != -1 & $ssize_1_i >>> 0 < 2147483647 & $ssize_1_i >>> 0 < $771 >>> 0) {
       $856 = HEAP32[246] | 0; //@line 2833
       $860 = $773 - $ssize_1_i + $856 & -$856; //@line 2837
       if ($860 >>> 0 >= 2147483647) {
        $ssize_2_i = $ssize_1_i; //@line 2840
        break;
       }
       if ((_sbrk($860 | 0) | 0) == -1) {
        _sbrk($849 | 0) | 0; //@line 2846
        $tsize_0303639_i = $tsize_0_i; //@line 2847
        break L439;
       } else {
        $ssize_2_i = $860 + $ssize_1_i | 0; //@line 2851
        break;
       }
      } else {
       $ssize_2_i = $ssize_1_i; //@line 2855
      }
     } while (0);
     if (($br_0_i | 0) == -1) {
      $tsize_0303639_i = $tsize_0_i; //@line 2861
     } else {
      $tsize_244_i = $ssize_2_i;
      $tbase_245_i = $br_0_i;
      label = 306; //@line 2864
      break L417;
     }
    }
   } while (0);
   HEAP32[363] = HEAP32[363] | 4; //@line 2872
   $tsize_1_i = $tsize_0303639_i; //@line 2873
   label = 303; //@line 2874
  } else {
   $tsize_1_i = 0; //@line 2876
   label = 303; //@line 2877
  }
 } while (0);
 do {
  if ((label | 0) == 303) {
   if ($776 >>> 0 >= 2147483647) {
    break;
   }
   $876 = _sbrk($776 | 0) | 0; //@line 2887
   $877 = _sbrk(0) | 0; //@line 2888
   if (!(($877 | 0) != -1 & ($876 | 0) != -1 & $876 >>> 0 < $877 >>> 0)) {
    break;
   }
   $881 = $877 - $876 | 0; //@line 2899
   $883 = $881 >>> 0 > ($nb_0 + 40 | 0) >>> 0; //@line 2901
   $_tbase_1_i = $883 ? $876 : -1; //@line 2903
   if (($_tbase_1_i | 0) != -1) {
    $tsize_244_i = $883 ? $881 : $tsize_1_i;
    $tbase_245_i = $_tbase_1_i;
    label = 306; //@line 2907
   }
  }
 } while (0);
 do {
  if ((label | 0) == 306) {
   $886 = (HEAP32[360] | 0) + $tsize_244_i | 0; //@line 2916
   HEAP32[360] = $886; //@line 2917
   if ($886 >>> 0 > (HEAP32[361] | 0) >>> 0) {
    HEAP32[361] = $886; //@line 2921
   }
   $890 = HEAP32[258] | 0; //@line 2923
   L459 : do {
    if (($890 | 0) == 0) {
     $893 = HEAP32[256] | 0; //@line 2927
     if (($893 | 0) == 0 | $tbase_245_i >>> 0 < $893 >>> 0) {
      HEAP32[256] = $tbase_245_i; //@line 2932
     }
     HEAP32[364] = $tbase_245_i; //@line 2934
     HEAP32[365] = $tsize_244_i; //@line 2935
     HEAP32[367] = 0; //@line 2936
     HEAP32[261] = HEAP32[244]; //@line 2938
     HEAP32[260] = -1; //@line 2939
     $i_02_i_i = 0; //@line 2940
     do {
      $899 = $i_02_i_i << 1; //@line 2943
      $901 = 1048 + ($899 << 2) | 0; //@line 2945
      HEAP32[1048 + ($899 + 3 << 2) >> 2] = $901; //@line 2948
      HEAP32[1048 + ($899 + 2 << 2) >> 2] = $901; //@line 2951
      $i_02_i_i = $i_02_i_i + 1 | 0; //@line 2952
     } while ($i_02_i_i >>> 0 < 32);
     $908 = $tbase_245_i + 8 | 0; //@line 2962
     if (($908 & 7 | 0) == 0) {
      $914 = 0; //@line 2966
     } else {
      $914 = -$908 & 7; //@line 2970
     }
     $917 = $tsize_244_i - 40 - $914 | 0; //@line 2975
     HEAP32[258] = $tbase_245_i + $914; //@line 2976
     HEAP32[255] = $917; //@line 2977
     HEAP32[$tbase_245_i + ($914 + 4) >> 2] = $917 | 1; //@line 2982
     HEAP32[$tbase_245_i + ($tsize_244_i - 36) >> 2] = 40; //@line 2986
     HEAP32[259] = HEAP32[248]; //@line 2988
    } else {
     $sp_067_i = 1456; //@line 2990
     while (1) {
      $925 = HEAP32[$sp_067_i >> 2] | 0; //@line 2994
      $926 = $sp_067_i + 4 | 0; //@line 2995
      $927 = HEAP32[$926 >> 2] | 0; //@line 2996
      if (($tbase_245_i | 0) == ($925 + $927 | 0)) {
       label = 318; //@line 3000
       break;
      }
      $932 = HEAP32[$sp_067_i + 8 >> 2] | 0; //@line 3004
      if (($932 | 0) == 0) {
       break;
      } else {
       $sp_067_i = $932; //@line 3009
      }
     }
     do {
      if ((label | 0) == 318) {
       if ((HEAP32[$sp_067_i + 12 >> 2] & 8 | 0) != 0) {
        break;
       }
       $939 = $890; //@line 3021
       if (!($939 >>> 0 >= $925 >>> 0 & $939 >>> 0 < $tbase_245_i >>> 0)) {
        break;
       }
       HEAP32[$926 >> 2] = $927 + $tsize_244_i; //@line 3029
       $944 = HEAP32[258] | 0; //@line 3030
       $946 = (HEAP32[255] | 0) + $tsize_244_i | 0; //@line 3032
       $947 = $944; //@line 3033
       $949 = $944 + 8 | 0; //@line 3035
       if (($949 & 7 | 0) == 0) {
        $955 = 0; //@line 3039
       } else {
        $955 = -$949 & 7; //@line 3043
       }
       $958 = $946 - $955 | 0; //@line 3048
       HEAP32[258] = $947 + $955; //@line 3049
       HEAP32[255] = $958; //@line 3050
       HEAP32[$947 + ($955 + 4) >> 2] = $958 | 1; //@line 3055
       HEAP32[$947 + ($946 + 4) >> 2] = 40; //@line 3059
       HEAP32[259] = HEAP32[248]; //@line 3061
       break L459;
      }
     } while (0);
     if ($tbase_245_i >>> 0 < (HEAP32[256] | 0) >>> 0) {
      HEAP32[256] = $tbase_245_i; //@line 3068
     }
     $968 = $tbase_245_i + $tsize_244_i | 0; //@line 3070
     $sp_160_i = 1456; //@line 3071
     while (1) {
      $970 = $sp_160_i | 0; //@line 3074
      if ((HEAP32[$970 >> 2] | 0) == ($968 | 0)) {
       label = 328; //@line 3078
       break;
      }
      $975 = HEAP32[$sp_160_i + 8 >> 2] | 0; //@line 3082
      if (($975 | 0) == 0) {
       break;
      } else {
       $sp_160_i = $975; //@line 3087
      }
     }
     do {
      if ((label | 0) == 328) {
       if ((HEAP32[$sp_160_i + 12 >> 2] & 8 | 0) != 0) {
        break;
       }
       HEAP32[$970 >> 2] = $tbase_245_i; //@line 3099
       $982 = $sp_160_i + 4 | 0; //@line 3100
       HEAP32[$982 >> 2] = (HEAP32[$982 >> 2] | 0) + $tsize_244_i; //@line 3103
       $986 = $tbase_245_i + 8 | 0; //@line 3105
       if (($986 & 7 | 0) == 0) {
        $993 = 0; //@line 3109
       } else {
        $993 = -$986 & 7; //@line 3113
       }
       $996 = $tbase_245_i + ($tsize_244_i + 8) | 0; //@line 3119
       if (($996 & 7 | 0) == 0) {
        $1003 = 0; //@line 3123
       } else {
        $1003 = -$996 & 7; //@line 3127
       }
       $1004 = $tbase_245_i + ($1003 + $tsize_244_i) | 0; //@line 3131
       $1005 = $1004; //@line 3132
       $_sum_i21_i = $993 + $nb_0 | 0; //@line 3136
       $1009 = $tbase_245_i + $_sum_i21_i | 0; //@line 3137
       $1010 = $1009; //@line 3138
       $1011 = $1004 - ($tbase_245_i + $993) - $nb_0 | 0; //@line 3139
       HEAP32[$tbase_245_i + ($993 + 4) >> 2] = $nb_0 | 3; //@line 3144
       do {
        if (($1005 | 0) == (HEAP32[258] | 0)) {
         $1019 = (HEAP32[255] | 0) + $1011 | 0; //@line 3150
         HEAP32[255] = $1019; //@line 3151
         HEAP32[258] = $1010; //@line 3152
         HEAP32[$tbase_245_i + ($_sum_i21_i + 4) >> 2] = $1019 | 1; //@line 3157
        } else {
         if (($1005 | 0) == (HEAP32[257] | 0)) {
          $1028 = (HEAP32[254] | 0) + $1011 | 0; //@line 3163
          HEAP32[254] = $1028; //@line 3164
          HEAP32[257] = $1010; //@line 3165
          HEAP32[$tbase_245_i + ($_sum_i21_i + 4) >> 2] = $1028 | 1; //@line 3170
          HEAP32[$tbase_245_i + ($1028 + $_sum_i21_i) >> 2] = $1028; //@line 3174
          break;
         }
         $_sum2_i23_i = $tsize_244_i + 4 | 0; //@line 3177
         $1037 = HEAP32[$tbase_245_i + ($_sum2_i23_i + $1003) >> 2] | 0; //@line 3181
         if (($1037 & 3 | 0) == 1) {
          $1041 = $1037 & -8; //@line 3185
          $1042 = $1037 >>> 3; //@line 3186
          L504 : do {
           if ($1037 >>> 0 < 256) {
            $1047 = HEAP32[$tbase_245_i + (($1003 | 8) + $tsize_244_i) >> 2] | 0; //@line 3194
            $1050 = HEAP32[$tbase_245_i + ($tsize_244_i + 12 + $1003) >> 2] | 0; //@line 3199
            $1053 = 1048 + ($1042 << 1 << 2) | 0; //@line 3202
            do {
             if (($1047 | 0) != ($1053 | 0)) {
              if ($1047 >>> 0 < (HEAP32[256] | 0) >>> 0) {
               _abort(); //@line 3210
               return 0; //@line 3210
              }
              if ((HEAP32[$1047 + 12 >> 2] | 0) == ($1005 | 0)) {
               break;
              }
              _abort(); //@line 3219
              return 0; //@line 3219
             }
            } while (0);
            if (($1050 | 0) == ($1047 | 0)) {
             HEAP32[252] = HEAP32[252] & ~(1 << $1042); //@line 3229
             break;
            }
            do {
             if (($1050 | 0) == ($1053 | 0)) {
              $_pre_phi57_i_i = $1050 + 8 | 0; //@line 3236
             } else {
              if ($1050 >>> 0 < (HEAP32[256] | 0) >>> 0) {
               _abort(); //@line 3242
               return 0; //@line 3242
              }
              $1076 = $1050 + 8 | 0; //@line 3245
              if ((HEAP32[$1076 >> 2] | 0) == ($1005 | 0)) {
               $_pre_phi57_i_i = $1076; //@line 3249
               break;
              }
              _abort(); //@line 3252
              return 0; //@line 3252
             }
            } while (0);
            HEAP32[$1047 + 12 >> 2] = $1050; //@line 3258
            HEAP32[$_pre_phi57_i_i >> 2] = $1047; //@line 3259
           } else {
            $1081 = $1004; //@line 3261
            $1084 = HEAP32[$tbase_245_i + (($1003 | 24) + $tsize_244_i) >> 2] | 0; //@line 3266
            $1087 = HEAP32[$tbase_245_i + ($tsize_244_i + 12 + $1003) >> 2] | 0; //@line 3271
            do {
             if (($1087 | 0) == ($1081 | 0)) {
              $_sum67_i_i = $1003 | 16; //@line 3275
              $1107 = $tbase_245_i + ($_sum2_i23_i + $_sum67_i_i) | 0; //@line 3278
              $1108 = HEAP32[$1107 >> 2] | 0; //@line 3279
              if (($1108 | 0) == 0) {
               $1112 = $tbase_245_i + ($_sum67_i_i + $tsize_244_i) | 0; //@line 3284
               $1113 = HEAP32[$1112 >> 2] | 0; //@line 3285
               if (($1113 | 0) == 0) {
                $R_1_i_i = 0; //@line 3288
                break;
               } else {
                $R_0_i_i = $1113;
                $RP_0_i_i = $1112;
               }
              } else {
               $R_0_i_i = $1108;
               $RP_0_i_i = $1107;
              }
              while (1) {
               $1115 = $R_0_i_i + 20 | 0; //@line 3299
               $1116 = HEAP32[$1115 >> 2] | 0; //@line 3300
               if (($1116 | 0) != 0) {
                $R_0_i_i = $1116;
                $RP_0_i_i = $1115;
                continue;
               }
               $1119 = $R_0_i_i + 16 | 0; //@line 3306
               $1120 = HEAP32[$1119 >> 2] | 0; //@line 3307
               if (($1120 | 0) == 0) {
                break;
               } else {
                $R_0_i_i = $1120;
                $RP_0_i_i = $1119;
               }
              }
              if ($RP_0_i_i >>> 0 < (HEAP32[256] | 0) >>> 0) {
               _abort(); //@line 3319
               return 0; //@line 3319
              } else {
               HEAP32[$RP_0_i_i >> 2] = 0; //@line 3322
               $R_1_i_i = $R_0_i_i; //@line 3323
               break;
              }
             } else {
              $1092 = HEAP32[$tbase_245_i + (($1003 | 8) + $tsize_244_i) >> 2] | 0; //@line 3331
              if ($1092 >>> 0 < (HEAP32[256] | 0) >>> 0) {
               _abort(); //@line 3336
               return 0; //@line 3336
              }
              $1097 = $1092 + 12 | 0; //@line 3339
              if ((HEAP32[$1097 >> 2] | 0) != ($1081 | 0)) {
               _abort(); //@line 3343
               return 0; //@line 3343
              }
              $1101 = $1087 + 8 | 0; //@line 3346
              if ((HEAP32[$1101 >> 2] | 0) == ($1081 | 0)) {
               HEAP32[$1097 >> 2] = $1087; //@line 3350
               HEAP32[$1101 >> 2] = $1092; //@line 3351
               $R_1_i_i = $1087; //@line 3352
               break;
              } else {
               _abort(); //@line 3355
               return 0; //@line 3355
              }
             }
            } while (0);
            if (($1084 | 0) == 0) {
             break;
            }
            $1132 = $tbase_245_i + ($tsize_244_i + 28 + $1003) | 0; //@line 3368
            $1134 = 1312 + (HEAP32[$1132 >> 2] << 2) | 0; //@line 3370
            do {
             if (($1081 | 0) == (HEAP32[$1134 >> 2] | 0)) {
              HEAP32[$1134 >> 2] = $R_1_i_i; //@line 3375
              if (($R_1_i_i | 0) != 0) {
               break;
              }
              HEAP32[253] = HEAP32[253] & ~(1 << HEAP32[$1132 >> 2]); //@line 3385
              break L504;
             } else {
              if ($1084 >>> 0 < (HEAP32[256] | 0) >>> 0) {
               _abort(); //@line 3392
               return 0; //@line 3392
              }
              $1148 = $1084 + 16 | 0; //@line 3395
              if ((HEAP32[$1148 >> 2] | 0) == ($1081 | 0)) {
               HEAP32[$1148 >> 2] = $R_1_i_i; //@line 3399
              } else {
               HEAP32[$1084 + 20 >> 2] = $R_1_i_i; //@line 3402
              }
              if (($R_1_i_i | 0) == 0) {
               break L504;
              }
             }
            } while (0);
            if ($R_1_i_i >>> 0 < (HEAP32[256] | 0) >>> 0) {
             _abort(); //@line 3414
             return 0; //@line 3414
            }
            HEAP32[$R_1_i_i + 24 >> 2] = $1084; //@line 3418
            $_sum3233_i_i = $1003 | 16; //@line 3419
            $1165 = HEAP32[$tbase_245_i + ($_sum3233_i_i + $tsize_244_i) >> 2] | 0; //@line 3423
            do {
             if (($1165 | 0) != 0) {
              if ($1165 >>> 0 < (HEAP32[256] | 0) >>> 0) {
               _abort(); //@line 3431
               return 0; //@line 3431
              } else {
               HEAP32[$R_1_i_i + 16 >> 2] = $1165; //@line 3435
               HEAP32[$1165 + 24 >> 2] = $R_1_i_i; //@line 3437
               break;
              }
             }
            } while (0);
            $1178 = HEAP32[$tbase_245_i + ($_sum2_i23_i + $_sum3233_i_i) >> 2] | 0; //@line 3445
            if (($1178 | 0) == 0) {
             break;
            }
            if ($1178 >>> 0 < (HEAP32[256] | 0) >>> 0) {
             _abort(); //@line 3454
             return 0; //@line 3454
            } else {
             HEAP32[$R_1_i_i + 20 >> 2] = $1178; //@line 3458
             HEAP32[$1178 + 24 >> 2] = $R_1_i_i; //@line 3460
             break;
            }
           }
          } while (0);
          $oldfirst_0_i_i = $tbase_245_i + (($1041 | $1003) + $tsize_244_i) | 0;
          $qsize_0_i_i = $1041 + $1011 | 0;
         } else {
          $oldfirst_0_i_i = $1005;
          $qsize_0_i_i = $1011;
         }
         $1194 = $oldfirst_0_i_i + 4 | 0; //@line 3476
         HEAP32[$1194 >> 2] = HEAP32[$1194 >> 2] & -2; //@line 3479
         HEAP32[$tbase_245_i + ($_sum_i21_i + 4) >> 2] = $qsize_0_i_i | 1; //@line 3484
         HEAP32[$tbase_245_i + ($qsize_0_i_i + $_sum_i21_i) >> 2] = $qsize_0_i_i; //@line 3488
         $1202 = $qsize_0_i_i >>> 3; //@line 3489
         if ($qsize_0_i_i >>> 0 < 256) {
          $1205 = $1202 << 1; //@line 3492
          $1207 = 1048 + ($1205 << 2) | 0; //@line 3494
          $1208 = HEAP32[252] | 0; //@line 3495
          $1209 = 1 << $1202; //@line 3496
          do {
           if (($1208 & $1209 | 0) == 0) {
            HEAP32[252] = $1208 | $1209; //@line 3502
            $F4_0_i_i = $1207;
            $_pre_phi_i25_i = 1048 + ($1205 + 2 << 2) | 0;
           } else {
            $1215 = 1048 + ($1205 + 2 << 2) | 0; //@line 3508
            $1216 = HEAP32[$1215 >> 2] | 0; //@line 3509
            if ($1216 >>> 0 >= (HEAP32[256] | 0) >>> 0) {
             $F4_0_i_i = $1216;
             $_pre_phi_i25_i = $1215;
             break;
            }
            _abort(); //@line 3517
            return 0; //@line 3517
           }
          } while (0);
          HEAP32[$_pre_phi_i25_i >> 2] = $1010; //@line 3523
          HEAP32[$F4_0_i_i + 12 >> 2] = $1010; //@line 3525
          HEAP32[$tbase_245_i + ($_sum_i21_i + 8) >> 2] = $F4_0_i_i; //@line 3529
          HEAP32[$tbase_245_i + ($_sum_i21_i + 12) >> 2] = $1207; //@line 3533
          break;
         }
         $1228 = $1009; //@line 3536
         $1229 = $qsize_0_i_i >>> 8; //@line 3537
         do {
          if (($1229 | 0) == 0) {
           $I7_0_i_i = 0; //@line 3541
          } else {
           if ($qsize_0_i_i >>> 0 > 16777215) {
            $I7_0_i_i = 31; //@line 3545
            break;
           }
           $1236 = ($1229 + 1048320 | 0) >>> 16 & 8; //@line 3550
           $1237 = $1229 << $1236; //@line 3551
           $1240 = ($1237 + 520192 | 0) >>> 16 & 4; //@line 3554
           $1242 = $1237 << $1240; //@line 3556
           $1245 = ($1242 + 245760 | 0) >>> 16 & 2; //@line 3559
           $1250 = 14 - ($1240 | $1236 | $1245) + ($1242 << $1245 >>> 15) | 0; //@line 3564
           $I7_0_i_i = $qsize_0_i_i >>> (($1250 + 7 | 0) >>> 0) & 1 | $1250 << 1; //@line 3570
          }
         } while (0);
         $1257 = 1312 + ($I7_0_i_i << 2) | 0; //@line 3574
         HEAP32[$tbase_245_i + ($_sum_i21_i + 28) >> 2] = $I7_0_i_i; //@line 3578
         HEAP32[$tbase_245_i + ($_sum_i21_i + 20) >> 2] = 0; //@line 3584
         HEAP32[$tbase_245_i + ($_sum_i21_i + 16) >> 2] = 0; //@line 3586
         $1264 = HEAP32[253] | 0; //@line 3587
         $1265 = 1 << $I7_0_i_i; //@line 3588
         if (($1264 & $1265 | 0) == 0) {
          HEAP32[253] = $1264 | $1265; //@line 3593
          HEAP32[$1257 >> 2] = $1228; //@line 3594
          HEAP32[$tbase_245_i + ($_sum_i21_i + 24) >> 2] = $1257; //@line 3599
          HEAP32[$tbase_245_i + ($_sum_i21_i + 12) >> 2] = $1228; //@line 3603
          HEAP32[$tbase_245_i + ($_sum_i21_i + 8) >> 2] = $1228; //@line 3607
          break;
         }
         if (($I7_0_i_i | 0) == 31) {
          $1284 = 0; //@line 3613
         } else {
          $1284 = 25 - ($I7_0_i_i >>> 1) | 0; //@line 3617
         }
         $K8_0_i_i = $qsize_0_i_i << $1284;
         $T_0_i27_i = HEAP32[$1257 >> 2] | 0;
         while (1) {
          if ((HEAP32[$T_0_i27_i + 4 >> 2] & -8 | 0) == ($qsize_0_i_i | 0)) {
           break;
          }
          $1293 = $T_0_i27_i + 16 + ($K8_0_i_i >>> 31 << 2) | 0; //@line 3633
          $1294 = HEAP32[$1293 >> 2] | 0; //@line 3634
          if (($1294 | 0) == 0) {
           label = 401; //@line 3638
           break;
          } else {
           $K8_0_i_i = $K8_0_i_i << 1;
           $T_0_i27_i = $1294;
          }
         }
         if ((label | 0) == 401) {
          if ($1293 >>> 0 < (HEAP32[256] | 0) >>> 0) {
           _abort(); //@line 3649
           return 0; //@line 3649
          } else {
           HEAP32[$1293 >> 2] = $1228; //@line 3652
           HEAP32[$tbase_245_i + ($_sum_i21_i + 24) >> 2] = $T_0_i27_i; //@line 3656
           HEAP32[$tbase_245_i + ($_sum_i21_i + 12) >> 2] = $1228; //@line 3660
           HEAP32[$tbase_245_i + ($_sum_i21_i + 8) >> 2] = $1228; //@line 3664
           break;
          }
         }
         $1310 = $T_0_i27_i + 8 | 0; //@line 3668
         $1311 = HEAP32[$1310 >> 2] | 0; //@line 3669
         $1313 = HEAP32[256] | 0; //@line 3671
         if ($T_0_i27_i >>> 0 < $1313 >>> 0) {
          _abort(); //@line 3674
          return 0; //@line 3674
         }
         if ($1311 >>> 0 < $1313 >>> 0) {
          _abort(); //@line 3680
          return 0; //@line 3680
         } else {
          HEAP32[$1311 + 12 >> 2] = $1228; //@line 3684
          HEAP32[$1310 >> 2] = $1228; //@line 3685
          HEAP32[$tbase_245_i + ($_sum_i21_i + 8) >> 2] = $1311; //@line 3689
          HEAP32[$tbase_245_i + ($_sum_i21_i + 12) >> 2] = $T_0_i27_i; //@line 3693
          HEAP32[$tbase_245_i + ($_sum_i21_i + 24) >> 2] = 0; //@line 3697
          break;
         }
        }
       } while (0);
       $mem_0 = $tbase_245_i + ($993 | 8) | 0; //@line 3704
       return $mem_0 | 0; //@line 3707
      }
     } while (0);
     $1327 = $890; //@line 3710
     $sp_0_i_i_i = 1456; //@line 3711
     while (1) {
      $1330 = HEAP32[$sp_0_i_i_i >> 2] | 0; //@line 3715
      if ($1330 >>> 0 <= $1327 >>> 0) {
       $1334 = HEAP32[$sp_0_i_i_i + 4 >> 2] | 0; //@line 3719
       $1335 = $1330 + $1334 | 0; //@line 3720
       if ($1335 >>> 0 > $1327 >>> 0) {
        break;
       }
      }
      $sp_0_i_i_i = HEAP32[$sp_0_i_i_i + 8 >> 2] | 0; //@line 3728
     }
     $1341 = $1330 + ($1334 - 39) | 0; //@line 3733
     if (($1341 & 7 | 0) == 0) {
      $1348 = 0; //@line 3737
     } else {
      $1348 = -$1341 & 7; //@line 3741
     }
     $1349 = $1330 + ($1334 - 47 + $1348) | 0; //@line 3745
     $1353 = $1349 >>> 0 < ($890 + 16 | 0) >>> 0 ? $1327 : $1349; //@line 3749
     $1354 = $1353 + 8 | 0; //@line 3750
     $1358 = $tbase_245_i + 8 | 0; //@line 3754
     if (($1358 & 7 | 0) == 0) {
      $1364 = 0; //@line 3758
     } else {
      $1364 = -$1358 & 7; //@line 3762
     }
     $1367 = $tsize_244_i - 40 - $1364 | 0; //@line 3767
     HEAP32[258] = $tbase_245_i + $1364; //@line 3768
     HEAP32[255] = $1367; //@line 3769
     HEAP32[$tbase_245_i + ($1364 + 4) >> 2] = $1367 | 1; //@line 3774
     HEAP32[$tbase_245_i + ($tsize_244_i - 36) >> 2] = 40; //@line 3778
     HEAP32[259] = HEAP32[248]; //@line 3780
     HEAP32[$1353 + 4 >> 2] = 27; //@line 3783
     HEAP32[$1354 >> 2] = HEAP32[364]; //@line 3784
     HEAP32[$1354 + 4 >> 2] = HEAP32[1460 >> 2]; //@line 3784
     HEAP32[$1354 + 8 >> 2] = HEAP32[1464 >> 2]; //@line 3784
     HEAP32[$1354 + 12 >> 2] = HEAP32[1468 >> 2]; //@line 3784
     HEAP32[364] = $tbase_245_i; //@line 3785
     HEAP32[365] = $tsize_244_i; //@line 3786
     HEAP32[367] = 0; //@line 3787
     HEAP32[366] = $1354; //@line 3788
     $1377 = $1353 + 28 | 0; //@line 3790
     HEAP32[$1377 >> 2] = 7; //@line 3791
     if (($1353 + 32 | 0) >>> 0 < $1335 >>> 0) {
      $1380 = $1377; //@line 3795
      while (1) {
       $1381 = $1380 + 4 | 0; //@line 3798
       HEAP32[$1381 >> 2] = 7; //@line 3799
       if (($1380 + 8 | 0) >>> 0 < $1335 >>> 0) {
        $1380 = $1381; //@line 3804
       } else {
        break;
       }
      }
     }
     if (($1353 | 0) == ($1327 | 0)) {
      break;
     }
     $1389 = $1353 - $890 | 0; //@line 3816
     $1392 = $1327 + ($1389 + 4) | 0; //@line 3820
     HEAP32[$1392 >> 2] = HEAP32[$1392 >> 2] & -2; //@line 3823
     HEAP32[$890 + 4 >> 2] = $1389 | 1; //@line 3826
     HEAP32[$1327 + $1389 >> 2] = $1389; //@line 3828
     $1398 = $1389 >>> 3; //@line 3829
     if ($1389 >>> 0 < 256) {
      $1401 = $1398 << 1; //@line 3832
      $1403 = 1048 + ($1401 << 2) | 0; //@line 3834
      $1404 = HEAP32[252] | 0; //@line 3835
      $1405 = 1 << $1398; //@line 3836
      do {
       if (($1404 & $1405 | 0) == 0) {
        HEAP32[252] = $1404 | $1405; //@line 3842
        $F_0_i_i = $1403;
        $_pre_phi_i_i = 1048 + ($1401 + 2 << 2) | 0;
       } else {
        $1411 = 1048 + ($1401 + 2 << 2) | 0; //@line 3848
        $1412 = HEAP32[$1411 >> 2] | 0; //@line 3849
        if ($1412 >>> 0 >= (HEAP32[256] | 0) >>> 0) {
         $F_0_i_i = $1412;
         $_pre_phi_i_i = $1411;
         break;
        }
        _abort(); //@line 3857
        return 0; //@line 3857
       }
      } while (0);
      HEAP32[$_pre_phi_i_i >> 2] = $890; //@line 3863
      HEAP32[$F_0_i_i + 12 >> 2] = $890; //@line 3865
      HEAP32[$890 + 8 >> 2] = $F_0_i_i; //@line 3867
      HEAP32[$890 + 12 >> 2] = $1403; //@line 3869
      break;
     }
     $1422 = $890; //@line 3872
     $1423 = $1389 >>> 8; //@line 3873
     do {
      if (($1423 | 0) == 0) {
       $I1_0_i_i = 0; //@line 3877
      } else {
       if ($1389 >>> 0 > 16777215) {
        $I1_0_i_i = 31; //@line 3881
        break;
       }
       $1430 = ($1423 + 1048320 | 0) >>> 16 & 8; //@line 3886
       $1431 = $1423 << $1430; //@line 3887
       $1434 = ($1431 + 520192 | 0) >>> 16 & 4; //@line 3890
       $1436 = $1431 << $1434; //@line 3892
       $1439 = ($1436 + 245760 | 0) >>> 16 & 2; //@line 3895
       $1444 = 14 - ($1434 | $1430 | $1439) + ($1436 << $1439 >>> 15) | 0; //@line 3900
       $I1_0_i_i = $1389 >>> (($1444 + 7 | 0) >>> 0) & 1 | $1444 << 1; //@line 3906
      }
     } while (0);
     $1451 = 1312 + ($I1_0_i_i << 2) | 0; //@line 3910
     HEAP32[$890 + 28 >> 2] = $I1_0_i_i; //@line 3913
     HEAP32[$890 + 20 >> 2] = 0; //@line 3915
     HEAP32[$890 + 16 >> 2] = 0; //@line 3917
     $1455 = HEAP32[253] | 0; //@line 3918
     $1456 = 1 << $I1_0_i_i; //@line 3919
     if (($1455 & $1456 | 0) == 0) {
      HEAP32[253] = $1455 | $1456; //@line 3924
      HEAP32[$1451 >> 2] = $1422; //@line 3925
      HEAP32[$890 + 24 >> 2] = $1451; //@line 3928
      HEAP32[$890 + 12 >> 2] = $890; //@line 3930
      HEAP32[$890 + 8 >> 2] = $890; //@line 3932
      break;
     }
     if (($I1_0_i_i | 0) == 31) {
      $1471 = 0; //@line 3938
     } else {
      $1471 = 25 - ($I1_0_i_i >>> 1) | 0; //@line 3942
     }
     $K2_0_i_i = $1389 << $1471;
     $T_0_i_i = HEAP32[$1451 >> 2] | 0;
     while (1) {
      if ((HEAP32[$T_0_i_i + 4 >> 2] & -8 | 0) == ($1389 | 0)) {
       break;
      }
      $1480 = $T_0_i_i + 16 + ($K2_0_i_i >>> 31 << 2) | 0; //@line 3958
      $1481 = HEAP32[$1480 >> 2] | 0; //@line 3959
      if (($1481 | 0) == 0) {
       label = 436; //@line 3963
       break;
      } else {
       $K2_0_i_i = $K2_0_i_i << 1;
       $T_0_i_i = $1481;
      }
     }
     if ((label | 0) == 436) {
      if ($1480 >>> 0 < (HEAP32[256] | 0) >>> 0) {
       _abort(); //@line 3974
       return 0; //@line 3974
      } else {
       HEAP32[$1480 >> 2] = $1422; //@line 3977
       HEAP32[$890 + 24 >> 2] = $T_0_i_i; //@line 3980
       HEAP32[$890 + 12 >> 2] = $890; //@line 3982
       HEAP32[$890 + 8 >> 2] = $890; //@line 3984
       break;
      }
     }
     $1494 = $T_0_i_i + 8 | 0; //@line 3988
     $1495 = HEAP32[$1494 >> 2] | 0; //@line 3989
     $1497 = HEAP32[256] | 0; //@line 3991
     if ($T_0_i_i >>> 0 < $1497 >>> 0) {
      _abort(); //@line 3994
      return 0; //@line 3994
     }
     if ($1495 >>> 0 < $1497 >>> 0) {
      _abort(); //@line 4000
      return 0; //@line 4000
     } else {
      HEAP32[$1495 + 12 >> 2] = $1422; //@line 4004
      HEAP32[$1494 >> 2] = $1422; //@line 4005
      HEAP32[$890 + 8 >> 2] = $1495; //@line 4008
      HEAP32[$890 + 12 >> 2] = $T_0_i_i; //@line 4011
      HEAP32[$890 + 24 >> 2] = 0; //@line 4013
      break;
     }
    }
   } while (0);
   $1507 = HEAP32[255] | 0; //@line 4018
   if ($1507 >>> 0 <= $nb_0 >>> 0) {
    break;
   }
   $1510 = $1507 - $nb_0 | 0; //@line 4023
   HEAP32[255] = $1510; //@line 4024
   $1511 = HEAP32[258] | 0; //@line 4025
   $1512 = $1511; //@line 4026
   HEAP32[258] = $1512 + $nb_0; //@line 4029
   HEAP32[$1512 + ($nb_0 + 4) >> 2] = $1510 | 1; //@line 4034
   HEAP32[$1511 + 4 >> 2] = $nb_0 | 3; //@line 4037
   $mem_0 = $1511 + 8 | 0; //@line 4040
   return $mem_0 | 0; //@line 4043
  }
 } while (0);
 HEAP32[(___errno_location() | 0) >> 2] = 12; //@line 4047
 $mem_0 = 0; //@line 4048
 return $mem_0 | 0; //@line 4051
}
function _free($mem) {
 $mem = $mem | 0;
 var $3 = 0, $4 = 0, $5 = 0, $10 = 0, $11 = 0, $14 = 0, $15 = 0, $16 = 0, $21 = 0, $_sum232 = 0, $24 = 0, $25 = 0, $26 = 0, $32 = 0, $37 = 0, $40 = 0, $43 = 0, $64 = 0, $_pre_phi306 = 0, $69 = 0, $72 = 0, $75 = 0, $80 = 0, $84 = 0, $88 = 0, $94 = 0, $95 = 0, $99 = 0, $100 = 0, $RP_0 = 0, $R_0 = 0, $102 = 0, $103 = 0, $106 = 0, $107 = 0, $R_1 = 0, $118 = 0, $120 = 0, $134 = 0, $151 = 0, $164 = 0, $177 = 0, $psize_0 = 0, $p_0 = 0, $189 = 0, $193 = 0, $194 = 0, $204 = 0, $215 = 0, $222 = 0, $223 = 0, $228 = 0, $231 = 0, $234 = 0, $257 = 0, $_pre_phi304 = 0, $262 = 0, $265 = 0, $268 = 0, $273 = 0, $278 = 0, $282 = 0, $288 = 0, $289 = 0, $293 = 0, $294 = 0, $RP9_0 = 0, $R7_0 = 0, $296 = 0, $297 = 0, $300 = 0, $301 = 0, $R7_1 = 0, $313 = 0, $315 = 0, $329 = 0, $346 = 0, $359 = 0, $psize_1 = 0, $385 = 0, $388 = 0, $390 = 0, $391 = 0, $392 = 0, $398 = 0, $399 = 0, $_pre_phi = 0, $F16_0 = 0, $409 = 0, $410 = 0, $417 = 0, $418 = 0, $421 = 0, $423 = 0, $426 = 0, $431 = 0, $I18_0 = 0, $438 = 0, $442 = 0, $443 = 0, $458 = 0, $T_0 = 0, $K19_0 = 0, $467 = 0, $468 = 0, $481 = 0, $482 = 0, $484 = 0, $496 = 0, $sp_0_in_i = 0, $sp_0_i = 0, label = 0;
 if (($mem | 0) == 0) {
  return;
 }
 $3 = $mem - 8 | 0; //@line 4119
 $4 = $3; //@line 4120
 $5 = HEAP32[256] | 0; //@line 4121
 if ($3 >>> 0 < $5 >>> 0) {
  _abort(); //@line 4124
 }
 $10 = HEAP32[$mem - 4 >> 2] | 0; //@line 4129
 $11 = $10 & 3; //@line 4130
 if (($11 | 0) == 1) {
  _abort(); //@line 4133
 }
 $14 = $10 & -8; //@line 4136
 $15 = $mem + ($14 - 8) | 0; //@line 4138
 $16 = $15; //@line 4139
 L676 : do {
  if (($10 & 1 | 0) == 0) {
   $21 = HEAP32[$3 >> 2] | 0; //@line 4145
   if (($11 | 0) == 0) {
    return;
   }
   $_sum232 = -8 - $21 | 0; //@line 4151
   $24 = $mem + $_sum232 | 0; //@line 4152
   $25 = $24; //@line 4153
   $26 = $21 + $14 | 0; //@line 4154
   if ($24 >>> 0 < $5 >>> 0) {
    _abort(); //@line 4157
   }
   if (($25 | 0) == (HEAP32[257] | 0)) {
    $177 = $mem + ($14 - 4) | 0; //@line 4165
    if ((HEAP32[$177 >> 2] & 3 | 0) != 3) {
     $p_0 = $25;
     $psize_0 = $26;
     break;
    }
    HEAP32[254] = $26; //@line 4173
    HEAP32[$177 >> 2] = HEAP32[$177 >> 2] & -2; //@line 4176
    HEAP32[$mem + ($_sum232 + 4) >> 2] = $26 | 1; //@line 4181
    HEAP32[$15 >> 2] = $26; //@line 4183
    return;
   }
   $32 = $21 >>> 3; //@line 4187
   if ($21 >>> 0 < 256) {
    $37 = HEAP32[$mem + ($_sum232 + 8) >> 2] | 0; //@line 4193
    $40 = HEAP32[$mem + ($_sum232 + 12) >> 2] | 0; //@line 4197
    $43 = 1048 + ($32 << 1 << 2) | 0; //@line 4200
    do {
     if (($37 | 0) != ($43 | 0)) {
      if ($37 >>> 0 < $5 >>> 0) {
       _abort(); //@line 4207
      }
      if ((HEAP32[$37 + 12 >> 2] | 0) == ($25 | 0)) {
       break;
      }
      _abort(); //@line 4216
     }
    } while (0);
    if (($40 | 0) == ($37 | 0)) {
     HEAP32[252] = HEAP32[252] & ~(1 << $32); //@line 4226
     $p_0 = $25;
     $psize_0 = $26;
     break;
    }
    do {
     if (($40 | 0) == ($43 | 0)) {
      $_pre_phi306 = $40 + 8 | 0; //@line 4234
     } else {
      if ($40 >>> 0 < $5 >>> 0) {
       _abort(); //@line 4239
      }
      $64 = $40 + 8 | 0; //@line 4242
      if ((HEAP32[$64 >> 2] | 0) == ($25 | 0)) {
       $_pre_phi306 = $64; //@line 4246
       break;
      }
      _abort(); //@line 4249
     }
    } while (0);
    HEAP32[$37 + 12 >> 2] = $40; //@line 4255
    HEAP32[$_pre_phi306 >> 2] = $37; //@line 4256
    $p_0 = $25;
    $psize_0 = $26;
    break;
   }
   $69 = $24; //@line 4260
   $72 = HEAP32[$mem + ($_sum232 + 24) >> 2] | 0; //@line 4264
   $75 = HEAP32[$mem + ($_sum232 + 12) >> 2] | 0; //@line 4268
   do {
    if (($75 | 0) == ($69 | 0)) {
     $94 = $mem + ($_sum232 + 20) | 0; //@line 4274
     $95 = HEAP32[$94 >> 2] | 0; //@line 4275
     if (($95 | 0) == 0) {
      $99 = $mem + ($_sum232 + 16) | 0; //@line 4280
      $100 = HEAP32[$99 >> 2] | 0; //@line 4281
      if (($100 | 0) == 0) {
       $R_1 = 0; //@line 4284
       break;
      } else {
       $R_0 = $100;
       $RP_0 = $99;
      }
     } else {
      $R_0 = $95;
      $RP_0 = $94;
     }
     while (1) {
      $102 = $R_0 + 20 | 0; //@line 4295
      $103 = HEAP32[$102 >> 2] | 0; //@line 4296
      if (($103 | 0) != 0) {
       $R_0 = $103;
       $RP_0 = $102;
       continue;
      }
      $106 = $R_0 + 16 | 0; //@line 4302
      $107 = HEAP32[$106 >> 2] | 0; //@line 4303
      if (($107 | 0) == 0) {
       break;
      } else {
       $R_0 = $107;
       $RP_0 = $106;
      }
     }
     if ($RP_0 >>> 0 < $5 >>> 0) {
      _abort(); //@line 4314
     } else {
      HEAP32[$RP_0 >> 2] = 0; //@line 4317
      $R_1 = $R_0; //@line 4318
      break;
     }
    } else {
     $80 = HEAP32[$mem + ($_sum232 + 8) >> 2] | 0; //@line 4325
     if ($80 >>> 0 < $5 >>> 0) {
      _abort(); //@line 4329
     }
     $84 = $80 + 12 | 0; //@line 4332
     if ((HEAP32[$84 >> 2] | 0) != ($69 | 0)) {
      _abort(); //@line 4336
     }
     $88 = $75 + 8 | 0; //@line 4339
     if ((HEAP32[$88 >> 2] | 0) == ($69 | 0)) {
      HEAP32[$84 >> 2] = $75; //@line 4343
      HEAP32[$88 >> 2] = $80; //@line 4344
      $R_1 = $75; //@line 4345
      break;
     } else {
      _abort(); //@line 4348
     }
    }
   } while (0);
   if (($72 | 0) == 0) {
    $p_0 = $25;
    $psize_0 = $26;
    break;
   }
   $118 = $mem + ($_sum232 + 28) | 0; //@line 4361
   $120 = 1312 + (HEAP32[$118 >> 2] << 2) | 0; //@line 4363
   do {
    if (($69 | 0) == (HEAP32[$120 >> 2] | 0)) {
     HEAP32[$120 >> 2] = $R_1; //@line 4368
     if (($R_1 | 0) != 0) {
      break;
     }
     HEAP32[253] = HEAP32[253] & ~(1 << HEAP32[$118 >> 2]); //@line 4378
     $p_0 = $25;
     $psize_0 = $26;
     break L676;
    } else {
     if ($72 >>> 0 < (HEAP32[256] | 0) >>> 0) {
      _abort(); //@line 4386
     }
     $134 = $72 + 16 | 0; //@line 4389
     if ((HEAP32[$134 >> 2] | 0) == ($69 | 0)) {
      HEAP32[$134 >> 2] = $R_1; //@line 4393
     } else {
      HEAP32[$72 + 20 >> 2] = $R_1; //@line 4396
     }
     if (($R_1 | 0) == 0) {
      $p_0 = $25;
      $psize_0 = $26;
      break L676;
     }
    }
   } while (0);
   if ($R_1 >>> 0 < (HEAP32[256] | 0) >>> 0) {
    _abort(); //@line 4409
   }
   HEAP32[$R_1 + 24 >> 2] = $72; //@line 4413
   $151 = HEAP32[$mem + ($_sum232 + 16) >> 2] | 0; //@line 4417
   do {
    if (($151 | 0) != 0) {
     if ($151 >>> 0 < (HEAP32[256] | 0) >>> 0) {
      _abort(); //@line 4425
     } else {
      HEAP32[$R_1 + 16 >> 2] = $151; //@line 4429
      HEAP32[$151 + 24 >> 2] = $R_1; //@line 4431
      break;
     }
    }
   } while (0);
   $164 = HEAP32[$mem + ($_sum232 + 20) >> 2] | 0; //@line 4439
   if (($164 | 0) == 0) {
    $p_0 = $25;
    $psize_0 = $26;
    break;
   }
   if ($164 >>> 0 < (HEAP32[256] | 0) >>> 0) {
    _abort(); //@line 4449
   } else {
    HEAP32[$R_1 + 20 >> 2] = $164; //@line 4453
    HEAP32[$164 + 24 >> 2] = $R_1; //@line 4455
    $p_0 = $25;
    $psize_0 = $26;
    break;
   }
  } else {
   $p_0 = $4;
   $psize_0 = $14;
  }
 } while (0);
 $189 = $p_0; //@line 4465
 if ($189 >>> 0 >= $15 >>> 0) {
  _abort(); //@line 4468
 }
 $193 = $mem + ($14 - 4) | 0; //@line 4473
 $194 = HEAP32[$193 >> 2] | 0; //@line 4474
 if (($194 & 1 | 0) == 0) {
  _abort(); //@line 4478
 }
 do {
  if (($194 & 2 | 0) == 0) {
   if (($16 | 0) == (HEAP32[258] | 0)) {
    $204 = (HEAP32[255] | 0) + $psize_0 | 0; //@line 4489
    HEAP32[255] = $204; //@line 4490
    HEAP32[258] = $p_0; //@line 4491
    HEAP32[$p_0 + 4 >> 2] = $204 | 1; //@line 4494
    if (($p_0 | 0) != (HEAP32[257] | 0)) {
     return;
    }
    HEAP32[257] = 0; //@line 4501
    HEAP32[254] = 0; //@line 4502
    return;
   }
   if (($16 | 0) == (HEAP32[257] | 0)) {
    $215 = (HEAP32[254] | 0) + $psize_0 | 0; //@line 4510
    HEAP32[254] = $215; //@line 4511
    HEAP32[257] = $p_0; //@line 4512
    HEAP32[$p_0 + 4 >> 2] = $215 | 1; //@line 4515
    HEAP32[$189 + $215 >> 2] = $215; //@line 4518
    return;
   }
   $222 = ($194 & -8) + $psize_0 | 0; //@line 4523
   $223 = $194 >>> 3; //@line 4524
   L778 : do {
    if ($194 >>> 0 < 256) {
     $228 = HEAP32[$mem + $14 >> 2] | 0; //@line 4530
     $231 = HEAP32[$mem + ($14 | 4) >> 2] | 0; //@line 4534
     $234 = 1048 + ($223 << 1 << 2) | 0; //@line 4537
     do {
      if (($228 | 0) != ($234 | 0)) {
       if ($228 >>> 0 < (HEAP32[256] | 0) >>> 0) {
        _abort(); //@line 4545
       }
       if ((HEAP32[$228 + 12 >> 2] | 0) == ($16 | 0)) {
        break;
       }
       _abort(); //@line 4554
      }
     } while (0);
     if (($231 | 0) == ($228 | 0)) {
      HEAP32[252] = HEAP32[252] & ~(1 << $223); //@line 4564
      break;
     }
     do {
      if (($231 | 0) == ($234 | 0)) {
       $_pre_phi304 = $231 + 8 | 0; //@line 4571
      } else {
       if ($231 >>> 0 < (HEAP32[256] | 0) >>> 0) {
        _abort(); //@line 4577
       }
       $257 = $231 + 8 | 0; //@line 4580
       if ((HEAP32[$257 >> 2] | 0) == ($16 | 0)) {
        $_pre_phi304 = $257; //@line 4584
        break;
       }
       _abort(); //@line 4587
      }
     } while (0);
     HEAP32[$228 + 12 >> 2] = $231; //@line 4593
     HEAP32[$_pre_phi304 >> 2] = $228; //@line 4594
    } else {
     $262 = $15; //@line 4596
     $265 = HEAP32[$mem + ($14 + 16) >> 2] | 0; //@line 4600
     $268 = HEAP32[$mem + ($14 | 4) >> 2] | 0; //@line 4604
     do {
      if (($268 | 0) == ($262 | 0)) {
       $288 = $mem + ($14 + 12) | 0; //@line 4610
       $289 = HEAP32[$288 >> 2] | 0; //@line 4611
       if (($289 | 0) == 0) {
        $293 = $mem + ($14 + 8) | 0; //@line 4616
        $294 = HEAP32[$293 >> 2] | 0; //@line 4617
        if (($294 | 0) == 0) {
         $R7_1 = 0; //@line 4620
         break;
        } else {
         $R7_0 = $294;
         $RP9_0 = $293;
        }
       } else {
        $R7_0 = $289;
        $RP9_0 = $288;
       }
       while (1) {
        $296 = $R7_0 + 20 | 0; //@line 4631
        $297 = HEAP32[$296 >> 2] | 0; //@line 4632
        if (($297 | 0) != 0) {
         $R7_0 = $297;
         $RP9_0 = $296;
         continue;
        }
        $300 = $R7_0 + 16 | 0; //@line 4638
        $301 = HEAP32[$300 >> 2] | 0; //@line 4639
        if (($301 | 0) == 0) {
         break;
        } else {
         $R7_0 = $301;
         $RP9_0 = $300;
        }
       }
       if ($RP9_0 >>> 0 < (HEAP32[256] | 0) >>> 0) {
        _abort(); //@line 4651
       } else {
        HEAP32[$RP9_0 >> 2] = 0; //@line 4654
        $R7_1 = $R7_0; //@line 4655
        break;
       }
      } else {
       $273 = HEAP32[$mem + $14 >> 2] | 0; //@line 4661
       if ($273 >>> 0 < (HEAP32[256] | 0) >>> 0) {
        _abort(); //@line 4666
       }
       $278 = $273 + 12 | 0; //@line 4669
       if ((HEAP32[$278 >> 2] | 0) != ($262 | 0)) {
        _abort(); //@line 4673
       }
       $282 = $268 + 8 | 0; //@line 4676
       if ((HEAP32[$282 >> 2] | 0) == ($262 | 0)) {
        HEAP32[$278 >> 2] = $268; //@line 4680
        HEAP32[$282 >> 2] = $273; //@line 4681
        $R7_1 = $268; //@line 4682
        break;
       } else {
        _abort(); //@line 4685
       }
      }
     } while (0);
     if (($265 | 0) == 0) {
      break;
     }
     $313 = $mem + ($14 + 20) | 0; //@line 4697
     $315 = 1312 + (HEAP32[$313 >> 2] << 2) | 0; //@line 4699
     do {
      if (($262 | 0) == (HEAP32[$315 >> 2] | 0)) {
       HEAP32[$315 >> 2] = $R7_1; //@line 4704
       if (($R7_1 | 0) != 0) {
        break;
       }
       HEAP32[253] = HEAP32[253] & ~(1 << HEAP32[$313 >> 2]); //@line 4714
       break L778;
      } else {
       if ($265 >>> 0 < (HEAP32[256] | 0) >>> 0) {
        _abort(); //@line 4721
       }
       $329 = $265 + 16 | 0; //@line 4724
       if ((HEAP32[$329 >> 2] | 0) == ($262 | 0)) {
        HEAP32[$329 >> 2] = $R7_1; //@line 4728
       } else {
        HEAP32[$265 + 20 >> 2] = $R7_1; //@line 4731
       }
       if (($R7_1 | 0) == 0) {
        break L778;
       }
      }
     } while (0);
     if ($R7_1 >>> 0 < (HEAP32[256] | 0) >>> 0) {
      _abort(); //@line 4743
     }
     HEAP32[$R7_1 + 24 >> 2] = $265; //@line 4747
     $346 = HEAP32[$mem + ($14 + 8) >> 2] | 0; //@line 4751
     do {
      if (($346 | 0) != 0) {
       if ($346 >>> 0 < (HEAP32[256] | 0) >>> 0) {
        _abort(); //@line 4759
       } else {
        HEAP32[$R7_1 + 16 >> 2] = $346; //@line 4763
        HEAP32[$346 + 24 >> 2] = $R7_1; //@line 4765
        break;
       }
      }
     } while (0);
     $359 = HEAP32[$mem + ($14 + 12) >> 2] | 0; //@line 4773
     if (($359 | 0) == 0) {
      break;
     }
     if ($359 >>> 0 < (HEAP32[256] | 0) >>> 0) {
      _abort(); //@line 4782
     } else {
      HEAP32[$R7_1 + 20 >> 2] = $359; //@line 4786
      HEAP32[$359 + 24 >> 2] = $R7_1; //@line 4788
      break;
     }
    }
   } while (0);
   HEAP32[$p_0 + 4 >> 2] = $222 | 1; //@line 4795
   HEAP32[$189 + $222 >> 2] = $222; //@line 4798
   if (($p_0 | 0) != (HEAP32[257] | 0)) {
    $psize_1 = $222; //@line 4802
    break;
   }
   HEAP32[254] = $222; //@line 4805
   return;
  } else {
   HEAP32[$193 >> 2] = $194 & -2; //@line 4810
   HEAP32[$p_0 + 4 >> 2] = $psize_0 | 1; //@line 4813
   HEAP32[$189 + $psize_0 >> 2] = $psize_0; //@line 4816
   $psize_1 = $psize_0; //@line 4817
  }
 } while (0);
 $385 = $psize_1 >>> 3; //@line 4821
 if ($psize_1 >>> 0 < 256) {
  $388 = $385 << 1; //@line 4824
  $390 = 1048 + ($388 << 2) | 0; //@line 4826
  $391 = HEAP32[252] | 0; //@line 4827
  $392 = 1 << $385; //@line 4828
  do {
   if (($391 & $392 | 0) == 0) {
    HEAP32[252] = $391 | $392; //@line 4834
    $F16_0 = $390;
    $_pre_phi = 1048 + ($388 + 2 << 2) | 0;
   } else {
    $398 = 1048 + ($388 + 2 << 2) | 0; //@line 4840
    $399 = HEAP32[$398 >> 2] | 0; //@line 4841
    if ($399 >>> 0 >= (HEAP32[256] | 0) >>> 0) {
     $F16_0 = $399;
     $_pre_phi = $398;
     break;
    }
    _abort(); //@line 4849
   }
  } while (0);
  HEAP32[$_pre_phi >> 2] = $p_0; //@line 4855
  HEAP32[$F16_0 + 12 >> 2] = $p_0; //@line 4857
  HEAP32[$p_0 + 8 >> 2] = $F16_0; //@line 4859
  HEAP32[$p_0 + 12 >> 2] = $390; //@line 4861
  return;
 }
 $409 = $p_0; //@line 4865
 $410 = $psize_1 >>> 8; //@line 4866
 do {
  if (($410 | 0) == 0) {
   $I18_0 = 0; //@line 4870
  } else {
   if ($psize_1 >>> 0 > 16777215) {
    $I18_0 = 31; //@line 4874
    break;
   }
   $417 = ($410 + 1048320 | 0) >>> 16 & 8; //@line 4879
   $418 = $410 << $417; //@line 4880
   $421 = ($418 + 520192 | 0) >>> 16 & 4; //@line 4883
   $423 = $418 << $421; //@line 4885
   $426 = ($423 + 245760 | 0) >>> 16 & 2; //@line 4888
   $431 = 14 - ($421 | $417 | $426) + ($423 << $426 >>> 15) | 0; //@line 4893
   $I18_0 = $psize_1 >>> (($431 + 7 | 0) >>> 0) & 1 | $431 << 1; //@line 4899
  }
 } while (0);
 $438 = 1312 + ($I18_0 << 2) | 0; //@line 4903
 HEAP32[$p_0 + 28 >> 2] = $I18_0; //@line 4906
 HEAP32[$p_0 + 20 >> 2] = 0; //@line 4908
 HEAP32[$p_0 + 16 >> 2] = 0; //@line 4910
 $442 = HEAP32[253] | 0; //@line 4911
 $443 = 1 << $I18_0; //@line 4912
 do {
  if (($442 & $443 | 0) == 0) {
   HEAP32[253] = $442 | $443; //@line 4918
   HEAP32[$438 >> 2] = $409; //@line 4919
   HEAP32[$p_0 + 24 >> 2] = $438; //@line 4922
   HEAP32[$p_0 + 12 >> 2] = $p_0; //@line 4924
   HEAP32[$p_0 + 8 >> 2] = $p_0; //@line 4926
  } else {
   if (($I18_0 | 0) == 31) {
    $458 = 0; //@line 4931
   } else {
    $458 = 25 - ($I18_0 >>> 1) | 0; //@line 4935
   }
   $K19_0 = $psize_1 << $458;
   $T_0 = HEAP32[$438 >> 2] | 0;
   while (1) {
    if ((HEAP32[$T_0 + 4 >> 2] & -8 | 0) == ($psize_1 | 0)) {
     break;
    }
    $467 = $T_0 + 16 + ($K19_0 >>> 31 << 2) | 0; //@line 4951
    $468 = HEAP32[$467 >> 2] | 0; //@line 4952
    if (($468 | 0) == 0) {
     label = 613; //@line 4956
     break;
    } else {
     $K19_0 = $K19_0 << 1;
     $T_0 = $468;
    }
   }
   if ((label | 0) == 613) {
    if ($467 >>> 0 < (HEAP32[256] | 0) >>> 0) {
     _abort(); //@line 4967
    } else {
     HEAP32[$467 >> 2] = $409; //@line 4970
     HEAP32[$p_0 + 24 >> 2] = $T_0; //@line 4973
     HEAP32[$p_0 + 12 >> 2] = $p_0; //@line 4975
     HEAP32[$p_0 + 8 >> 2] = $p_0; //@line 4977
     break;
    }
   }
   $481 = $T_0 + 8 | 0; //@line 4981
   $482 = HEAP32[$481 >> 2] | 0; //@line 4982
   $484 = HEAP32[256] | 0; //@line 4984
   if ($T_0 >>> 0 < $484 >>> 0) {
    _abort(); //@line 4987
   }
   if ($482 >>> 0 < $484 >>> 0) {
    _abort(); //@line 4993
   } else {
    HEAP32[$482 + 12 >> 2] = $409; //@line 4997
    HEAP32[$481 >> 2] = $409; //@line 4998
    HEAP32[$p_0 + 8 >> 2] = $482; //@line 5001
    HEAP32[$p_0 + 12 >> 2] = $T_0; //@line 5004
    HEAP32[$p_0 + 24 >> 2] = 0; //@line 5006
    break;
   }
  }
 } while (0);
 $496 = (HEAP32[260] | 0) - 1 | 0; //@line 5012
 HEAP32[260] = $496; //@line 5013
 if (($496 | 0) == 0) {
  $sp_0_in_i = 1464; //@line 5016
 } else {
  return;
 }
 while (1) {
  $sp_0_i = HEAP32[$sp_0_in_i >> 2] | 0; //@line 5023
  if (($sp_0_i | 0) == 0) {
   break;
  } else {
   $sp_0_in_i = $sp_0_i + 8 | 0; //@line 5029
  }
 }
 HEAP32[260] = -1; //@line 5032
 return;
}
function _DrawPict($screen, $bmpfile, $speedy, $flip, $nofade) {
 $screen = $screen | 0;
 $bmpfile = $bmpfile | 0;
 $speedy = $speedy | 0;
 $flip = $flip | 0;
 $nofade = $nofade | 0;
 var $update = 0, $palcolors = 0, $cdist = 0, $_bmpfile = 0, $2 = 0, $5 = 0, $8 = 0, $11 = 0, $14 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $28 = 0, $31 = 0, $32 = 0, $r_0246 = 0, $33 = 0, $34 = 0, $g_0244 = 0, $36 = 0, $38 = 0, $42 = 0, $46 = 0, $50 = 0, $57 = 0, $ncolors_0 = 0, $colors_0 = 0, $cmap_0_in = 0, $cmap_0 = 0, $74 = 0, $76 = 0, $77 = 0, $82 = 0, $83 = 0, $84 = 0, $pixels_0237 = 0, $i_0236 = 0, $94 = 0, $101 = 0, $104 = 0, $picture_0 = 0, $112 = 0, $117 = 0, $118 = 0, $_ = 0, $124 = 0, $126 = 0, $dest_sroa_0_0__idx = 0, $dest_sroa_1_4__idx164 = 0, $dest_sroa_2_8__idx165 = 0, $dest_sroa_3_12__idx166 = 0, $129 = 0, $i_1233 = 0, $134 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $c_0224_us = 0, $157 = 0, $168 = 0, $179 = 0, $i_3228_us = 0, $i_2230 = 0, $i_3228 = 0, $208 = 0, $c1_0215_us = 0, $217 = 0, $228 = 0, $239 = 0, $i_5219_us = 0, $i_4220 = 0, $i_5219 = 0, $268 = 0, $i_6211 = 0, $c2_0204_us = 0, $284 = 0, $295 = 0, $306 = 0, $i_8206_us = 0, $i_7207 = 0, $i_8206 = 0, $346 = 0, $picture_1 = 0, label = 0, tempVarArgs = 0, sp = 0;
 sp = STACKTOP; //@line 149
 STACKTOP = STACKTOP + 2576 | 0; //@line 149
 $update = sp | 0; //@line 150
 $palcolors = sp + 16 | 0; //@line 151
 $cdist = sp + 1040 | 0; //@line 152
 $_bmpfile = ($bmpfile | 0) == 0 ? 960 : $bmpfile; //@line 154
 $2 = HEAP32[_stderr >> 2] | 0; //@line 155
 _fprintf($2 | 0, 936, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempVarArgs >> 2] = $_bmpfile, tempVarArgs) | 0) | 0; //@line 156
 STACKTOP = tempVarArgs; //@line 156
 $5 = _IMG_Load_RW(_SDL_RWFromFile($_bmpfile | 0, 744) | 0, 1) | 0; //@line 158
 if (($5 | 0) == 0) {
  $8 = _SDL_GetError() | 0; //@line 162
  _fprintf($2 | 0, 504, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 16 | 0, HEAP32[tempVarArgs >> 2] = $_bmpfile, HEAP32[tempVarArgs + 8 >> 2] = $8, tempVarArgs) | 0) | 0; //@line 163
  STACKTOP = tempVarArgs; //@line 163
  STACKTOP = sp; //@line 165
  return;
 }
 $11 = $5 + 4 | 0; //@line 168
 $14 = HEAP32[(HEAP32[$11 >> 2] | 0) + 4 >> 2] | 0; //@line 171
 if (($14 | 0) == 0) {
  $31 = _malloc(1024) | 0; //@line 176
  $32 = _malloc(1024) | 0; //@line 177
  $r_0246 = 0; //@line 179
  while (1) {
   $33 = $r_0246 << 5; //@line 182
   $34 = $33 & 255; //@line 183
   $g_0244 = 0; //@line 185
   do {
    $36 = $g_0244 << 2 | $33; //@line 189
    $38 = $g_0244 << 5 & 255; //@line 191
    HEAP8[$31 + ($36 << 2) | 0] = $34; //@line 193
    HEAP8[$31 + ($36 << 2) + 1 | 0] = $38; //@line 195
    HEAP8[$31 + ($36 << 2) + 2 | 0] = 0; //@line 197
    $42 = $36 | 1; //@line 198
    HEAP8[$31 + ($42 << 2) | 0] = $34; //@line 200
    HEAP8[$31 + ($42 << 2) + 1 | 0] = $38; //@line 202
    HEAP8[$31 + ($42 << 2) + 2 | 0] = 64; //@line 204
    $46 = $36 | 2; //@line 205
    HEAP8[$31 + ($46 << 2) | 0] = $34; //@line 207
    HEAP8[$31 + ($46 << 2) + 1 | 0] = $38; //@line 209
    HEAP8[$31 + ($46 << 2) + 2 | 0] = -128; //@line 211
    $50 = $36 | 3; //@line 212
    HEAP8[$31 + ($50 << 2) | 0] = $34; //@line 214
    HEAP8[$31 + ($50 << 2) + 1 | 0] = $38; //@line 216
    HEAP8[$31 + ($50 << 2) + 2 | 0] = -64; //@line 218
    $g_0244 = $g_0244 + 1 | 0; //@line 219
   } while (($g_0244 | 0) < 8);
   $57 = $r_0246 + 1 | 0; //@line 228
   if (($57 | 0) < 8) {
    $r_0246 = $57; //@line 232
   } else {
    $cmap_0_in = $32;
    $colors_0 = $31;
    $ncolors_0 = 256;
    break;
   }
  }
 } else {
  $18 = HEAP32[$14 >> 2] | 0; //@line 240
  $19 = $18 << 2; //@line 241
  $20 = _malloc($19) | 0; //@line 242
  $21 = $20; //@line 243
  $22 = _malloc($19) | 0; //@line 244
  $28 = HEAP32[(HEAP32[(HEAP32[$11 >> 2] | 0) + 4 >> 2] | 0) + 4 >> 2] | 0; //@line 250
  _memcpy($20 | 0, $28 | 0, $19) | 0; //@line 251
  $cmap_0_in = $22;
  $colors_0 = $21;
  $ncolors_0 = $18;
 }
 $cmap_0 = $cmap_0_in; //@line 258
 _printf(328, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempVarArgs >> 2] = 272, tempVarArgs) | 0) | 0; //@line 259
 STACKTOP = tempVarArgs; //@line 259
 do {
  if ((_SDL_SetColors($screen | 0, $colors_0 | 0, 0, $ncolors_0 | 0) | 0) == 0) {
   if ((HEAP32[(HEAP32[$screen + 4 >> 2] | 0) + 4 >> 2] | 0) == 0) {
    break;
   }
   _fwrite(136, 130, 1, $2 | 0) | 0; //@line 274
  }
 } while (0);
 if ((_SDL_LockSurface($screen | 0) | 0) == 0) {
  $74 = $screen + 4 | 0; //@line 282
  $76 = _SDL_MapRGB(HEAP32[$74 >> 2] | 0, 0, 0, 0) | 0; //@line 284
  $77 = $screen + 12 | 0; //@line 285
  if ((HEAP32[$77 >> 2] | 0) > 0) {
   $82 = $76 & 255; //@line 292
   $83 = $screen + 8 | 0; //@line 293
   $84 = $screen + 16 | 0; //@line 294
   $i_0236 = 0;
   $pixels_0237 = HEAP32[$screen + 20 >> 2] | 0;
   while (1) {
    _memset($pixels_0237 | 0, $82 | 0, Math_imul(HEAPU8[(HEAP32[$74 >> 2] | 0) + 9 | 0] | 0, HEAP32[$83 >> 2] | 0) | 0); //@line 306
    $94 = $i_0236 + 1 | 0; //@line 309
    if (($94 | 0) < (HEAP32[$77 >> 2] | 0)) {
     $i_0236 = $94;
     $pixels_0237 = $pixels_0237 + (HEAP32[$84 >> 2] | 0) | 0;
    } else {
     break;
    }
   }
  }
  _SDL_UnlockSurface($screen | 0); //@line 320
  _SDL_UpdateRect($screen | 0, 0, 0, 0, 0); //@line 321
 }
 do {
  if (($speedy | 0) == 0) {
   $picture_0 = $5; //@line 328
   label = 21; //@line 329
  } else {
   _fwrite(112, 19, 1, $2 | 0) | 0; //@line 331
   $101 = _SDL_DisplayFormatAlpha($5 | 0) | 0; //@line 332
   if (($101 | 0) == 0) {
    $104 = _SDL_GetError() | 0; //@line 336
    _fprintf($2 | 0, 80, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempVarArgs >> 2] = $104, tempVarArgs) | 0) | 0; //@line 337
    STACKTOP = tempVarArgs; //@line 337
    $picture_1 = $5; //@line 339
    break;
   } else {
    _SDL_FreeSurface($5 | 0); //@line 342
    $picture_0 = $101; //@line 344
    label = 21; //@line 345
    break;
   }
  }
 } while (0);
 do {
  if ((label | 0) == 21) {
   $112 = (HEAP32[$picture_0 >> 2] & 134217729 | 0) != 0 ? 928 : 920; //@line 357
   _printf(40, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempVarArgs >> 2] = $112, tempVarArgs) | 0) | 0; //@line 358
   STACKTOP = tempVarArgs; //@line 358
   $117 = HEAP32[$picture_0 + 8 >> 2] | 0; //@line 362
   $118 = (HEAP32[$screen + 8 >> 2] | 0) - $117 | 0; //@line 363
   $_ = ($118 | 0) < -1 ? 0 : ($118 | 0) / 2 | 0; //@line 366
   $124 = HEAP32[$picture_0 + 12 >> 2] | 0; //@line 370
   $126 = ((HEAP32[$screen + 12 >> 2] | 0) - $124 | 0) / 2 | 0; //@line 372
   _printf(328, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempVarArgs >> 2] = 896, tempVarArgs) | 0) | 0; //@line 373
   STACKTOP = tempVarArgs; //@line 373
   L33 : do {
    if (($_ | 0) >= 0) {
     $dest_sroa_0_0__idx = $update | 0; //@line 378
     $dest_sroa_1_4__idx164 = $update + 4 | 0; //@line 379
     $dest_sroa_2_8__idx165 = $update + 8 | 0; //@line 380
     $dest_sroa_3_12__idx166 = $update + 12 | 0; //@line 381
     $129 = ($flip | 0) == 0; //@line 382
     $i_1233 = 0; //@line 384
     while (1) {
      HEAP32[$dest_sroa_0_0__idx >> 2] = $i_1233; //@line 387
      HEAP32[$dest_sroa_1_4__idx164 >> 2] = $126; //@line 388
      HEAP32[$dest_sroa_2_8__idx165 >> 2] = $117; //@line 389
      HEAP32[$dest_sroa_3_12__idx166 >> 2] = $124; //@line 390
      if ((_SDL_UpperBlit($picture_0 | 0, 0, $screen | 0, $update | 0) | 0) < 0) {
       break;
      }
      if ($129) {
       _SDL_UpdateRects($screen | 0, 1, $update | 0); //@line 399
      } else {
       _SDL_Flip($screen | 0) | 0; //@line 401
      }
      $i_1233 = $i_1233 + 1 | 0; //@line 404
      if (($i_1233 | 0) > ($_ | 0)) {
       break L33;
      }
     }
     $134 = _SDL_GetError() | 0; //@line 413
     _fprintf($2 | 0, 872, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempVarArgs >> 2] = $134, tempVarArgs) | 0) | 0; //@line 414
     STACKTOP = tempVarArgs; //@line 414
    }
   } while (0);
   if (($nofade | 0) != 0) {
    $picture_1 = $picture_0; //@line 421
    break;
   }
   _printf(328, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempVarArgs >> 2] = 848, tempVarArgs) | 0) | 0; //@line 424
   STACKTOP = tempVarArgs; //@line 424
   $146 = $colors_0 | 0; //@line 425
   $147 = $ncolors_0 << 2; //@line 426
   _memcpy($cmap_0_in | 0, $146 | 0, $147) | 0; //@line 427
   $148 = $palcolors | 0; //@line 428
   _memcpy($148 | 0, $146 | 0, $147) | 0; //@line 429
   $149 = ($ncolors_0 | 0) > 0; //@line 430
   do {
    if ($149) {
     $i_2230 = 0; //@line 434
     do {
      HEAP16[$cdist + ($i_2230 * 6 | 0) >> 1] = HEAPU8[$palcolors + ($i_2230 << 2) | 0] ^ 255; //@line 442
      HEAP16[$cdist + ($i_2230 * 6 | 0) + 2 >> 1] = -(HEAPU8[$palcolors + ($i_2230 << 2) + 1 | 0] | 0) & 65535; //@line 448
      HEAP16[$cdist + ($i_2230 * 6 | 0) + 4 >> 1] = -(HEAPU8[$palcolors + ($i_2230 << 2) + 2 | 0] | 0) & 65535; //@line 454
      $i_2230 = $i_2230 + 1 | 0; //@line 455
     } while (($i_2230 | 0) < ($ncolors_0 | 0));
     if ($149) {
      $i_3228_us = 0; //@line 465
     } else {
      $i_3228 = 0; //@line 467
      label = 36; //@line 468
      break;
     }
     do {
      $c_0224_us = 0; //@line 474
      do {
       $157 = HEAPU8[$palcolors + ($c_0224_us << 2) | 0] | 0; //@line 479
       HEAP8[$colors_0 + ($c_0224_us << 2) | 0] = ((Math_imul(HEAP16[$cdist + ($c_0224_us * 6 | 0) >> 1] | 0, $i_3228_us) | 0) / 31 | 0) + $157 & 255; //@line 488
       $168 = HEAPU8[$palcolors + ($c_0224_us << 2) + 1 | 0] | 0; //@line 491
       HEAP8[$colors_0 + ($c_0224_us << 2) + 1 | 0] = ((Math_imul(HEAP16[$cdist + ($c_0224_us * 6 | 0) + 2 >> 1] | 0, $i_3228_us) | 0) / 31 | 0) + $168 & 255; //@line 500
       $179 = HEAPU8[$palcolors + ($c_0224_us << 2) + 2 | 0] | 0; //@line 503
       HEAP8[$colors_0 + ($c_0224_us << 2) + 2 | 0] = ((Math_imul(HEAP16[$cdist + ($c_0224_us * 6 | 0) + 4 >> 1] | 0, $i_3228_us) | 0) / 31 | 0) + $179 & 255; //@line 512
       $c_0224_us = $c_0224_us + 1 | 0; //@line 513
      } while (($c_0224_us | 0) < ($ncolors_0 | 0));
      _SDL_SetColors($screen | 0, $colors_0 | 0, 0, $ncolors_0 | 0) | 0; //@line 522
      $i_3228_us = $i_3228_us + 1 | 0; //@line 523
     } while (($i_3228_us | 0) < 16);
    } else {
     $i_3228 = 0; //@line 533
     label = 36; //@line 534
    }
   } while (0);
   if ((label | 0) == 36) {
    while (1) {
     label = 0; //@line 539
     _SDL_SetColors($screen | 0, $colors_0 | 0, 0, $ncolors_0 | 0) | 0; //@line 541
     $208 = $i_3228 + 1 | 0; //@line 542
     if (($208 | 0) < 16) {
      $i_3228 = $208; //@line 546
      label = 36; //@line 547
     } else {
      break;
     }
    }
   }
   _memcpy($148 | 0, $146 | 0, $147) | 0; //@line 553
   do {
    if ($149) {
     $i_4220 = 0; //@line 557
     do {
      HEAP16[$cdist + ($i_4220 * 6 | 0) >> 1] = -(HEAPU8[$palcolors + ($i_4220 << 2) | 0] | 0) & 65535; //@line 565
      HEAP16[$cdist + ($i_4220 * 6 | 0) + 2 >> 1] = -(HEAPU8[$palcolors + ($i_4220 << 2) + 1 | 0] | 0) & 65535; //@line 571
      HEAP16[$cdist + ($i_4220 * 6 | 0) + 4 >> 1] = -(HEAPU8[$palcolors + ($i_4220 << 2) + 2 | 0] | 0) & 65535; //@line 577
      $i_4220 = $i_4220 + 1 | 0; //@line 578
     } while (($i_4220 | 0) < ($ncolors_0 | 0));
     if ($149) {
      $i_5219_us = 0; //@line 588
     } else {
      $i_5219 = 0; //@line 590
      label = 44; //@line 591
      break;
     }
     do {
      $c1_0215_us = 0; //@line 597
      do {
       $217 = HEAPU8[$palcolors + ($c1_0215_us << 2) | 0] | 0; //@line 602
       HEAP8[$colors_0 + ($c1_0215_us << 2) | 0] = ((Math_imul(HEAP16[$cdist + ($c1_0215_us * 6 | 0) >> 1] | 0, $i_5219_us) | 0) / 15 | 0) + $217 & 255; //@line 611
       $228 = HEAPU8[$palcolors + ($c1_0215_us << 2) + 1 | 0] | 0; //@line 614
       HEAP8[$colors_0 + ($c1_0215_us << 2) + 1 | 0] = ((Math_imul(HEAP16[$cdist + ($c1_0215_us * 6 | 0) + 2 >> 1] | 0, $i_5219_us) | 0) / 15 | 0) + $228 & 255; //@line 623
       $239 = HEAPU8[$palcolors + ($c1_0215_us << 2) + 2 | 0] | 0; //@line 626
       HEAP8[$colors_0 + ($c1_0215_us << 2) + 2 | 0] = ((Math_imul(HEAP16[$cdist + ($c1_0215_us * 6 | 0) + 4 >> 1] | 0, $i_5219_us) | 0) / 15 | 0) + $239 & 255; //@line 635
       $c1_0215_us = $c1_0215_us + 1 | 0; //@line 636
      } while (($c1_0215_us | 0) < ($ncolors_0 | 0));
      _SDL_SetColors($screen | 0, $colors_0 | 0, 0, $ncolors_0 | 0) | 0; //@line 645
      $i_5219_us = $i_5219_us + 1 | 0; //@line 646
     } while (($i_5219_us | 0) < 16);
    } else {
     $i_5219 = 0; //@line 656
     label = 44; //@line 657
    }
   } while (0);
   if ((label | 0) == 44) {
    while (1) {
     label = 0; //@line 662
     _SDL_SetColors($screen | 0, $colors_0 | 0, 0, $ncolors_0 | 0) | 0; //@line 664
     $268 = $i_5219 + 1 | 0; //@line 665
     if (($268 | 0) < 16) {
      $i_5219 = $268; //@line 669
      label = 44; //@line 670
     } else {
      break;
     }
    }
   }
   do {
    if ($149) {
     $i_6211 = 0; //@line 679
     do {
      HEAP8[$colors_0 + ($i_6211 << 2) | 0] = 0; //@line 683
      HEAP8[$colors_0 + ($i_6211 << 2) + 1 | 0] = 0; //@line 685
      HEAP8[$colors_0 + ($i_6211 << 2) + 2 | 0] = 0; //@line 687
      $i_6211 = $i_6211 + 1 | 0; //@line 688
     } while (($i_6211 | 0) < ($ncolors_0 | 0));
     _SDL_SetColors($screen | 0, $colors_0 | 0, 0, $ncolors_0 | 0) | 0; //@line 697
     _printf(328, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempVarArgs >> 2] = 824, tempVarArgs) | 0) | 0; //@line 698
     STACKTOP = tempVarArgs; //@line 698
     _memcpy($148 | 0, $146 | 0, $147) | 0; //@line 699
     if ($149) {
      $i_7207 = 0; //@line 702
     } else {
      $i_8206 = 0; //@line 704
      label = 53; //@line 705
      break;
     }
     do {
      HEAP16[$cdist + ($i_7207 * 6 | 0) >> 1] = (HEAPU8[$cmap_0 + ($i_7207 << 2) | 0] | 0) - (HEAPU8[$palcolors + ($i_7207 << 2) | 0] | 0) & 65535; //@line 718
      HEAP16[$cdist + ($i_7207 * 6 | 0) + 2 >> 1] = (HEAPU8[$cmap_0 + ($i_7207 << 2) + 1 | 0] | 0) - (HEAPU8[$palcolors + ($i_7207 << 2) + 1 | 0] | 0) & 65535; //@line 727
      HEAP16[$cdist + ($i_7207 * 6 | 0) + 4 >> 1] = (HEAPU8[$cmap_0 + ($i_7207 << 2) + 2 | 0] | 0) - (HEAPU8[$palcolors + ($i_7207 << 2) + 2 | 0] | 0) & 65535; //@line 736
      $i_7207 = $i_7207 + 1 | 0; //@line 737
     } while (($i_7207 | 0) < ($ncolors_0 | 0));
     if ($149) {
      $i_8206_us = 0; //@line 747
     } else {
      $i_8206 = 0; //@line 749
      label = 53; //@line 750
      break;
     }
     do {
      $c2_0204_us = 0; //@line 756
      do {
       $284 = HEAPU8[$palcolors + ($c2_0204_us << 2) | 0] | 0; //@line 761
       HEAP8[$colors_0 + ($c2_0204_us << 2) | 0] = ((Math_imul(HEAP16[$cdist + ($c2_0204_us * 6 | 0) >> 1] | 0, $i_8206_us) | 0) / 15 | 0) + $284 & 255; //@line 770
       $295 = HEAPU8[$palcolors + ($c2_0204_us << 2) + 1 | 0] | 0; //@line 773
       HEAP8[$colors_0 + ($c2_0204_us << 2) + 1 | 0] = ((Math_imul(HEAP16[$cdist + ($c2_0204_us * 6 | 0) + 2 >> 1] | 0, $i_8206_us) | 0) / 15 | 0) + $295 & 255; //@line 782
       $306 = HEAPU8[$palcolors + ($c2_0204_us << 2) + 2 | 0] | 0; //@line 785
       HEAP8[$colors_0 + ($c2_0204_us << 2) + 2 | 0] = ((Math_imul(HEAP16[$cdist + ($c2_0204_us * 6 | 0) + 4 >> 1] | 0, $i_8206_us) | 0) / 15 | 0) + $306 & 255; //@line 794
       $c2_0204_us = $c2_0204_us + 1 | 0; //@line 795
      } while (($c2_0204_us | 0) < ($ncolors_0 | 0));
      _SDL_SetColors($screen | 0, $colors_0 | 0, 0, $ncolors_0 | 0) | 0; //@line 804
      $i_8206_us = $i_8206_us + 1 | 0; //@line 805
     } while (($i_8206_us | 0) < 16);
    } else {
     _SDL_SetColors($screen | 0, $colors_0 | 0, 0, $ncolors_0 | 0) | 0; //@line 815
     _printf(328, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempVarArgs >> 2] = 824, tempVarArgs) | 0) | 0; //@line 816
     STACKTOP = tempVarArgs; //@line 816
     _memcpy($148 | 0, $146 | 0, $147) | 0; //@line 817
     $i_8206 = 0; //@line 818
     label = 53; //@line 819
    }
   } while (0);
   if ((label | 0) == 53) {
    while (1) {
     label = 0; //@line 824
     _SDL_SetColors($screen | 0, $colors_0 | 0, 0, $ncolors_0 | 0) | 0; //@line 826
     $346 = $i_8206 + 1 | 0; //@line 827
     if (($346 | 0) < 16) {
      $i_8206 = $346; //@line 831
      label = 53; //@line 832
     } else {
      break;
     }
    }
   }
   _printf(328, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempVarArgs >> 2] = 800, tempVarArgs) | 0) | 0; //@line 838
   STACKTOP = tempVarArgs; //@line 838
   $picture_1 = $picture_0; //@line 840
  }
 } while (0);
 _SDL_FreeSurface($picture_1 | 0); //@line 844
 _free($colors_0 | 0); //@line 846
 _free($cmap_0_in); //@line 847
 STACKTOP = sp; //@line 849
 return;
}
function _main($argc, $argv) {
 $argc = $argc | 0;
 $argv = $argv | 0;
 var $5 = 0, $6 = 0, $_05188 = 0, $video_flags_087 = 0, $desired_bpp_086 = 0, $h_085 = 0, $w_084 = 0, $nofade_083 = 0, $speedy_082 = 0, $_05281 = 0, $8 = 0, $9 = 0, $_052_be = 0, $speedy_0_be = 0, $nofade_0_be = 0, $w_0_be = 0, $h_0_be = 0, $desired_bpp_0_be = 0, $video_flags_0_be = 0, $_051_be = 0, $24 = 0, $30 = 0, $36 = 0, $37 = 0, $40 = 0, $45 = 0, $46 = 0, $51 = 0, $52 = 0, $55 = 0, $60 = 0, $61 = 0, $66 = 0, $67 = 0, $video_flags_0_lcssa = 0, $desired_bpp_0_lcssa = 0, $h_0_lcssa = 0, $w_0_lcssa = 0, $nofade_0_lcssa = 0, $speedy_0_lcssa = 0, $_052_lcssa = 0, $99 = 0, $102 = 0, $103 = 0, $106 = 0, $112 = 0, $114 = 0, $119 = 0, $flip_0 = 0, $131 = 0, $135 = 0, $_0 = 0, label = 0, tempVarArgs = 0, sp = 0;
 sp = STACKTOP; //@line 875
 if ((_SDL_Init(32) | 0) < 0) {
  $5 = HEAP32[_stderr >> 2] | 0; //@line 880
  $6 = _SDL_GetError() | 0; //@line 881
  _fprintf($5 | 0, 768, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempVarArgs >> 2] = $6, tempVarArgs) | 0) | 0; //@line 882
  STACKTOP = tempVarArgs; //@line 882
  $_0 = 1; //@line 884
  STACKTOP = sp; //@line 886
  return $_0 | 0; //@line 887
 }
 L95 : do {
  if (($argc | 0) > 1) {
   $_05281 = $argv;
   $speedy_082 = 0;
   $nofade_083 = 0;
   $w_084 = 640;
   $h_085 = 480;
   $desired_bpp_086 = 0;
   $video_flags_087 = 0;
   $_05188 = $argc;
   L96 : while (1) {
    $8 = $_05281 + 4 | 0; //@line 903
    $9 = HEAP32[$8 >> 2] | 0; //@line 904
    do {
     if ((_strcmp($9 | 0, 760) | 0) == 0) {
      $_051_be = $_05188 - 1 | 0;
      $video_flags_0_be = $video_flags_087;
      $desired_bpp_0_be = $desired_bpp_086;
      $h_0_be = $h_085;
      $w_0_be = $w_084;
      $nofade_0_be = $nofade_083;
      $speedy_0_be = 1;
      $_052_be = $8;
     } else {
      if ((_strcmp($9 | 0, 752) | 0) == 0) {
       $_051_be = $_05188 - 1 | 0;
       $video_flags_0_be = $video_flags_087;
       $desired_bpp_0_be = $desired_bpp_086;
       $h_0_be = $h_085;
       $w_0_be = $w_084;
       $nofade_0_be = 1;
       $speedy_0_be = $speedy_082;
       $_052_be = $8;
       break;
      }
      if ((_strcmp($9 | 0, 736) | 0) == 0) {
       $24 = $_05281 + 8 | 0; //@line 927
       if ((HEAP32[$24 >> 2] | 0) == 0) {
        label = 70; //@line 932
        break L96;
       }
       $_051_be = $_05188 - 2 | 0;
       $video_flags_0_be = $video_flags_087;
       $desired_bpp_0_be = $desired_bpp_086;
       $h_0_be = $h_085;
       $w_0_be = $w_084;
       $nofade_0_be = $nofade_083;
       $speedy_0_be = $speedy_082;
       $_052_be = $24;
       break;
      }
      if ((_strcmp($9 | 0, 688) | 0) == 0) {
       $36 = $_05281 + 8 | 0; //@line 944
       $37 = HEAP32[$36 >> 2] | 0; //@line 945
       if (($37 | 0) == 0) {
        label = 99; //@line 949
        break L96;
       }
       $40 = _atoi($37 | 0) | 0; //@line 952
       if (($40 | 0) <= 0) {
        label = 100; //@line 956
        break L96;
       }
       $_051_be = $_05188 - 2 | 0;
       $video_flags_0_be = $video_flags_087;
       $desired_bpp_0_be = $desired_bpp_086;
       $h_0_be = $h_085;
       $w_0_be = $40;
       $nofade_0_be = $nofade_083;
       $speedy_0_be = $speedy_082;
       $_052_be = $36;
       break;
      }
      if ((_strcmp($9 | 0, 640) | 0) == 0) {
       $51 = $_05281 + 8 | 0; //@line 968
       $52 = HEAP32[$51 >> 2] | 0; //@line 969
       if (($52 | 0) == 0) {
        label = 101; //@line 973
        break L96;
       }
       $55 = _atoi($52 | 0) | 0; //@line 976
       if (($55 | 0) <= 0) {
        label = 102; //@line 980
        break L96;
       }
       $_051_be = $_05188 - 2 | 0;
       $video_flags_0_be = $video_flags_087;
       $desired_bpp_0_be = $desired_bpp_086;
       $h_0_be = $55;
       $w_0_be = $w_084;
       $nofade_0_be = $nofade_083;
       $speedy_0_be = $speedy_082;
       $_052_be = $51;
       break;
      }
      if ((_strcmp($9 | 0, 584) | 0) == 0) {
       $66 = $_05281 + 8 | 0; //@line 992
       $67 = HEAP32[$66 >> 2] | 0; //@line 993
       if (($67 | 0) == 0) {
        label = 84; //@line 997
        break L96;
       }
       $_051_be = $_05188 - 2 | 0;
       $video_flags_0_be = $video_flags_087;
       $desired_bpp_0_be = _atoi($67 | 0) | 0;
       $h_0_be = $h_085;
       $w_0_be = $w_084;
       $nofade_0_be = $nofade_083;
       $speedy_0_be = $speedy_082;
       $_052_be = $66;
       break;
      }
      if ((_strcmp($9 | 0, 536) | 0) == 0) {
       $_051_be = $_05188 - 1 | 0;
       $video_flags_0_be = $video_flags_087 | 2097152;
       $desired_bpp_0_be = $desired_bpp_086;
       $h_0_be = $h_085;
       $w_0_be = $w_084;
       $nofade_0_be = $nofade_083;
       $speedy_0_be = $speedy_082;
       $_052_be = $8;
       break;
      }
      if ((_strcmp($9 | 0, 528) | 0) == 0) {
       $_051_be = $_05188 - 1 | 0;
       $video_flags_0_be = $video_flags_087 | 134217729;
       $desired_bpp_0_be = $desired_bpp_086;
       $h_0_be = $h_085;
       $w_0_be = $w_084;
       $nofade_0_be = $nofade_083;
       $speedy_0_be = $speedy_082;
       $_052_be = $8;
       break;
      }
      if ((_strcmp($9 | 0, 496) | 0) == 0) {
       $_051_be = $_05188 - 1 | 0;
       $video_flags_0_be = $video_flags_087 | 4194304;
       $desired_bpp_0_be = $desired_bpp_086;
       $h_0_be = $h_085;
       $w_0_be = $w_084;
       $nofade_0_be = $nofade_083;
       $speedy_0_be = $speedy_082;
       $_052_be = $8;
       break;
      }
      if ((_strcmp($9 | 0, 480) | 0) != 0) {
       $_052_lcssa = $_05281;
       $speedy_0_lcssa = $speedy_082;
       $nofade_0_lcssa = $nofade_083;
       $w_0_lcssa = $w_084;
       $h_0_lcssa = $h_085;
       $desired_bpp_0_lcssa = $desired_bpp_086;
       $video_flags_0_lcssa = $video_flags_087;
       break L95;
      }
      $_051_be = $_05188 - 1 | 0;
      $video_flags_0_be = $video_flags_087 | 8388608;
      $desired_bpp_0_be = $desired_bpp_086;
      $h_0_be = $h_085;
      $w_0_be = $w_084;
      $nofade_0_be = $nofade_083;
      $speedy_0_be = $speedy_082;
      $_052_be = $8;
     }
    } while (0);
    if (($_051_be | 0) > 1) {
     $_05281 = $_052_be;
     $speedy_082 = $speedy_0_be;
     $nofade_083 = $nofade_0_be;
     $w_084 = $w_0_be;
     $h_085 = $h_0_be;
     $desired_bpp_086 = $desired_bpp_0_be;
     $video_flags_087 = $video_flags_0_be;
     $_05188 = $_051_be;
    } else {
     $_052_lcssa = $_052_be;
     $speedy_0_lcssa = $speedy_0_be;
     $nofade_0_lcssa = $nofade_0_be;
     $w_0_lcssa = $w_0_be;
     $h_0_lcssa = $h_0_be;
     $desired_bpp_0_lcssa = $desired_bpp_0_be;
     $video_flags_0_lcssa = $video_flags_0_be;
     break L95;
    }
   }
   if ((label | 0) == 70) {
    $30 = HEAP32[_stderr >> 2] | 0; //@line 1066
    _fwrite(696, 39, 1, $30 | 0) | 0; //@line 1067
    _quit(); //@line 1068
    return 0; //@line 1069
   } else if ((label | 0) == 84) {
    _fwrite(544, 37, 1, HEAP32[_stderr >> 2] | 0) | 0; //@line 1073
    _quit(); //@line 1074
    return 0; //@line 1075
   } else if ((label | 0) == 99) {
    $45 = HEAP32[_stderr >> 2] | 0; //@line 1078
    $46 = _fwrite(648, 39, 1, $45 | 0) | 0; //@line 1079
    _quit(); //@line 1080
    return 0; //@line 1081
   } else if ((label | 0) == 100) {
    $45 = HEAP32[_stderr >> 2] | 0; //@line 1084
    $46 = _fwrite(648, 39, 1, $45 | 0) | 0; //@line 1085
    _quit(); //@line 1086
    return 0; //@line 1087
   } else if ((label | 0) == 101) {
    $60 = HEAP32[_stderr >> 2] | 0; //@line 1090
    $61 = _fwrite(592, 40, 1, $60 | 0) | 0; //@line 1091
    _quit(); //@line 1092
    return 0; //@line 1093
   } else if ((label | 0) == 102) {
    $60 = HEAP32[_stderr >> 2] | 0; //@line 1096
    $61 = _fwrite(592, 40, 1, $60 | 0) | 0; //@line 1097
    _quit(); //@line 1098
    return 0; //@line 1099
   }
  } else {
   $_052_lcssa = $argv;
   $speedy_0_lcssa = 0;
   $nofade_0_lcssa = 0;
   $w_0_lcssa = 640;
   $h_0_lcssa = 480;
   $desired_bpp_0_lcssa = 0;
   $video_flags_0_lcssa = 0;
  }
 } while (0);
 $99 = _SDL_SetVideoMode($w_0_lcssa | 0, $h_0_lcssa | 0, $desired_bpp_0_lcssa | 0, $video_flags_0_lcssa | 0) | 0; //@line 1112
 if (($99 | 0) == 0) {
  $102 = HEAP32[_stderr >> 2] | 0; //@line 1116
  $103 = _SDL_GetError() | 0; //@line 1117
  _fprintf($102 | 0, 440, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 32 | 0, HEAP32[tempVarArgs >> 2] = $w_0_lcssa, HEAP32[tempVarArgs + 8 >> 2] = $h_0_lcssa, HEAP32[tempVarArgs + 16 >> 2] = $desired_bpp_0_lcssa, HEAP32[tempVarArgs + 24 >> 2] = $103, tempVarArgs) | 0) | 0; //@line 1118
  STACKTOP = tempVarArgs; //@line 1118
  _quit(); //@line 1119
  return 0; //@line 1120
 }
 $106 = $99 | 0; //@line 1122
 $112 = HEAP32[$99 + 8 >> 2] | 0; //@line 1128
 $114 = HEAP32[$99 + 12 >> 2] | 0; //@line 1130
 $119 = HEAPU8[(HEAP32[$99 + 4 >> 2] | 0) + 8 | 0] | 0; //@line 1135
 _printf(416, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 32 | 0, HEAP32[tempVarArgs >> 2] = (HEAP32[$106 >> 2] & 8388608 | 0) != 0 ? 400 : 1e3, HEAP32[tempVarArgs + 8 >> 2] = $112, HEAP32[tempVarArgs + 16 >> 2] = $114, HEAP32[tempVarArgs + 24 >> 2] = $119, tempVarArgs) | 0) | 0; //@line 1136
 STACKTOP = tempVarArgs; //@line 1136
 _printf(360, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempVarArgs >> 2] = (HEAP32[$106 >> 2] & 134217729 | 0) != 0 ? 928 : 920, tempVarArgs) | 0) | 0; //@line 1141
 STACKTOP = tempVarArgs; //@line 1141
 if ((HEAP32[$106 >> 2] & 4194304 | 0) == 0) {
  $flip_0 = 0; //@line 1147
 } else {
  _puts(8) | 0; //@line 1149
  $flip_0 = 1; //@line 1151
 }
 _SDL_WM_SetCaption(344, 336); //@line 1154
 $131 = _SDL_GetTicks() | 0; //@line 1155
 _DrawPict($99, HEAP32[$_052_lcssa + 4 >> 2] | 0, $speedy_0_lcssa, $flip_0, $nofade_0_lcssa); //@line 1158
 $135 = (_SDL_GetTicks() | 0) - $131 | 0; //@line 1160
 _printf(304, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempVarArgs >> 2] = $135, tempVarArgs) | 0) | 0; //@line 1161
 STACKTOP = tempVarArgs; //@line 1161
 _SDL_Quit(); //@line 1162
 $_0 = 0; //@line 1164
 STACKTOP = sp; //@line 1166
 return $_0 | 0; //@line 1167
}
function _memset(ptr, value, num) {
 ptr = ptr | 0;
 value = value | 0;
 num = num | 0;
 var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
 stop = ptr + num | 0; //@line 5077
 if ((num | 0) >= 20) {
  value = value & 255; //@line 5080
  unaligned = ptr & 3; //@line 5081
  value4 = value | value << 8 | value << 16 | value << 24; //@line 5082
  stop4 = stop & ~3; //@line 5083
  if (unaligned) {
   unaligned = ptr + 4 - unaligned | 0; //@line 5085
   while ((ptr | 0) < (unaligned | 0)) {
    HEAP8[ptr] = value; //@line 5087
    ptr = ptr + 1 | 0; //@line 5088
   }
  }
  while ((ptr | 0) < (stop4 | 0)) {
   HEAP32[ptr >> 2] = value4; //@line 5092
   ptr = ptr + 4 | 0; //@line 5093
  }
 }
 while ((ptr | 0) < (stop | 0)) {
  HEAP8[ptr] = value; //@line 5097
  ptr = ptr + 1 | 0; //@line 5098
 }
}
function _memcpy(dest, src, num) {
 dest = dest | 0;
 src = src | 0;
 num = num | 0;
 var ret = 0;
 ret = dest | 0; //@line 5050
 if ((dest & 3) == (src & 3)) {
  while (dest & 3) {
   if ((num | 0) == 0) return ret | 0; //@line 5053
   HEAP8[dest] = HEAP8[src] | 0; //@line 5054
   dest = dest + 1 | 0; //@line 5055
   src = src + 1 | 0; //@line 5056
   num = num - 1 | 0; //@line 5057
  }
  while ((num | 0) >= 4) {
   HEAP32[dest >> 2] = HEAP32[src >> 2]; //@line 5060
   dest = dest + 4 | 0; //@line 5061
   src = src + 4 | 0; //@line 5062
   num = num - 4 | 0; //@line 5063
  }
 }
 while ((num | 0) > 0) {
  HEAP8[dest] = HEAP8[src] | 0; //@line 5067
  dest = dest + 1 | 0; //@line 5068
  src = src + 1 | 0; //@line 5069
  num = num - 1 | 0; //@line 5070
 }
 return ret | 0; //@line 5072
}
function copyTempDouble(ptr) {
 ptr = ptr | 0;
 HEAP8[tempDoublePtr] = HEAP8[ptr]; //@line 32
 HEAP8[tempDoublePtr + 1 | 0] = HEAP8[ptr + 1 | 0]; //@line 33
 HEAP8[tempDoublePtr + 2 | 0] = HEAP8[ptr + 2 | 0]; //@line 34
 HEAP8[tempDoublePtr + 3 | 0] = HEAP8[ptr + 3 | 0]; //@line 35
 HEAP8[tempDoublePtr + 4 | 0] = HEAP8[ptr + 4 | 0]; //@line 36
 HEAP8[tempDoublePtr + 5 | 0] = HEAP8[ptr + 5 | 0]; //@line 37
 HEAP8[tempDoublePtr + 6 | 0] = HEAP8[ptr + 6 | 0]; //@line 38
 HEAP8[tempDoublePtr + 7 | 0] = HEAP8[ptr + 7 | 0]; //@line 39
}
function copyTempFloat(ptr) {
 ptr = ptr | 0;
 HEAP8[tempDoublePtr] = HEAP8[ptr]; //@line 25
 HEAP8[tempDoublePtr + 1 | 0] = HEAP8[ptr + 1 | 0]; //@line 26
 HEAP8[tempDoublePtr + 2 | 0] = HEAP8[ptr + 2 | 0]; //@line 27
 HEAP8[tempDoublePtr + 3 | 0] = HEAP8[ptr + 3 | 0]; //@line 28
}
function stackAlloc(size) {
 size = size | 0;
 var ret = 0;
 ret = STACKTOP; //@line 3
 STACKTOP = STACKTOP + size | 0; //@line 4
 STACKTOP = STACKTOP + 7 >> 3 << 3; //@line 5
 return ret | 0; //@line 6
}
function _strlen(ptr) {
 ptr = ptr | 0;
 var curr = 0;
 curr = ptr; //@line 5041
 while (HEAP8[curr] | 0) {
  curr = curr + 1 | 0; //@line 5043
 }
 return curr - ptr | 0; //@line 5045
}
function setThrew(threw, value) {
 threw = threw | 0;
 value = value | 0;
 if ((__THREW__ | 0) == 0) {
  __THREW__ = threw; //@line 19
  threwValue = value; //@line 20
 }
}
function dynCall_iii(index, a1, a2) {
 index = index | 0;
 a1 = a1 | 0;
 a2 = a2 | 0;
 return FUNCTION_TABLE_iii[index & 1](a1 | 0, a2 | 0) | 0; //@line 5123
}
function dynCall_ii(index, a1) {
 index = index | 0;
 a1 = a1 | 0;
 return FUNCTION_TABLE_ii[index & 1](a1 | 0) | 0; //@line 5109
}
function dynCall_vi(index, a1) {
 index = index | 0;
 a1 = a1 | 0;
 FUNCTION_TABLE_vi[index & 1](a1 | 0); //@line 5130
}
function b2(p0, p1) {
 p0 = p0 | 0;
 p1 = p1 | 0;
 abort(2); //@line 5135
 return 0; //@line 5135
}
function dynCall_v(index) {
 index = index | 0;
 FUNCTION_TABLE_v[index & 1](); //@line 5116
}
function setTempRet9(value) {
 value = value | 0;
 tempRet9 = value; //@line 89
}
function setTempRet8(value) {
 value = value | 0;
 tempRet8 = value; //@line 84
}
function setTempRet7(value) {
 value = value | 0;
 tempRet7 = value; //@line 79
}
function setTempRet6(value) {
 value = value | 0;
 tempRet6 = value; //@line 74
}
function setTempRet5(value) {
 value = value | 0;
 tempRet5 = value; //@line 69
}
function setTempRet4(value) {
 value = value | 0;
 tempRet4 = value; //@line 64
}
function setTempRet3(value) {
 value = value | 0;
 tempRet3 = value; //@line 59
}
function setTempRet2(value) {
 value = value | 0;
 tempRet2 = value; //@line 54
}
function setTempRet1(value) {
 value = value | 0;
 tempRet1 = value; //@line 49
}
function setTempRet0(value) {
 value = value | 0;
 tempRet0 = value; //@line 44
}
function b0(p0) {
 p0 = p0 | 0;
 abort(0); //@line 5133
 return 0; //@line 5133
}
function stackRestore(top) {
 top = top | 0;
 STACKTOP = top; //@line 13
}
function _quit() {
 _SDL_Quit(); //@line 1174
 _exit(1); //@line 1175
}
function b3(p0) {
 p0 = p0 | 0;
 abort(3); //@line 5136
}
function stackSave() {
 return STACKTOP | 0; //@line 9
}
function b1() {
 abort(1); //@line 5134
}
function runPostSets() {
}
// EMSCRIPTEN_END_FUNCS
  var FUNCTION_TABLE_ii = [b0,b0];
  var FUNCTION_TABLE_v = [b1,b1];
  var FUNCTION_TABLE_iii = [b2,b2];
  var FUNCTION_TABLE_vi = [b3,b3];
  return { _strlen: _strlen, _free: _free, _main: _main, _memset: _memset, _malloc: _malloc, _memcpy: _memcpy, runPostSets: runPostSets, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, setThrew: setThrew, setTempRet0: setTempRet0, setTempRet1: setTempRet1, setTempRet2: setTempRet2, setTempRet3: setTempRet3, setTempRet4: setTempRet4, setTempRet5: setTempRet5, setTempRet6: setTempRet6, setTempRet7: setTempRet7, setTempRet8: setTempRet8, setTempRet9: setTempRet9, dynCall_ii: dynCall_ii, dynCall_v: dynCall_v, dynCall_iii: dynCall_iii, dynCall_vi: dynCall_vi };
})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_ii": invoke_ii, "invoke_v": invoke_v, "invoke_iii": invoke_iii, "invoke_vi": invoke_vi, "_strncmp": _strncmp, "_SDL_Flip": _SDL_Flip, "_sysconf": _sysconf, "_SDL_MapRGB": _SDL_MapRGB, "_abort": _abort, "_fprintf": _fprintf, "_printf": _printf, "_SDL_UpdateRects": _SDL_UpdateRects, "_fflush": _fflush, "_SDL_LockSurface": _SDL_LockSurface, "__reallyNegative": __reallyNegative, "_SDL_SetVideoMode": _SDL_SetVideoMode, "_strtol": _strtol, "_SDL_DisplayFormatAlpha": _SDL_DisplayFormatAlpha, "_SDL_UnlockSurface": _SDL_UnlockSurface, "___setErrNo": ___setErrNo, "_fwrite": _fwrite, "_SDL_RWFromFile": _SDL_RWFromFile, "_send": _send, "_write": _write, "_fputs": _fputs, "_SDL_UpperBlit": _SDL_UpperBlit, "_SDL_Quit": _SDL_Quit, "_exit": _exit, "_SDL_UpdateRect": _SDL_UpdateRect, "_SDL_GetError": _SDL_GetError, "_isspace": _isspace, "__parseInt": __parseInt, "_fputc": _fputc, "_llvm_dbg_value": _llvm_dbg_value, "__formatString": __formatString, "_IMG_Load_RW": _IMG_Load_RW, "_SDL_SetColors": _SDL_SetColors, "_SDL_GetTicks": _SDL_GetTicks, "_SDL_WM_SetCaption": _SDL_WM_SetCaption, "_pwrite": _pwrite, "_puts": _puts, "_sbrk": _sbrk, "_SDL_Init": _SDL_Init, "___errno_location": ___errno_location, "_atoi": _atoi, "_SDL_FreeSurface": _SDL_FreeSurface, "_time": _time, "__exit": __exit, "_SDL_FreeRW": _SDL_FreeRW, "_strcmp": _strcmp, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "NaN": NaN, "Infinity": Infinity, "_stderr": _stderr }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _main = Module["_main"] = asm["_main"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
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
dependenciesFulfilled = function() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun && shouldRunNow) run();
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
//@ sourceMappingURL=testwin.c.js.map