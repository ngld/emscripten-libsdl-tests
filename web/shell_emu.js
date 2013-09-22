var term, term_cw, term_ch, term_locked = false, term_line = '', term_cwd = '/logs', _prompt = '', prompt_pos = 0, history = [], history_idx = 0, cur_history = '', cmpl_sugg = null;

function initTerm() {
    $('.terminal-win').show();

    var ref = $('.terminal-cont');
    ref.html('<span>#</span>');
    var term_cw = ref.find('span').width(), term_ch = ref.find('span').height() + 3;
    ref.html('');
    
    // Forcefully enable boldness, even if it's broken (in the browser).
    Terminal.brokenBold = false;
    term = new Terminal({
       geometry: [Math.floor((ref.width() - 3) / term_cw), Math.floor(($('.terminal-win').height() - 30) / term_ch)],
       useStyle: true,
       //colors: Terminal.tangoColors
    });
    term.open($('.terminal-cont')[0]);
    term.on('data', function (key) {
        if(!term_locked) {
            if(cmpl_sugg !== null && key != '\t') cmpl_sugg = null;
            switch(key) {
                case '\x1bOH':
                    // Home
                    if(prompt_pos > 0) {
                        term.write('\x1b[' + prompt_pos + 'D');
                        prompt_pos = 0;
                    }
                break;
                case '\x1bOF':
                    // End
                    if(prompt_pos < term_line.length) {
                        term.write('\x1b[' + (term_line.length - prompt_pos) + 'C');
                        prompt_pos = term_line.length;
                    }
                break;
                case '\x7f':
                    // Backspace
                    if(prompt_pos > 0) {
                        term_line = term_line.substr(0, prompt_pos - 1) + term_line.substr(prompt_pos);
                        term.write('\x1b[s');
                        term.write("\x1b[2K\r" + _prompt + term_line);
                        term.write('\x1b[u\x1b[D');
                        prompt_pos--;
                    }
                break;
                case '\x1b[3~':
                    // Delete
                    if(prompt_pos < term_line.length) {
                        term_line = term_line.substr(0, prompt_pos) + term_line.substr(prompt_pos + 1);
                        term.write('\x1b[s');
                        term.write("\x1b[2K\r" + _prompt + term_line);
                        term.write('\x1b[u');
                    }
                break;
                case '\x1b[D':
                    // left-arrow
                    if(prompt_pos > 0) {
                        prompt_pos--;
                        term.write(key);
                    }
                    break;
                case '\x1b[C':
                    // right-arrow
                    if(prompt_pos < term_line.length) {
                        prompt_pos++;
                        term.write(key);
                    }
                    break;
                case '\x1b[A':
                    // up-arrow
                    if(history_idx > 0) {
                        if(history_idx == history.length) {
                            cur_history = term_line;
                        }
                        history_idx--;
                        term_line = history[history_idx];
                        prompt_pos = term_line.length;
                        
                        term.write('\x1b[2K\r' + _prompt + term_line);
                    }
                    break;
                case '\x1b[B':
                    // down-arrow
                    if(history_idx < history.length - 1) {
                        history_idx++;
                        term_line = history[history_idx];
                        prompt_pos = term_line.length;
                        
                        term.write('\x1b[2K\r' + _prompt + term_line);
                    } else if(history_idx == history.length - 1) {
                        history_idx++;
                        
                        term_line = cur_history;
                        prompt_pos = term_line.length;
                        
                        term.write('\x1b[2K\r' + _prompt + term_line);
                    }
                    break;
                case '\t':
                    // Tab
                    autoComplete();
                break;
                case "\r":
                    // Enter
                    term.write("\r\n");
                    if(term_line == '') {
                        promptTerm();
                    } else {
                        termCmd(term_line);
                    }
                break;
                case '\x1b':
                    // Escape
                    $('.terminal-win').modal('hide');
                break;
                default:
                    if(key.substr(0, 1) == '\x1b') key = '^' + key.substr(1);
                    if(prompt_pos == term_line.length) {
                        term_line += key;
                        term.write(key);
                    } else {
                        term_line = term_line.substr(0, prompt_pos) + key + term_line.substr(prompt_pos);
                        term.write('\x1b[s');
                        term.write('\r' + _prompt + term_line);
                        term.write('\x1b[u\x1b[C');
                    }
                    prompt_pos += key.length;
                break;
            }
        }
    });
    
    $('.terminal-win').hide();
    promptTerm();
    
    $('.terminal-win').on('show.bs.modal', function () {
        setTimeout(function () {
            // Wait for the transition to finish and then trigger focus ther terminal.
            term.element.focus();
            term.focus();
        }, 300);
    });
    $('.terminal-win').on('hide.bs.modal', function () {
        term.blur();
    });
}

function resizeTerm() {
    // Doesn't work...
    //term.resize(Math.floor(($('.terminal-win').width() - 3) / term_cw), Math.floor(($('.terminal-win').height() - 15) / term_ch));
}

function promptTerm() {
    term.write(_prompt = term_cwd + '# ');
    term_locked = false;
    term_line = '';
    prompt_pos = 0;
    cur_history = '';
}

function lockTerm() {
    term_locked = true;
}

