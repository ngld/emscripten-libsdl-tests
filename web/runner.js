(function () {
    var term, term_cw, term_ch, term_locked = false, term_line = '', term_cwd = '/', prompt_pos = 0;
    
    function initTerm() {
        $('.log-viewer').show();

        var ref = $('.terminal-cont');
        ref.html('<span>#</span>');
        var term_cw = ref.find('span').width(), term_ch = ref.find('span').height() + 3;
        ref.html('');
        
        term = new Terminal({
           geometry: [Math.floor((ref.width() - 3) / term_cw), Math.floor(($('.log-viewer').height() - 15) / term_ch)],
           useStyle: true
        });
        term.open($('.terminal-cont')[0]);
        term.on('data', function (key) {
            if(!term_locked) {
                switch(key) {
                    case '\x7f':
                        // Backspace
                        term_line = term_line.substr(0, prompt_pos - 2) + term_line.substr(prompt_pos);
                        term.write("\r" + _prompt + term_line + ' \x1b[D');
                        prompt_pos--;
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
                    case "\r":
                        term.write("\r\n");
                        termCmd(term_line);
                    break;
                    default:
                        if(prompt_pos == term_line.length) {
                            term_line += key;
                            term.write(key);
                        } else {
                            term_line = term_line.substr(0, prompt_pos) + key + term_line.substr(prompt_pos);
                            term.write('\r' + _prompt + term_line);
                        }
                        prompt_pos++;
                    break;
                }
            }
        });
        
        $('.log-viewer').hide();
    }
    
    function resizeTerm() {
        term.resize(Math.floor(($('.log-viewer').width() - 3) / term_cw), Math.floor(($('.log-viewer').height() - 15) / term_ch));
    }
    
    function promptTerm() {
        term.write(_prompt = term_cwd + '# ');
        term_locked = false;
        term_line = '';
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
    
    function termCmd(cmd) {
        term_locked = true;
        cmd = cmd.split(' ');
        switch(cmd[0]) {
            case 'exit':
                $('.log-viewer').hide();
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
                
                if(dir != '/tests' && dir != '/logs' && dir != '/') {
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
            default:
                var path = resolvPath(cmd[0]);
                if(path.substr(-3) == '.js') {
                    runTest(path);
                } else {
                    term.writeln(path + ': File not found or not executable!');
                }
                promptTerm();
            break;
        }
    }
    
    function termLs(path, long) {
        switch(path) {
            case '/':
                term.writeln('tests/');
                term.writeln('logs/');
            break;
            case '/tests':
                $('tr.can-run').each(function () {
                    var $this = $(this);
                    term.writeln($this.find('.name').text() + '.js');
                });
            break;
            case '/logs':
                $('tr.has-log').each(function () {
                    var $this = $(this);
                    term.writeln($this.find('.name').text() + '.log');
                });
            break;
        }
        promptTerm();
    }
    
    function showLog(path) {
        if(path.indexOf('/logs/') != 0) {
            term.writeln('cat: File not found!');
            promptTerm();
            return;
        }
        
        $.get('tests/' + path.substring(6), function (content) {
            term.writeln(content);
            promptTerm();
        });
    }
    
    function runTest(path) {
        if(path.indexOf('/tests/') != 0) {
            term.writeln('cat: File not found!');
            promptTerm();
            return;
        }
        
        location.href = 'shell.html#tests/' + path.substring(7);
    }
    
    //  ========/ Term
    
    function getRow(name) {
        var found = false, row;
        $('td.name').each(function () {
            var $this = $(this);
            if($this.text() == name) {
                found = true;
                row = $this.parents('tr');
                return false;
            }
        });
        
        if(!found) {
            row = $('<tr>').appendTo('table');
            row.append($('<td class="name">').text(name));
            row.append('<td class="built">?</td><td class="run">?</td><td class="actions"> </td>');
        }
        return row;
    }
    
    function runTests() {
        $('#test-frame, #test-display').show();
        $('#test-display .progress').addClass('active');
        $('#test-display .progress-bar').css('width', '0%');
        
        var tests = [], idx = -1;
        $('tr.can-run').each(function () {
            var row = $(this);
            tests.push([row.find('.name').text(), row]);
        });
        
        function next(result, msg) {
            if(idx != -1) {
                if(result) {
                    tests[idx][1].addClass('success').find('.run').text('Success!');
                } else {
                    tests[idx][1].addClass('warning').find('.run').text('Fail!');
                }
                if(msg) {
                    tests[idx][1].find('.run').append(' ').append($('<pre>').html(msg));
                }
            }
            idx++;
            if(idx == tests.length) {
                $('#test-display .progress').removeClass('active');
                $('#test-frame, #test-display').hide();
                $('#test-frame').attr('src', 'shell.html');
                
                window.testResult = null;
                return;
            }
            
            $('#test-display .progress-bar').css('width', (100 * idx / tests.length) + '%');
            $('#test-frame').attr('src', 'shell.html?' + $.now() + '#tests/' + tests[idx][0] + '.js');
            
            var my_idx = idx;
            setTimeout(function () {
                if(idx == my_idx) {
                    // Timeout
                    next(false);
                }
            }, 20000);
        }
        window.testResult = next;
        next(true);
    }
    
    $(function () {
        $.getJSON('tests/index.json', function (flist) {
            var list = $('table');
            
            flist.files.sort();
            $.each(flist.files, function (i, name) {
                if(name.match(/\.js$/)) {
                    var name = /^(.*)\.js$/.exec(name)[1];
                    var row = getRow(name);
                    
                    row.removeClass('danger');
                    row.addClass('can-run');
                    row.find('.built').html('Success');
                    row.find('.run').html('?');
                    row.find('.actions').append(' <a href="#" class="run-test">Run Test</a>');
                } else if(name.match(/\.log$/)) {
                    var name = /^(.*)\.log$/.exec(name)[1];
                    var row = getRow(name);
                    
                    row.addClass('has-log');
                    if(row.find('.built').text() == '?') {
                        row.addClass('danger');
                        row.find('.built').html('Fail');
                        row.find('.run').html('N/A');
                    }
                    row.find('.actions').append(' <a href="#" class="log">Show Log</a>');
                }
            });

            $('.run-test').click(function (e) {
                e.preventDefault();
                
                var row = $(this).parents('tr');
                var name = row.find('.name').text();
                
                window.testResult = function (result, msg) {
                    if(result) {
                        row.addClass('success').find('.run').text('Success!');
                    } else {
                        row.addClass('warning').find('.run').text('Fail!');
                    }
                    if(msg) {
                        row.find('.run').append(' ').append($('<pre>').html(msg));
                    }
                };
                
                $('#test-frame, #test-display').show();
                $('#test-frame').attr('src', 'shell.html?' + $.now() + '#tests/' + name + '.js');
            });
            
            $('.log').click(function (e) {
                e.preventDefault();
                
                var name = $(this).parents('tr').find('.name').text();
                $('.log-viewer').modal('show');
                term.write('# cat ' + name + '.log\r\n');
                
                $.get('tests/' + name + '.log', function (data) {
                    term.write(data.replace(/\n/g, '\r\n'));
                    promptTerm();
                });
            });
            
            $('.runner-go').click(function (e) {
                e.preventDefault();
                runTests();
            })
            
            $('.test-back').click(function (e) {
                e.preventDefault();
                $('#test-frame, #test-display').hide();
            })
            
            $('.loading').remove();
        });
        
        initTerm();
        
        $(window).resize(function () {
            resizeTerm();
            $('#test-frame').css({
                width: $('body').width() + 'px',
                height: $('body').height() - 63 + 'px'
            });
        });
        
        $(window).load(function () {
            setTimeout(function () { $(window).resize(); }, 1);
        });
    });
})();