"""Vercel Serverless Function for Contact Form via Resend"""
import os
import json
from http.server import BaseHTTPRequestHandler
from urllib.request import Request, urlopen
from urllib.error import URLError


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(content_length))

            # Honeypot check
            if body.get('_gotcha'):
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True}).encode())
                return

            # Load recipients from content.json
            contact_emails = ''
            business_name = 'Website'
            try:
                content_path = os.path.join(os.path.dirname(__file__), '..', 'content.json')
                with open(content_path, 'r') as f:
                    data = json.load(f)
                    site = data.get('site', {})
                    contact_form = data.get('contactForm', {})
                    contact_emails = contact_form.get('contactEmails', site.get('email', ''))
                    business_name = site.get('businessName', 'Website')
            except Exception:
                pass

            if not contact_emails:
                raise ValueError('No recipient email configured')

            recipients = [e.strip() for e in contact_emails.split(',') if e.strip()]
            api_key = os.environ.get('RESEND_API_KEY', '')
            subject = body.get('_subject', f'New contact from {business_name}')

            # Build email body
            fields = {k: v for k, v in body.items() if not k.startswith('_')}
            html_body = f"<h2>{subject}</h2>"
            for key, value in fields.items():
                html_body += f"<p><strong>{key.title()}:</strong> {value}</p>"

            payload = json.dumps({
                "from": "noreply@lipmanwm.co.il",
                "to": recipients,
                "subject": subject,
                "html": html_body
            }).encode()

            req = Request('https://api.resend.com/emails',
                data=payload,
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json',
                    'User-Agent': 'VercelContactForm/1.0'
                })
            urlopen(req)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True}).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def log_message(self, format, *args):
        pass
