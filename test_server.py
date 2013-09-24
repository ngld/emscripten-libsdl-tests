#!/bin/env python2

from __future__ import print_function
import sys, os, subprocess, webbrowser, SimpleHTTPServer, SocketServer, socket, tempfile, json, logging, argparse, urllib, shlex

PORT = 8080
TEST_PATH = os.path.abspath('.')
BUILD_PATH = os.path.join(os.path.dirname(__file__), 'build')

class Handler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def handle(self):
        try:
            SimpleHTTPServer.SimpleHTTPRequestHandler.handle(self)
        except KeyboardInterrupt:
            sys.exit(0)
    
    def send_head(self):
        if self.path[:6] == '/emcc/':
            self.handle_build(self.path[6:])
            return False
        
        if self.path[:11] == '/emcc_full/':
            self.emcc_full(self.path[11:])
            return False
        
        if self.path[:23] == '/build/emcc_version.txt':
            self.emcc_version()
            return False
        
        path = self.translate_path(self.path)
        
        if path[-10:] == '/index.txt':
            path = path[:-9]
            self.list_txt(path)
            return False
        
        return SimpleHTTPServer.SimpleHTTPRequestHandler.send_head(self)
    
    def translate_path(self, path):
        if path[:7] == '/tests/':
            return os.path.join(TEST_PATH, path[7:].split('?')[0])
        
        if path[:7] == '/build/':
            return os.path.join(BUILD_PATH, path[7:].split('?')[0])
        
        return SimpleHTTPServer.SimpleHTTPRequestHandler.translate_path(self, path)
    
    def list_txt(self, path):
        try:
            list_ = os.listdir(path)
        except os.error:
            logging.exception('Failed to get an index for %s.' % path)
            self.send_plain('')
            return None
        
        out = []
        for name in list_:
            itempath = os.path.join(path, name)
            if os.path.isfile(itempath):
                out.append(name)
        
        out = '\n'.join(out)
        
        self.send_response(200)
        encoding = sys.getfilesystemencoding()
        
        self.send_header("Content-type", "text/plain; charset=%s" % encoding)
        self.send_header("Content-Length", str(len(out)))
        self.end_headers()
        self.wfile.write(out)
    
    def run(self, cmd, **kwargs):
        logging.info('Running %s' % ' '.join(cmd))
        try:
            handle = subprocess.Popen(cmd, **kwargs)
            handle.wait()
        except:
            logging.exception('Command %s failed!' % ' '.join(cmd))
            return False
        
        return True
    
    def build_test(self, test, cflags=[], **p_opts):
        test = os.path.basename(urllib.unquote(test))
        srcfile = os.path.join(TEST_PATH, test)
        destfile = os.path.join(BUILD_PATH, test + '.js')
        logfile = os.path.join(BUILD_PATH, test + '.log')
        
        if not os.path.isfile(srcfile):
            return -1, None
        
        if os.path.isfile(destfile):
            os.unlink(destfile)
        if os.path.isfile(destfile + '.map'):
            os.unlink(destfile + '.map')
        
        meta = {
            'notes': '',
            'cflags': [],
            'code': [ test.replace('.test', '.c') ],
            'libs': [],
            'files': []
        }
        with open(srcfile, 'r') as stream:
            try:
                data = json.load(stream)
            except:
                logging.exception('Failed to parse %s.' % srcfile)
                return -1, None
        
        if len(data.keys()) < len(meta.keys()):
            meta.update(data)
            with open(srcfile, 'w') as stream:
                json.dump(meta, stream, indent=4, sort_keys=True)
        else:
            meta = data
        del data
        
        cflags = ['-Xclang', '-fcolor-diagnostics'] + cflags + meta['cflags']
        libs = meta['libs']
        logstream = None
        p_opts['cwd'] = TEST_PATH
        
        if 'log' in p_opts and p_opts['log']:
            del p_opts['log']
            
            logstream = open(logfile, 'wb')
            p_opts['stdout'] = logstream
            p_opts['stderr'] = subprocess.STDOUT
        
        for i, lib in enumerate(libs):
            libs[i] = lib
        
        if len(meta['code']) == 1:
            self.run(['emcc', '-o', destfile] + cflags + meta['code'] + libs, **p_opts)
        else:
            objs = []
            failed = False
            for source in meta['code']:
                fd, out = tempfile.mkstemp('.o')
                os.close(fd)
                if not self.run(['emcc', '-o', out, source] + cflags, **p_opts):
                    failed = True
                    break
                
                if not os.path.isfile(out):
                    failed = True
                    break
                
                objs.append(out)
            
            if not failed:
                self.run(['emcc', '-o', destfile] + cflags + objs + libs, **p_opts)
            
            for item in objs:
                os.unlink(item)
        
        if logstream != None:
            logstream.close()
        
        return destfile, logfile
    
    def handle_build(self, test):
        destfile, logfile = self.build_test(test, log=True)
        
        if destfile == -1:
            self.send_error(404, 'Test not found!')
            return
        
        if os.path.isfile(destfile):
            msg = 'success'
        else:
            msg = 'fail'
        
        self.send_plain(msg)
    
    def emcc_full(self, args):
        test = None
        args = shlex.split(urllib.unquote(args))
        i = len(args)
        for arg in reversed(args):
            i -= 1
            if arg[-6:] == '.test' and arg[0] != '-':
                test = os.path.basename(arg)
                del args[i]
            
            if arg[:2] == '-o':
                del args[i]
        
        if test == None:
            if len(args) == 1 and args[0] == '--version':
                try:
                    self.send_plain(subprocess.check_output(['emcc', '--version'], stderr=subprocess.STDOUT))
                    return
                except:
                    logging.exception('emcc failed!')
            
            self.send_plain('py_emcc: Sorry, I couldn\'t parse the command!\n')
            return
        
        destfile, logfile = self.build_test(test, args)
        
        if destfile == -1:
            self.send_plain('emcc: Test not found!\n')
        else:
            with open(logfile, 'rb') as logstream:
                self.send_plain(logstream.read())
    
    def emcc_version(self):
        try:
            output = subprocess.check_output(['emcc', '--version'])
            output = output.split('\n')[0] + '\ncan compile'
        except:
            logging.exception('emcc failed!')
            output = 'emcc failed!\nnope'
        
        self.send_plain(output)
    
    def send_plain(self, msg):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf8")
        self.send_header("Content-Length", str(len(msg)))
        self.end_headers()
        self.wfile.write(msg)
        
