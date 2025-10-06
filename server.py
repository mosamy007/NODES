#!/usr/bin/env python3
"""
Simple HTTP server to run the NODES NFT Collage Maker
"""

import http.server
import socketserver
import webbrowser
import os
import sys
import urllib.request
import urllib.parse
import json

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow cross-origin requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # Handle image proxy requests
        if self.path.startswith('/proxy/'):
            self.handle_image_proxy()
        else:
            super().do_GET()
    
    def handle_image_proxy(self):
        try:
            # Extract the URL from the proxy path
            url = self.path[7:]  # Remove '/proxy/' prefix
            url = urllib.parse.unquote(url)
            
            print(f"Proxying image: {url}")
            
            # Fetch the image
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
            
            with urllib.request.urlopen(req, timeout=10) as response:
                data = response.read()
                content_type = response.headers.get('Content-Type', 'image/jpeg')
                
                # Send response
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Cache-Control', 'public, max-age=3600')
                self.end_headers()
                self.wfile.write(data)
                
        except Exception as e:
            print(f"Error proxying image {url}: {e}")
            self.send_error(404, f"Could not fetch image: {str(e)}")

def main():
    # Change to the directory containing this script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"🚀 NODES NFT Collage Maker is running!")
            print(f"📱 Open your browser and go to: http://localhost:{PORT}")
            print(f"🛑 Press Ctrl+C to stop the server")
            
            # Try to open browser automatically
            try:
                webbrowser.open(f'http://localhost:{PORT}')
                print("🌐 Browser opened automatically")
            except:
                print("⚠️  Could not open browser automatically")
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n👋 Server stopped. Thanks for using NODES NFT Collage Maker!")
        sys.exit(0)
    except OSError as e:
        if e.errno == 98:  # Address already in use
            print(f"❌ Port {PORT} is already in use. Please try a different port or stop the existing server.")
            print("💡 You can also run: python3 -m http.server 8001")
        else:
            print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
