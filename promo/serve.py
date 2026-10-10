import http.server, os, socketserver, sys, urllib.parse
ROOT = os.path.dirname(os.path.abspath(__file__)); os.chdir(ROOT)
class H(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        q = urllib.parse.urlparse(self.path)
        name = os.path.basename(urllib.parse.parse_qs(q.query).get("name", ["x.bin"])[0])
        if not name.endswith((".mp4", ".webm", ".png")): self.send_response(400); self.end_headers(); return
        n = int(self.headers["content-length"]); data = self.rfile.read(n)
        open(os.path.join(ROOT, "out", name), "wb").write(data)
        self.send_response(200); self.end_headers(); self.wfile.write(b"saved %d" % len(data))
    def end_headers(self):
        self.send_header("Cache-Control", "no-store"); super().end_headers()
    def log_message(self, *a): pass
socketserver.TCPServer.allow_reuse_address = True
socketserver.ThreadingTCPServer(("127.0.0.1", 3200), H).serve_forever()