def start_server(s_port):
    try:
        httpd = SocketServer.TCPServer(("", s_port), Handler)
        return httpd
    except socket.error as e:
        if e.args[0] == 98:
            # Adress already in use
            return False
        
        logging.exception('Couldn\'t start server!')
        sys.exit(1)

if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)
    
    parser = argparse.ArgumentParser(description='The test server.')
    parser.add_argument('test_path', nargs=1, metavar='test directory', help='The directory containing the test files.')
    parser.add_argument('-b', dest='build_path', nargs=1, default=BUILD_PATH, help='All generated files will be put into this directory.')
    parser.add_argument('-l', dest='launch_browser', action='store_true', default=False, help='Automatically launch the browser.')
    parser.add_argument('-p', dest='port', nargs=1, type=int, default=PORT, help='The port on which to start the server.')
    opts = parser.parse_args()
    
    TEST_PATH = os.path.abspath(opts.test_path[0])
    BUILD_PATH = os.path.abspath(opts.build_path)
    PORT = opts.port
    
    if not os.path.isdir(TEST_PATH):
        print('The directory "%s" doesn\'t exist!' % TEST_PATH)
        sys.exit(1)
    
    if not os.path.isdir(BUILD_PATH):
        print('The directory "%s" doesn\'t exist!' % BUILD_PATH)
        sys.exit(1)
    
    # Switch to our web directory
    os.chdir(os.path.join(os.path.dirname(__file__), 'web'))
    
    SocketServer.TCPServer.allow_reuse_address = True
    httpd = None
    for p in range(PORT, PORT + 100):
        httpd = start_server(p)
        if httpd:
            PORT = p
            break
    
    if httpd == None:
        logging.error('Couldn\'t start server!')
        sys.exit(1)
    
    logging.info('Listening on 0.0.0.0:%d' % PORT)
    
    if opts.launch_browser:
        webbrowser.open_new_tab('http://localhost:' + str(PORT))
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        sys.exit(0)
