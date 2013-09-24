var reported = false;

$('body').on('click', '.stack-line', function (e) {
    var context = $(this).find('.context');
    
    if(context.length == 0) return;
    if(context.is(':visible')) {
        context.hide();
    } else {
        context.show();
    }
});

function report(result) {
  if(!reported && typeof top != 'undefined' && top.testResult) {
    top.testResult(result, $('#output').html());
    reported = true;
  }
}

function makeMainWrapper(_callMain) {
  return function callMain() {
    try {
      _callMain.apply(this, arguments);
      
      if(!Module.noExitRuntime) {
        report(EXITSTATUS === 0);
      }
    } catch(e) {
      if(typeof e == 'string') e = new Error('String error: ' + e);
      TraceKit.report(e);
      
      if(typeof console != 'undefined') {
        console.log(e);
      }
    }
  };
}

function makeAbortWrapper(_abort) {
  return function abort() {
    try {
      _abort.apply(this, arguments);
    } catch(e) {
      if(typeof e == 'string') e = new Error(e);
      TraceKit.report(e);
      throw e;
    }
  }
}

TraceKit.report.subscribe(function (exc) {
  if(!exc.name && !exc.message) {
    // Is this even a proper error?
    // NOTE: This happens when Emscripten launches the "SimulateInfiniteLoop" exception. Ignore it for now.
    return;
  }
  
  var msg = exc.name;
  if(exc.message) {
    msg += ': ' + (exc.message.indexOf('abort() at abort') > -1 ? 'abort()' : exc.message);
  }
  
  ABORT = 1;
  EXITSTATUS = 1;
  Module.printErr('\nFail: ' + msg);
  
  $.each(exc.stack, function (i, frame) {
    var file = frame.url;
    if(file) file = file.split('/').pop()
    var line = $('<div class="stack-line">').text(frame.func + '(' + (frame.args ? frame.args.join(', ') : '?') + ') at line ' + frame.line + ' in ' + file);
    $('#output').append(line);
    
    if(frame.context) {
      line.addClass('has-context');
      var context = $('<pre class="context">').appendTo(line);
      var offset = frame.line - Math.floor(frame.context.length / 2);
      var pad_count = (offset + frame.context.length + '').length - ('' + offset).length;
      var pad = '';
      for(var a = 0; a < pad_count; a++) pad += ' ';
      
      $.each(frame.context, function (i, line) {
        line = $('<div class="line">').text(pad + (offset + i) + ' ' + line).appendTo(context);
        if(offset + i == frame.line) line.addClass('middle');
      });
    }
    
    if(frame.func == 'callMain') {
      // Stop the stacktrace here. Only wrappers will come up, after all.
      return false;
    }
  });
  
  report(false);
});

// connect to canvas
var Module = {
  preRun: [function () {
    Module.callMain = makeMainWrapper(Module.callMain);
    Module.abort = abort = makeAbortWrapper(abort);
    Module.dynCall = TraceKit.wrap(Module.dynCall);
    
    Module.addRunDependency('load_fs');
    var path = location.hash.substr(1).replace(/\.test\.js$/, '.test');
    
    $.getJSON('tests/' + path + '?' + $.now(), function (data) {
      if(data.notes && data.notes != '') Module.print('Notes: ' + data.notes + '\n');
      
      $.each(data.files, function (i, name) {
        FS.createPreloadedFile('/', name, 'tests/' + name, true, false);
      });
      
      Module.removeRunDependency('load_fs');
    }).fail(function () {
      // We couldn't load the files list. There is probably none. Continue on.
      Module.removeRunDependency('load_fs');
    });
  }],
  postRun: [],
  print: function(text) {
    $('#output').append($('<span>').text(text)).append('<br>').scrollTop(9999999);
  },
  printErr: function(text) {
    $('#output').append($('<span class="error">').text(text)).append('<br>').scrollTop(9999999);
  },
  canvas: document.getElementById('canvas'),
  setStatus: function(text) {
    if (Module.setStatus.interval) clearInterval(Module.setStatus.interval);
    var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
    var statusElement = document.getElementById('status');
    var progressElement = document.getElementById('progress');
    if (m) {
      text = m[1];
      progressElement.value = parseInt(m[2])*100;
      progressElement.max = parseInt(m[4])*100;
      progressElement.hidden = false;
    } else {
      progressElement.value = null;
      progressElement.max = null;
      progressElement.hidden = true;
    }
    statusElement.innerHTML = text;
  },
  totalDependencies: 0,
  monitorRunDependencies: function(left) {
    this.totalDependencies = Math.max(this.totalDependencies, left);
    Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies-left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
  }
};
Module.setStatus('Downloading...');

if(location.hash && location.hash[0] == '#') {
  var path = location.hash.substr(1);
  // Manually add the tag to our head and avoid $.getScript() to prevent screwed stacktraces.
  // $('head').append($('<script type="text/javascript">').attr('src', 'build/' + path)); // This doesn't work...
  
  var tag = $('<script>')[0];
  tag.setAttribute('type', 'text/javascript');
  tag.setAttribute('src', 'build/' + path + '?' + $.now());
  $('head')[0].appendChild(tag);
}