function resolvPath(path) {
    if(path[0] != '/') {
        path = term_cwd + '/' + path;
    }
    
    path = path.split('/');
    var out_path = [];
    for(var i = 0; i < path.length; i++) {
        switch(path[i].trim()) {
            case '':
            case '.':
            case ' ':
            break;
            case '..':
                out_path.pop();
            break;
            default:
                out_path.push(path[i]);
            break;
        }
    }
    
    return '/' + out_path.join('/');
}

function autoComplete() {
    function showSugg() {
        cmpl_sugg[0]++;
        if(cmpl_sugg[0] >= cmpl_sugg[1].length) cmpl_sugg[0] = 0;
        term_line = term_line.substr(0, prompt_pos) + cmpl_sugg[1][cmpl_sugg[0]];
        var out = _prompt + term_line;
        term.write('\x1b[2K\x1b[s\r' + out + '\x1b[u');
    }
    
    if(cmpl_sugg !== null) {
        showSugg();
        return;
    }
    
    var line = term_line.substr(0, prompt_pos).split(' ');
    var item = line.pop();
    
    if(item.indexOf('/') > -1) {
        var path = item.split('/');
        item = path.pop();
        path = resolvPath(path.join('/'));
    } else {
        var path = resolvPath('.');
    }
    
    var items = termLs(path, false, true);
    var suggests = [];
    $.each(items, function (i, line) {
        if(line.substr(0, item.length) == item) suggests.push(line.substr(item.length));
    });
    
    if(suggests.length == 0) return;
    cmpl_sugg = [-1, suggests];
    showSugg();
}

function termCmd(cmd) {
    term_locked = true;
    history.push(cmd);
    history_idx = history.length;
    
    cmd = cmd.split(' ');
    switch(cmd[0]) {
        case 'exit':
            $('.terminal-win').modal('hide');
            promptTerm();
        break;
        case 'll':
        case 'ls':
            if(cmd.length > 1) {
                if(cmd[1] == '-l' || cmd[1] == '--long') {
                    cmd[0] = 'll';
                    cmd.splice(1, 1);
                }
            }
            
            if(cmd.length == 1) {
                var dir = term_cwd;
            } else {
                var dir = resolvPath(cmd[1]);
            }
            
            termLs(dir, cmd[0] == 'll');
        break;
        case 'cd':
            if(cmd.length < 2) {
                var dir = '/';
            } else {
                var dir = resolvPath(cmd[1]);
            }
            
            if(dir != '/build' && dir != '/logs' && dir != '/tests' && dir != '/') {
                term.writeln('cd: Directory not found!');
            } else {
                term_cwd = dir;
            }
            promptTerm();
        break;
        case 'cat':
            if(cmd.length < 2) {
                term.writeln('cat: No file supplied!');
                promptTerm();
                break;
            }
            
            showLog(resolvPath(cmd[1]));
        break;
        case 'emcc':
            runEmcc(cmd.slice(1));
        break;
        case 'clear':
            term.write('\x1b[H\x1b[2J');
            promptTerm();
        break;
        default:
            if(cmd[0][0] == '.' || cmd[0][0] == '/') {
                var path = resolvPath(cmd[0]);
                if(path.substr(-3) == '.js') {
                    runTest(path);
                } else {
                    term.writeln(path + ': File not found or not executable!');
                    promptTerm();
                }
            } else {
                term.writeln('Command "' + cmd[0] + '" wasn\'t found!');
                promptTerm();
            }
        break;
    }
}

function termLs(path, long, return_) {
    var out = [];
    switch(path) {
        case '/':
            out.push('build/');
            out.push('logs/');
            out.push('tests/');
        break;
        case '/build':
            $('tr.can-run').each(function () {
                var $this = $(this);
                out.push($this.find('.name').text() + '.js');
            });
        break;
        case '/logs':
            $('tr.has-log').each(function () {
                var $this = $(this);
                out.push($this.find('.name').text() + '.log');
            });
        break;
        case '/tests':
            $('tr').each(function () {
                var $this = $(this);
                out.push($this.find('.name').text());
            });
        break;
    }
    if(return_) {
        return out;
    } else {
        $.each(out, function (i, line) { term.writeln(line); });
        promptTerm();
    }
}

function showLog(path) {
    if(path.indexOf('/logs/') != 0) {
        term.writeln('cat: File not found!');
        promptTerm();
        return;
    }
    
    $.get('build/' + path.substring(6) + '?' + $.now(), function (content) {
        term.write(content.replace(/\n/g, '\r\n'));
        promptTerm();
    });
}

function runTest(path) {
    if(path.indexOf('/build/') != 0) {
        term.writeln('cat: File not found!');
        promptTerm();
        return;
    }
    
    var name = path.substring(7);
    getRow(name).find('.actions .run').click();
    promptTerm();
}

function runEmcc(args) {
    if($('.runner-compile').length == 0) {
        term.writeln('emcc: Not found!');
        promptTerm();
        return;
    }
    
    $.get('emcc_full/' + args.join(' '), function (output) {
        term.write(output.replace(/\n/g, '\r\n'));
        promptTerm();
    }).fail(function () {
        term.writeln('emcc: Call failed!');
        promptTerm();
    });
}