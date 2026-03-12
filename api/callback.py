"""
Vercel Serverless Function for Decap CMS GitHub OAuth - Callback Endpoint
Exchanges authorization code for access token
"""
import os
import json
import urllib.request
import urllib.parse
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse query parameters
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)

        code = params.get('code', [None])[0]

        if not code:
            self.send_response(400)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'No code provided')
            return

        # GitHub OAuth App credentials
        client_id = os.environ.get('GITHUB_OAUTH_CLIENT_ID', '')
        client_secret = os.environ.get('GITHUB_OAUTH_CLIENT_SECRET', '')

        if not client_id or not client_secret:
            self.send_response(500)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'GitHub OAuth credentials not configured')
            return

        # Exchange code for access token
        token_url = 'https://github.com/login/oauth/access_token'
        data = urllib.parse.urlencode({
            'client_id': client_id,
            'client_secret': client_secret,
            'code': code,
        }).encode('utf-8')

        req = urllib.request.Request(token_url, data=data)
        req.add_header('Accept', 'application/json')

        try:
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                access_token = result.get('access_token')

                if access_token:
                    # Return success page with token that Decap CMS will capture
                    html = f"""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Authorization Successful</title>
                        <script>
                          (function() {{
                            function receiveMessage(e) {{
                              console.log("receiveMessage %o", e);
                              window.opener.postMessage(
                                'authorization:github:success:' + JSON.stringify({{
                                  token: "{access_token}",
                                  provider: "github"
                                }}),
                                e.origin
                              );
                              window.removeEventListener("message", receiveMessage, false);
                            }}
                            window.addEventListener("message", receiveMessage, false);
                            console.log("Posting message");
                            window.opener.postMessage("authorizing:github", "*");
                          }})();
                        </script>
                    </head>
                    <body>
                        <p>Authorization successful! You can close this window.</p>
                    </body>
                    </html>
                    """
                    self.send_response(200)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()
                    self.wfile.write(html.encode('utf-8'))
                else:
                    self.send_response(400)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()
                    self.wfile.write(b'Failed to get access token')
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(f'Error: {str(e)}'.encode('utf-8'))
