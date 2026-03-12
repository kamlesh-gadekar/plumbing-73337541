"""
Vercel Serverless Function for Dynamic robots.txt Generation
Reads custom settings from content.json if available
"""
import os
import json
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Get the base URL from headers
        host = self.headers.get('Host', '')
        protocol = 'https'  # Vercel always uses HTTPS
        base_url = f'{protocol}://{host}'

        # Try to load custom robots.txt from content.json
        custom_robots = None
        try:
            content_path = os.path.join(os.path.dirname(__file__), '..', 'content.json')
            if os.path.exists(content_path):
                with open(content_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    seo = data.get('site', {}).get('seo', {})
                    custom_robots = seo.get('robotsTxt', '')
        except Exception:
            pass

        # Generate robots.txt content
        if custom_robots and custom_robots.strip():
            # Use custom content
            robots_content = custom_robots
            # Ensure sitemap is included if not present
            if 'sitemap' not in robots_content.lower():
                robots_content += f"\n\nSitemap: {base_url}/sitemap_index.xml\n"
        else:
            # Default robots.txt
            robots_content = f"""User-agent: *
Disallow:

Sitemap: {base_url}/sitemap_index.xml
"""

        self.send_response(200)
        self.send_header('Content-type', 'text/plain; charset=utf-8')
        self.send_header('Cache-Control', 'public, max-age=86400')  # Cache for 24 hours
        self.end_headers()
        self.wfile.write(robots_content.encode('utf-8'))

    def log_message(self, format, *args):
        pass
