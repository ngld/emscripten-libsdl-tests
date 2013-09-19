#!/bin/env python2

import sys, os, json
import webbrowser
import SimpleHTTPServer
import SocketServer

PORT = 8080
TEST_PATH = os.path.abspath('.')
BUILD_PATH = os.path.abspath('../build')

class Handler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.translate_path(self.path)
        
        if path[-11:] == '/index.json':
            path = path[:-10]
            self.list_json(path)
            return False
        
        return SimpleHTTPServer.SimpleHTTPRequestHandler.send_head(self)
    
    def translate_path(self, path):
        if path[:7] == '/tests/':
            return os.path.join(TEST_PATH, path[7:].split('?')[0])
        
        if path[:7] == '/build/':
            return os.path.join(BUILD_PATH, path[7:].split('?')[0])
        
        return SimpleHTTPServer.SimpleHTTPRequestHandler.translate_path(self, path)
    
    def list_json(self, path):
        try:
            list_ = os.listdir(path)
        except os.error:
            self.send_error(404, "No permission to list directory")
            return None
        
        out = {'dirs': [], 'files': []}
        for name in list_:
            itempath = os.path.join(path, name)
            if os.path.isfile(itempath):
                out['files'].append(name)
            elif os.path.isdir(itempath):
                out['dirs'].append(name)
        
        out = json.dumps(out)
        
        self.send_response(200)
        encoding = sys.getfilesystemencoding()
        
        self.send_header("Content-type", "application/javascript; charset=%s" % encoding)
        self.send_header("Content-Length", str(len(out)))
        self.end_headers()
        self.wfile.write(out)

if __name__ == '__main__':
    launch = False
    if len(sys.argv) > 1:
        if sys.argv[1] == '-l':
            launch = True
            
            del sys.argv[1]
    
    if len(sys.argv) > 1:
        PORT = int(sys.argv[1])
    
    os.chdir(os.path.join(os.path.dirname(__file__), 'web'))
    
    SocketServer.TCPServer.allow_reuse_address = True
    httpd = SocketServer.TCPServer(("", PORT), Handler)
    
    print("serving at port", PORT)
    webbrowser.open_new_tab('http://localhost:' + str(PORT))
    httpd.serve_forever()
