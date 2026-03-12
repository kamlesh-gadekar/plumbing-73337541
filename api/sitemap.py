"""
Vercel Serverless Function for Dynamic XML Sitemap Generation
Mimics Yoast SEO sitemap structure

Routes:
- /sitemap_index.xml → Sitemap index
- /sitemap.xml → Redirects to sitemap_index.xml
- /page-sitemap.xml → Static pages
- /post-sitemap.xml → Blog posts
- /service-sitemap.xml → Service pages
- /location-sitemap.xml → Location pages
"""

import os
import json
import urllib.request
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Determine sitemap type from path
        path = self.path.lower()

        # Map paths to sitemap types
        if path in ['/sitemap_index.xml', '/sitemap-index.xml']:
            sitemap_type = 'index'
        elif path == '/sitemap.xml':
            # Redirect /sitemap.xml to /sitemap_index.xml (Yoast behavior)
            self.send_response(301)
            self.send_header('Location', '/sitemap_index.xml')
            self.end_headers()
            return
        elif path == '/page-sitemap.xml':
            sitemap_type = 'page'
        elif path == '/post-sitemap.xml':
            sitemap_type = 'post'
        elif path == '/service-sitemap.xml':
            sitemap_type = 'service'
        elif path == '/location-sitemap.xml':
            sitemap_type = 'location'
        else:
            self.send_response(404)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'Sitemap not found')
            return

        try:
            # Get the base URL from headers or environment
            host = self.headers.get('Host', '')
            protocol = 'https'  # Vercel always uses HTTPS
            base_url = f'{protocol}://{host}'

            # Load content.json
            content_data = self._load_content_json()

            if not content_data:
                self.send_response(500)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                self.wfile.write(b'Could not load content.json')
                return

            # Generate sitemap
            xml_content = self._generate_sitemap(sitemap_type, base_url, content_data)

            if xml_content:
                self.send_response(200)
                self.send_header('Content-type', 'application/xml; charset=utf-8')
                # Yoast adds this header to prevent sitemap indexing
                self.send_header('X-Robots-Tag', 'noindex, follow')
                self.send_header('Cache-Control', 'public, max-age=3600')  # Cache for 1 hour
                self.end_headers()
                self.wfile.write(xml_content.encode('utf-8'))
            else:
                self.send_response(404)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                self.wfile.write(b'No content for this sitemap type')

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(f'Error generating sitemap: {str(e)}'.encode('utf-8'))

    def _load_content_json(self):
        """Load content.json from the site root"""
        try:
            # In Vercel, the working directory is the project root
            # content.json should be at the root level
            content_path = os.path.join(os.path.dirname(__file__), '..', 'content.json')

            # Try relative path first
            if os.path.exists(content_path):
                with open(content_path, 'r', encoding='utf-8') as f:
                    return json.load(f)

            # Try absolute path from current directory
            if os.path.exists('content.json'):
                with open('content.json', 'r', encoding='utf-8') as f:
                    return json.load(f)

            # Try fetching from the same host (fallback)
            host = self.headers.get('Host', '')
            if host:
                url = f'https://{host}/content.json'
                with urllib.request.urlopen(url, timeout=5) as response:
                    return json.load(response)

            return None
        except Exception as e:
            print(f'Error loading content.json: {e}')
            return None

    def _generate_sitemap(self, sitemap_type, base_url, content_data):
        """Generate sitemap XML based on type"""
        from datetime import datetime

        today = datetime.now().strftime('%Y-%m-%d')
        additional_pages = content_data.get('additionalPages', {})

        if sitemap_type == 'index':
            return self._generate_sitemap_index(base_url, additional_pages, today)
        elif sitemap_type == 'page':
            return self._generate_page_sitemap(base_url, additional_pages, today)
        elif sitemap_type == 'post':
            return self._generate_post_sitemap(base_url, additional_pages, today)
        elif sitemap_type == 'service':
            return self._generate_service_sitemap(base_url, additional_pages, today)
        elif sitemap_type == 'location':
            return self._generate_location_sitemap(base_url, additional_pages, today)

        return None

    def _generate_sitemap_index(self, base_url, additional_pages, today):
        """Generate sitemap index XML"""
        sitemaps = [{'loc': f'{base_url}/page-sitemap.xml', 'lastmod': today}]

        if additional_pages.get('blogPages'):
            sitemaps.append({'loc': f'{base_url}/post-sitemap.xml', 'lastmod': today})
        if additional_pages.get('servicePages'):
            sitemaps.append({'loc': f'{base_url}/service-sitemap.xml', 'lastmod': today})
        if additional_pages.get('locationPages'):
            sitemaps.append({'loc': f'{base_url}/location-sitemap.xml', 'lastmod': today})

        xml = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']

        for sm in sitemaps:
            xml.append(f'  <sitemap>')
            xml.append(f'    <loc>{sm["loc"]}</loc>')
            xml.append(f'    <lastmod>{sm["lastmod"]}</lastmod>')
            xml.append(f'  </sitemap>')

        xml.append('</sitemapindex>')
        return '\n'.join(xml)

    def _generate_page_sitemap(self, base_url, additional_pages, today):
        """Generate static pages sitemap"""
        urls = [
            {'loc': f'{base_url}/', 'lastmod': today},
            {'loc': f'{base_url}/privacy-policy', 'lastmod': today}
        ]

        if additional_pages.get('blogPages'):
            urls.append({'loc': f'{base_url}/blog/', 'lastmod': today})
        if additional_pages.get('servicePages'):
            urls.append({'loc': f'{base_url}/services/', 'lastmod': today})
        if additional_pages.get('locationPages'):
            urls.append({'loc': f'{base_url}/locations/', 'lastmod': today})

        return self._build_urlset(urls)

    def _generate_post_sitemap(self, base_url, additional_pages, today):
        """Generate blog posts sitemap"""
        urls = []
        for post in additional_pages.get('blogPages', []):
            slug = post.get('slug', '')
            if slug:
                urls.append({
                    'loc': f'{base_url}/blog/{slug}',
                    'lastmod': post.get('dateModified', today)
                })
        return self._build_urlset(urls) if urls else None

    def _generate_service_sitemap(self, base_url, additional_pages, today):
        """Generate service pages sitemap"""
        urls = []
        for service in additional_pages.get('servicePages', []):
            slug = service.get('slug', '')
            if slug:
                urls.append({
                    'loc': f'{base_url}/services/{slug}',
                    'lastmod': service.get('dateModified', today)
                })
        return self._build_urlset(urls) if urls else None

    def _generate_location_sitemap(self, base_url, additional_pages, today):
        """Generate location pages sitemap"""
        urls = []
        for location in additional_pages.get('locationPages', []):
            slug = location.get('slug', '')
            if slug:
                urls.append({
                    'loc': f'{base_url}/locations/{slug}',
                    'lastmod': location.get('dateModified', today)
                })
        return self._build_urlset(urls) if urls else None

    def _build_urlset(self, urls):
        """Build urlset XML"""
        xml = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']

        for url in urls:
            xml.append('  <url>')
            xml.append(f'    <loc>{self._escape_xml(url["loc"])}</loc>')
            if url.get('lastmod'):
                xml.append(f'    <lastmod>{url["lastmod"]}</lastmod>')
            xml.append('  </url>')

        xml.append('</urlset>')
        return '\n'.join(xml)

    def _escape_xml(self, text):
        """Escape XML special characters"""
        if not text:
            return ''
        return (text
                .replace('&', '&amp;')
                .replace('<', '&lt;')
                .replace('>', '&gt;')
                .replace('"', '&quot;')
                .replace("'", '&apos;'))

    def log_message(self, format, *args):
        """Suppress default logging"""
        pass
