"""
Vercel Serverless Function for Decap CMS GitHub OAuth - Auth Endpoint
Redirects to GitHub OAuth authorization page
"""
import os
from urllib.parse import urlencode
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # GitHub OAuth App credentials (should be set in Vercel environment variables)
        client_id = os.environ.get('GITHUB_OAUTH_CLIENT_ID', '')

        if not client_id:
            self.send_response(500)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'GitHub OAuth Client ID not configured')
            return

        # Get the callback URL from query parameters or use default
        host = self.headers.get('host', '')
        callback_url = f"https://{host}/api/callback"

        # GitHub OAuth authorization URL
        params = {
            'client_id': client_id,
            'redirect_uri': callback_url,
            'scope': 'repo',  # 'repo' scope includes user access for private repos
        }

        auth_url = f"https://github.com/login/oauth/authorize?{urlencode(params)}"

        # Redirect to GitHub OAuth
        self.send_response(302)
        self.send_header('Location', auth_url)
        self.end_headers()
