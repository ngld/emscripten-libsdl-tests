(function () {
    var can_compile = true;
    
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
            row.append('<td class="built">?</td><td class="run">?</td><td class="actions"><a href="#" class="compile">Compile test<br></a></td>');
        }
        return row;
    }
    
    function buildTable(cb) {
        $.get('build/index.txt?' + $.now(), function (files) {
            var list = $('table');
            var files = files.split("\n");
            files.sort();
            
            $.each(files, function (i, name) {
                if(name.match(/\.js$/)) {
                    var name = /^(.*)\.js$/.exec(name)[1];
                    var row = getRow(name);
                    
                    if(row.hasClass('has-log')) {
                        row.removeClass('danger');
                    }
                    
                    if(!row.hasClass('can-run')) {
                        row.addClass('can-run');
                        row.find('.built').html('Success');
                        row.find('.run').html('?');
                        row.find('.actions').append('<a href="#" class="run-test">Run test</a><br><a href="#" class="clear-rlog">Clear run log</a><br>');
                    }
                } else if(name.match(/\.log$/)) {
                    var name = /^(.*)\.log$/.exec(name)[1];
                    var row = getRow(name);
                    
                    if(!row.hasClass('can-run')) {
                        row.addClass('danger');
                        row.find('.built').html('Fail');
                        row.find('.run').html('N/A');
                    }
                    
                    if(!row.hasClass('has-log')) {
                        row.addClass('has-log');
                        row.find('.actions').append('<a href="#" class="log">Show build log</a><br>');
                    }
                }
            });
            
            if(cb) cb();
        });
    }
    
    function compileTests() {
        $('#test-display .controls').hide();
        $('#test-display').show();
        $('#test-display .progress').addClass('active');
        $('#test-display .progress-bar').css('width', '0%');
        $('.terminal-win').modal('show');
        term.write('\x1b[H\x1b[2J\x1b[5;1H');
        lockTerm();
        
        var idx = -1, tests = [];
        
        function next() {
            idx++;
            $('#test-display .progress-bar').css('width', (100 * idx / tests.length) + '%');
            $('#test-name').text(tests[idx]);
            
            if(idx == tests.length) {
                location.reload();
                return;
            }
            
            var test = tests[idx];
            term.writeln('Compiling ' + test + '...');
            $.get('emcc/' + test, function (result) {
                $.get('build/' + test + '.log', function (log) {
                    term.write(log.replace(/\n/g, '\r\n'));
                    next();
                });
            });
        }
        
        $('#test-name').text('Please wait...');
        $.get('tests/index.txt?' + $.now(), function (files) {
            $.each(files.split('\n'), function (i, file) {
                if(file.match(/\.test$/)) {
                    tests.push(file);
                }
            });
            
            next();
        });
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
                    tests[idx][1].removeClass('warning').addClass('success').find('.run').text('Success!');
                } else {
                    tests[idx][1].removeClass('success').addClass('warning').find('.run').text('Fail!');
                }
                if(msg) {
                    tests[idx][1].find('.run').append(' ').append($('<pre>').html(msg));
                }
            }
            idx++;
            if(idx == tests.length) {
                $('#test-display .progress-bar').css('width', '100%');
                $('#test-display .progress').removeClass('active');
                $('#test-frame, #test-display').hide();
                $('#test-frame').attr('src', 'shell.html');
                
                window.testResult = null;
                $('.test-result').text($('tr.can-run.success').length + ' of ' + ($('tr').length - 1) + ' tests passed, ' + ($('tr:not(.can-run)').length) + ' failed to build.');
                return;
            }
            
            $('#test-display .progress-bar').css('width', (100 * idx / tests.length) + '%');
            $('#test-frame').attr('src', 'shell.html?' + $.now() + '#' + tests[idx][0] + '.js').focus();
            $('#test-name').text(tests[idx][0]);
            
            var my_idx = idx;
            setTimeout(function () {
                if(idx == my_idx) {
                    // Timeout
                    next(false, 'Timeout!');
                }
            }, 60000);
        }
        window.testResult = next;
        next(true);
    }
    
    $(function () {
        buildTable(function () {
            $('.test-result').text('Ready.');
            if(!can_compile) $('.compile').remove();
        });
        
        $('body').on('click', '.run-test', function (e) {
            e.preventDefault();
            
            var row = $(this).parents('tr');
            var name = row.find('.name').text();
            
            window.testResult = function (result, msg) {
                if(result) {
                    row.removeClass('warning').addClass('success').find('.run').text('Success!');
                } else {
                    row.removeClass('success').addClass('warning').find('.run').text('Fail!');
                }
                if(msg) {
                    row.find('.run').append(' ').append($('<pre>').html(msg));
                }
            };
            
            $('#test-frame, #test-display').show();
            $('#test-frame').attr('src', 'shell.html?' + $.now() + '#' + name + '.js').focus();
            $('#test-name').text(name);
        });
        
        $('body').on('click', '.clear-rlog', function (e) {
            e.preventDefault();
            
            $(this).parents('tr').find('.run pre').remove();
        });
        
        $('body').on('click', '.log', function (e) {
            e.preventDefault();
            
            var name = $(this).parents('tr').find('.name').text();
            $('.terminal-win').modal('show');
            
            term_cwd = '/logs';
            term.write('\x1b[H\x1b[2J');
            term.write('/logs# cat ' + name + '.log\r\n');
            
            $.get('build/' + name + '.log', function (data) {
                term.write(data.replace(/\n/g, '\r\n'));
                promptTerm();
            });
        });
        
        $('body').on('click', '.compile', function (e) {
            e.preventDefault();
            
            var $this = $(this);
            var name = $this.parents('tr').find('.name').text();
            var cap = $this.html();
            $this.html('Compiling...<br>');
            
            $.get('emcc/' + name, function (out) {
                var row = getRow(name);
                if(out != 'success') {
                    row.find('.actions .log').click();
                } else {
                    if(!row.hasClass('can-run')) {
                        row.removeClass('danger').addClass('can-run');
                        row.find('.built').text('Success');
                        row.find('.run').text('?');
                        row.find('.actions').append('<a href="#" class="run-test">Run test</a><br><a href="#" class="clear-rlog">Clear run log</a><br>');
                    }
                }
                $this.html(cap);
            }).fail(function () {
                $this.html('Failed!<br>');
            });
        })
        
        $('#test-display .progress, #test-back').click(function (e) {
            e.preventDefault();
            $('#test-frame, #test-display').hide();
        });
        
        $('#test-rerun').click(function (e) {
            e.preventDefault();
            var frame = $('#test-frame');
            frame.attr('src', frame.attr('src').replace(/\.html\?.*#/, '.html?' + $.now() + '#')).focus();
        });
        
        $('#test-compile').click(function (e) {
            e.preventDefault();
           
            var $this = $(this);
            var cap = $this.text();
            $this.text('Compiling...');
            
            $.get('emcc/' + $('#test-name').text(), function (out) {
                if(out == 'success') {
                    var frame = $('#test-frame');
                    frame.attr('src', frame.attr('src').replace(/\.html\?.*#/, '.html?' + $.now() + '#')).focus();
                } else {
                    getRow($('#test-name').text()).find('.actions .log').click();
                }
                
                $this.text(cap);
            }).fail(function () {
                $this.text('Failed! Please see the console for more details.');
            });
        });
        
        $('.runner-go').click(function (e) {
            e.preventDefault();
            runTests();
        });
        
        $('.runner-compile').click(function (e) {
            e.preventDefault();
            compileTests();
        });
        
        $('.runner-console').click(function (e) {
            e.preventDefault();
            $('.terminal-win').modal('show');
        });
        
        $('body').on('click', '.stack-line', function (e) {
            var context = $(this).find('.context');
            
            if(context.length == 0) return;
            if(context.is(':visible')) {
                context.hide();
            } else {
                context.show();
            }
        });
        
        $.get('build/emcc_version.txt?' + $.now(), function (ver) {
            var ver = ver.split('\n');
            if(ver.length > 1 && ver[1] == 'can compile') {
                $('#test-compile').show();
                can_compile = true;
            } else {
                $('.runner-compile').remove();
                $('.compile').remove();
                can_compile = false;
            }
            $('.emcc-version').text(ver[0]);
        });
        
        initTerm();
        
        $(window).resize(function () {
            resizeTerm();
            $('#test-frame').css({
                width: $(window).width() + 'px',
                height: $(window).height() - 63 + 'px'
            });
        });
        
        $(window).load(function () {
            setTimeout(function () { $(window).resize(); }, 1);
        });
    });
})();