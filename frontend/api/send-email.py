import json
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(content_length)) if content_length else {}

        emails = body.get("emails", [])
        report_title = body.get("title", "Meeting Report") or "Meeting Report"
        report_content = body.get("content_html", "<p>No content available.</p>")

        if not emails:
            self._respond(400, {"success": False, "error": "At least one email is required."})
            return

        smtp_email = os.environ.get("SMTP_EMAIL", "").strip()
        smtp_password = os.environ.get("SMTP_APP_PASSWORD", "").strip()

        if not smtp_email or not smtp_password:
            self._respond(500, {"success": False, "error": "Email not configured."})
            return

        email_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f4f1fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f1fa; padding: 32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width: 640px; width: 100%;">
        <tr><td style="text-align: center; padding: 24px 0 20px;">
          <span style="font-size: 28px; font-weight: 700; color: #6C3EF4; letter-spacing: -0.5px;">MeetPilot</span><span style="font-size: 28px; font-weight: 700; color: #8B5CF6; letter-spacing: -0.5px;">AI</span>
        </td></tr>
        <tr><td style="background: linear-gradient(135deg, #6C3EF4 0%, #8B5CF6 50%, #A78BFA 100%); border-radius: 16px 16px 0 0; padding: 36px 32px; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.7);">Meeting Report</p>
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; line-height: 1.3;">{report_title}</h1>
        </td></tr>
        <tr><td style="background: #ffffff; padding: 32px; border-left: 1px solid #e8e0f5; border-right: 1px solid #e8e0f5;">
          {report_content}
        </td></tr>
        <tr><td style="background: #faf8ff; padding: 24px 32px; border-radius: 0 0 16px 16px; border: 1px solid #e8e0f5; border-top: none; text-align: center;">
          <p style="margin: 0 0 4px; font-size: 13px; color: #6B7280;">This report was generated and sent by</p>
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #6C3EF4;">MeetPilotAI</p>
          <p style="margin: 8px 0 0; font-size: 11px; color: #9CA3AF;">AI-powered meeting minutes &bull; meetpilot-ai.vercel.app</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = report_title
            msg["From"] = f"MeetPilotAI <{smtp_email}>"
            msg["To"] = ", ".join(emails)
            msg.attach(MIMEText(email_html, "html"))

            with smtplib.SMTP("smtp.gmail.com", 587) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(smtp_email, smtp_password)
                server.sendmail(smtp_email, emails, msg.as_string())

            self._respond(200, {"success": True, "data": {"sent_to": emails, "count": len(emails)}})
        except Exception as e:
            self._respond(500, {"success": False, "error": f"Failed to send: {e}"})

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
