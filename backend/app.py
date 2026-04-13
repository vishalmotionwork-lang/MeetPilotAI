import os
import uuid
import tempfile
from datetime import datetime, timezone

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import bcrypt

load_dotenv()

from config.supabase_client import supabase
from services.ai_processor import summarize_transcript
from services.transcription import parallel_transcribe
from services.action_item_extractor import ActionItemExtractor
from audio_utils import convert_audio, split_audio, cleanup_files

app = Flask(__name__)
CORS(app)

# Initialize ML action item extractor
_extractor = None
def get_extractor():
    global _extractor
    if _extractor is None:
        model_path = os.path.join(os.path.dirname(__file__), "models", "pipeline.pkl")
        groq_key = os.getenv("GROQ_API_KEY", "")
        if os.path.exists(model_path) and groq_key:
            _extractor = ActionItemExtractor(model_path, groq_key)
    return _extractor


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def success_response(data=None, status=200):
    return jsonify({"success": True, "data": data, "error": None}), status


def error_response(message, status=400):
    return jsonify({"success": False, "data": None, "error": message}), status


def utcnow_iso():
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# AUTH
# ---------------------------------------------------------------------------

@app.route("/api/auth/signup", methods=["POST"])
def signup():
    try:
        body = request.get_json()
        name = body.get("name", "").strip()
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")

        if not name or not email or not password:
            return error_response("Name, email, and password are required.")

        # Check if user already exists
        existing = supabase.table("users").select("id").eq("email", email).execute()
        if existing.data:
            return error_response("An account with this email already exists.", 409)

        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        user_data = {
            "id": str(uuid.uuid4()),
            "name": name,
            "email": email,
            "password_hash": password_hash,
            "created_at": utcnow_iso(),
            "updated_at": utcnow_iso(),
        }

        result = supabase.table("users").insert(user_data).execute()

        user = result.data[0]
        return success_response({
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
        }, 201)

    except Exception as e:
        return error_response(f"Signup failed: {e}", 500)


@app.route("/api/auth/login", methods=["POST"])
def login():
    try:
        body = request.get_json()
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")

        if not email or not password:
            return error_response("Email and password are required.")

        result = supabase.table("users").select("*").eq("email", email).execute()

        if not result.data:
            return error_response("Invalid email or password.", 401)

        user = result.data[0]

        if not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"].encode("utf-8")):
            return error_response("Invalid email or password.", 401)

        return success_response({
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
        })

    except Exception as e:
        return error_response(f"Login failed: {e}", 500)


# ---------------------------------------------------------------------------
# AUDIO PROCESSING
# ---------------------------------------------------------------------------

@app.route("/api/process-audio", methods=["POST"])
def process_audio():
    temp_files = []
    try:
        if "audio" not in request.files:
            return error_response("No audio file provided.")

        audio_file = request.files["audio"]
        user_id = request.form.get("user_id", "").strip()
        title = request.form.get("title", "").strip() or "Untitled Meeting"

        if not user_id:
            return error_response("user_id is required.")

        # Save temp file
        suffix = os.path.splitext(audio_file.filename)[1] or ".webm"
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix, prefix="meeting_")
        audio_file.save(tmp.name)
        tmp.close()
        temp_files.append(tmp.name)

        # Convert to WAV
        wav_path = convert_audio(tmp.name)
        temp_files.append(wav_path)

        # Split into chunks
        chunk_paths = split_audio(wav_path)
        temp_files.extend(chunk_paths)

        # Transcribe in parallel
        transcript = parallel_transcribe(chunk_paths)

        if transcript.startswith("ERROR:"):
            return error_response(transcript)

        # AI summarize
        summary_data = summarize_transcript(transcript)

        # Create meeting + summary + action items + report
        meeting_result = _create_full_meeting(
            user_id=user_id,
            title=title,
            transcript=transcript,
            summary_data=summary_data,
        )

        return success_response(meeting_result, 201)

    except Exception as e:
        return error_response(f"Audio processing failed: {e}", 500)
    finally:
        cleanup_files(temp_files)


@app.route("/api/process-transcript", methods=["POST"])
def process_transcript():
    """Process a transcript directly (for live mic feature)."""
    try:
        body = request.get_json()
        transcript = body.get("transcript", "").strip()
        user_id = body.get("user_id", "").strip()
        title = body.get("title", "").strip() or "Live Meeting"

        if not transcript:
            return error_response("Transcript text is required.")
        if not user_id:
            return error_response("user_id is required.")

        # AI summarize
        summary_data = summarize_transcript(transcript)

        # Create meeting + summary + action items + report
        meeting_result = _create_full_meeting(
            user_id=user_id,
            title=title,
            transcript=transcript,
            summary_data=summary_data,
        )

        return success_response(meeting_result, 201)

    except Exception as e:
        return error_response(f"Transcript processing failed: {e}", 500)


def _create_full_meeting(user_id: str, title: str, transcript: str, summary_data: dict) -> dict:
    """Insert meeting, summary, action items, and report into Supabase. Returns the full data."""
    now = utcnow_iso()
    meeting_id = str(uuid.uuid4())

    # 1. Insert meeting
    meeting = {
        "id": meeting_id,
        "user_id": user_id,
        "title": title,
        "transcript": transcript,
        "status": "completed",
        "created_at": now,
        "updated_at": now,
    }
    supabase.table("meetings").insert(meeting).execute()

    # 2. Insert summary
    summary_id = str(uuid.uuid4())
    summary_record = {
        "id": summary_id,
        "meeting_id": meeting_id,
        "insight": summary_data.get("insight", ""),
        "key_points": summary_data.get("key_points", []),
        "action_items": summary_data.get("action_items", []),
        "decisions": summary_data.get("decisions", []),
        "model_used": "llama-3.1-8b-instant",
        "created_at": now,
    }
    supabase.table("summaries").insert(summary_record).execute()

    # 3. Extract action items using ML pipeline + Groq enrichment
    extractor = get_extractor()
    if extractor:
        ml_items = extractor.extract(transcript)
    else:
        ml_items = summary_data.get("action_items", [])

    action_items_list = []
    for item in ml_items:
        ai_record = {
            "id": str(uuid.uuid4()),
            "meeting_id": meeting_id,
            "user_id": user_id,
            "title": item.get("title", "Untitled Action"),
            "description": item.get("description", ""),
            "assignee": item.get("assignee", "Unassigned"),
            "priority": item.get("priority", "medium"),
            "status": "pending",
            "created_at": now,
        }
        result = supabase.table("action_items").insert(ai_record).execute()
        action_items_list.append(result.data[0] if result.data else ai_record)

    # 4. Auto-generate report
    report_id = str(uuid.uuid4())
    report_record = {
        "id": report_id,
        "meeting_id": meeting_id,
        "user_id": user_id,
        "title": f"Report: {title}",
        "content_html": _generate_report_html(title, summary_data, action_items_list),
        "content_json": {
            "meeting_title": title,
            "summary": summary_data.get("insight", ""),
            "key_points": summary_data.get("key_points", []),
            "action_items": summary_data.get("action_items", []),
            "decisions": summary_data.get("decisions", []),
        },
        "is_sent": False,
        "created_at": now,
        "updated_at": now,
    }
    supabase.table("reports").insert(report_record).execute()

    return {
        "meeting": meeting,
        "summary": summary_record,
        "action_items": action_items_list,
        "report": report_record,
    }


def _generate_report_html(title: str, summary_data: dict, action_items: list) -> str:
    """Generate a styled HTML report matching MeetPilotAI design."""
    now_str = datetime.now(timezone.utc).strftime("%B %d, %Y")

    key_points_html = "".join(
        f'<div style="padding:12px 16px;background:#F3EEFF;border-left:3px solid #6C3EF4;border-radius:0 8px 8px 0;margin-bottom:8px;font-size:0.9375rem;color:#1E1B4B;">{kp}</div>'
        for kp in summary_data.get("key_points", [])
    )
    decisions_html = "".join(
        f'<div style="padding:12px 16px;background:#F0FDF4;border-left:3px solid #22C55E;border-radius:0 8px 8px 0;margin-bottom:8px;font-size:0.9375rem;color:#1E1B4B;">{d}</div>'
        for d in summary_data.get("decisions", [])
    )
    action_items_html = "".join(
        f'<div style="padding:12px 16px;background:#FFF7ED;border-left:3px solid #F59E0B;border-radius:0 8px 8px 0;margin-bottom:8px;font-size:0.9375rem;color:#1E1B4B;">'
        f'<strong>{ai.get("title", "")}</strong> — {ai.get("assignee", "Unassigned")} '
        f'<span style="display:inline-block;padding:2px 8px;background:#FEF3C7;border-radius:99px;font-size:0.75rem;color:#92400E;">{ai.get("priority", "medium")}</span>'
        f'</div>'
        for ai in action_items
    )

    return f"""<div style="text-align:center;margin-bottom:32px;">
  <div style="font-size:0.6875rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#6C3EF4;margin-bottom:8px;">MEETING REPORT</div>
  <h1 style="font-size:1.75rem;font-weight:700;color:#1E1B4B;margin:0 0 8px;">{title}</h1>
  <div style="font-size:0.875rem;color:#5B5685;">{now_str}</div>
</div>
<hr style="border:none;border-top:1px solid rgba(108,62,244,0.12);margin:24px 0;">

<div style="margin-bottom:24px;">
  <h2 style="font-size:1.125rem;font-weight:600;color:#1E1B4B;border-left:3px solid #6C3EF4;padding-left:12px;margin-bottom:12px;">Executive Summary</h2>
  <p style="font-size:0.9375rem;line-height:1.7;color:#1E1B4B;">{summary_data.get('insight', 'No summary available.')}</p>
</div>

<div style="margin-bottom:24px;">
  <h2 style="font-size:1.125rem;font-weight:600;color:#1E1B4B;border-left:3px solid #3B82F6;padding-left:12px;margin-bottom:12px;">Key Discussion Points</h2>
  {key_points_html or '<p style="color:#9490B3;font-size:0.875rem;">None identified</p>'}
</div>

<div style="margin-bottom:24px;">
  <h2 style="font-size:1.125rem;font-weight:600;color:#1E1B4B;border-left:3px solid #22C55E;padding-left:12px;margin-bottom:12px;">Decisions</h2>
  {decisions_html or '<p style="color:#9490B3;font-size:0.875rem;">None identified</p>'}
</div>

<div style="margin-bottom:24px;">
  <h2 style="font-size:1.125rem;font-weight:600;color:#1E1B4B;border-left:3px solid #F59E0B;padding-left:12px;margin-bottom:12px;">Action Items</h2>
  {action_items_html or '<p style="color:#9490B3;font-size:0.875rem;">None identified</p>'}
</div>

<hr style="border:none;border-top:1px solid rgba(108,62,244,0.12);margin:32px 0 16px;">
<div style="text-align:center;">
  <p style="font-size:0.6875rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#9490B3;">Generated by MeetPilotAI</p>
</div>"""


# ---------------------------------------------------------------------------
# MEETINGS
# ---------------------------------------------------------------------------

@app.route("/api/meetings", methods=["GET"])
def get_meetings():
    try:
        user_id = request.args.get("user_id", "").strip()
        if not user_id:
            return error_response("user_id query parameter is required.")

        result = (
            supabase.table("meetings")
            .select("id, title, description, meeting_date, duration_seconds, status, created_at, updated_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        meetings = result.data or []

        # Attach summary snippet to each meeting
        for m in meetings:
            summary_result = (
                supabase.table("summaries")
                .select("insight")
                .eq("meeting_id", m["id"])
                .limit(1)
                .execute()
            )
            if summary_result.data:
                insight = summary_result.data[0].get("insight", "")
                m["summary_snippet"] = insight[:200] + "..." if len(insight) > 200 else insight
            else:
                m["summary_snippet"] = None

        return success_response(meetings)

    except Exception as e:
        return error_response(f"Failed to fetch meetings: {e}", 500)


@app.route("/api/meetings/<meeting_id>", methods=["GET"])
def get_meeting(meeting_id):
    try:
        meeting_result = supabase.table("meetings").select("*").eq("id", meeting_id).execute()
        if not meeting_result.data:
            return error_response("Meeting not found.", 404)

        meeting = meeting_result.data[0]

        summary_result = (
            supabase.table("summaries").select("*").eq("meeting_id", meeting_id).limit(1).execute()
        )
        action_items_result = (
            supabase.table("action_items").select("*").eq("meeting_id", meeting_id).execute()
        )
        report_result = (
            supabase.table("reports").select("*").eq("meeting_id", meeting_id).limit(1).execute()
        )

        return success_response({
            "meeting": meeting,
            "summary": summary_result.data[0] if summary_result.data else None,
            "action_items": action_items_result.data or [],
            "report": report_result.data[0] if report_result.data else None,
        })

    except Exception as e:
        return error_response(f"Failed to fetch meeting: {e}", 500)


# ---------------------------------------------------------------------------
# REPORTS
# ---------------------------------------------------------------------------

@app.route("/api/meetings/<meeting_id>/report", methods=["GET"])
def get_report(meeting_id):
    try:
        result = supabase.table("reports").select("*").eq("meeting_id", meeting_id).limit(1).execute()
        if not result.data:
            return error_response("Report not found.", 404)

        return success_response(result.data[0])

    except Exception as e:
        return error_response(f"Failed to fetch report: {e}", 500)


@app.route("/api/meetings/<meeting_id>/report", methods=["PUT"])
def update_report(meeting_id):
    try:
        body = request.get_json()
        update_data = {}

        if "title" in body:
            update_data["title"] = body["title"]
        if "content_html" in body:
            update_data["content_html"] = body["content_html"]
        if "content_json" in body:
            update_data["content_json"] = body["content_json"]

        if not update_data:
            return error_response("No fields to update.")

        update_data["updated_at"] = utcnow_iso()

        result = (
            supabase.table("reports")
            .update(update_data)
            .eq("meeting_id", meeting_id)
            .execute()
        )

        if not result.data:
            return error_response("Report not found.", 404)

        return success_response(result.data[0])

    except Exception as e:
        return error_response(f"Failed to update report: {e}", 500)


@app.route("/api/meetings/<meeting_id>/report/send", methods=["POST"])
def send_report(meeting_id):
    try:
        body = request.get_json()
        emails = body.get("emails", [])

        if not emails:
            return error_response("At least one email is required.")

        # Fetch the report content
        report_result = (
            supabase.table("reports")
            .select("title, content_html")
            .eq("meeting_id", meeting_id)
            .limit(1)
            .execute()
        )

        if report_result.data:
            report = report_result.data[0]
        else:
            # No saved report — generate from meeting + summary data
            meeting_result = supabase.table("meetings").select("title").eq("id", meeting_id).limit(1).execute()
            summary_result = supabase.table("summaries").select("*").eq("meeting_id", meeting_id).limit(1).execute()
            ai_result = supabase.table("action_items").select("*").eq("meeting_id", meeting_id).execute()

            if not meeting_result.data:
                return error_response("Meeting not found.", 404)

            m_title = meeting_result.data[0].get("title", "Meeting Report")
            s_data = summary_result.data[0] if summary_result.data else {}
            ai_list = ai_result.data if ai_result.data else []

            report = {
                "title": f"Report: {m_title}",
                "content_html": _generate_report_html(m_title, s_data, ai_list),
            }

        # Send email via Resend
        import resend
        resend.api_key = os.getenv("RESEND_API_KEY", "")

        if not resend.api_key:
            return error_response("Email service not configured (RESEND_API_KEY missing).", 500)

        report_title = report.get('title', 'Meeting Report') or 'Meeting Report'
        report_content = report.get('content_html', '<p>No content available.</p>')

        email_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f4f1fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f1fa; padding: 32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width: 640px; width: 100%;">

        <!-- Logo Header -->
        <tr><td style="text-align: center; padding: 24px 0 20px;">
          <span style="font-size: 28px; font-weight: 700; color: #6C3EF4; letter-spacing: -0.5px;">MeetPilot</span><span style="font-size: 28px; font-weight: 700; color: #8B5CF6; letter-spacing: -0.5px;">AI</span>
        </td></tr>

        <!-- Purple Banner -->
        <tr><td style="background: linear-gradient(135deg, #6C3EF4 0%, #8B5CF6 50%, #A78BFA 100%); border-radius: 16px 16px 0 0; padding: 36px 32px; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.7);">Meeting Report</p>
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; line-height: 1.3;">{report_title}</h1>
        </td></tr>

        <!-- Content Card -->
        <tr><td style="background: #ffffff; padding: 32px; border-left: 1px solid #e8e0f5; border-right: 1px solid #e8e0f5;">
          {report_content}
        </td></tr>

        <!-- Footer Card -->
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

        result = resend.Emails.send({
            "from": "MeetPilotAI <onboarding@resend.dev>",
            "to": emails,
            "subject": report.get("title", "Meeting Report") or "Meeting Report",
            "html": email_html,
        })

        if not result or (isinstance(result, dict) and result.get("error")):
            return error_response("Email delivery failed. Resend free tier only allows sending to the account owner's verified email.", 422)

        # Update DB
        update_data = {
            "is_sent": True,
            "sent_to": emails,
            "sent_at": utcnow_iso(),
            "updated_at": utcnow_iso(),
        }
        supabase.table("reports").update(update_data).eq("meeting_id", meeting_id).execute()

        return success_response({"sent_to": emails, "count": len(emails)})

    except Exception as e:
        return error_response(f"Failed to send report: {e}", 500)


# ---------------------------------------------------------------------------
# ACTION ITEMS
# ---------------------------------------------------------------------------

@app.route("/api/action-items", methods=["GET"])
def get_action_items():
    try:
        user_id = request.args.get("user_id", "").strip()
        if not user_id:
            return error_response("user_id query parameter is required.")

        result = (
            supabase.table("action_items")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        return success_response(result.data or [])

    except Exception as e:
        return error_response(f"Failed to fetch action items: {e}", 500)


@app.route("/api/action-items/<item_id>", methods=["PATCH"])
def update_action_item(item_id):
    try:
        body = request.get_json()
        update_data = {}

        for field in ("status", "priority", "assignee", "due_date"):
            if field in body:
                update_data[field] = body[field]

        if not update_data:
            return error_response("No fields to update.")

        # If marking as completed, set completed_at
        if update_data.get("status") == "completed":
            update_data["completed_at"] = utcnow_iso()

        result = (
            supabase.table("action_items")
            .update(update_data)
            .eq("id", item_id)
            .execute()
        )

        if not result.data:
            return error_response("Action item not found.", 404)

        return success_response(result.data[0])

    except Exception as e:
        return error_response(f"Failed to update action item: {e}", 500)


# ---------------------------------------------------------------------------
# REMINDERS
# ---------------------------------------------------------------------------

@app.route("/api/reminders", methods=["POST"])
def create_reminder():
    try:
        body = request.get_json()
        user_id = body.get("user_id", "").strip()
        meeting_id = body.get("meeting_id", "").strip()
        title = body.get("title", "").strip()
        remind_at = body.get("remind_at", "").strip()
        reminder_type = body.get("reminder_type", "email")

        if not user_id or not title or not remind_at:
            return error_response("user_id, title, and remind_at are required.")

        reminder_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": title,
            "remind_at": remind_at,
            "is_sent": False,
            "reminder_type": reminder_type,
            "created_at": utcnow_iso(),
        }

        if meeting_id:
            reminder_data["meeting_id"] = meeting_id

        result = supabase.table("reminders").insert(reminder_data).execute()

        return success_response(result.data[0] if result.data else reminder_data, 201)

    except Exception as e:
        return error_response(f"Failed to create reminder: {e}", 500)


@app.route("/api/reminders", methods=["GET"])
def get_reminders():
    try:
        user_id = request.args.get("user_id", "").strip()
        if not user_id:
            return error_response("user_id query parameter is required.")

        result = (
            supabase.table("reminders")
            .select("*")
            .eq("user_id", user_id)
            .order("remind_at", desc=False)
            .execute()
        )

        return success_response(result.data or [])

    except Exception as e:
        return error_response(f"Failed to fetch reminders: {e}", 500)


@app.route("/api/reminders/<reminder_id>", methods=["DELETE"])
def delete_reminder(reminder_id):
    try:
        result = (
            supabase.table("reminders")
            .delete()
            .eq("id", reminder_id)
            .execute()
        )

        return success_response({"deleted": True})

    except Exception as e:
        return error_response(f"Failed to delete reminder: {e}", 500)


# ---------------------------------------------------------------------------
# DASHBOARD
# ---------------------------------------------------------------------------

@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    try:
        user_id = request.args.get("user_id", "").strip()
        if not user_id:
            return error_response("user_id query parameter is required.")

        # Total meetings
        meetings_result = (
            supabase.table("meetings")
            .select("id, title, meeting_date, status, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        meetings = meetings_result.data or []
        total_meetings = len(meetings)
        recent_meetings = meetings[:5]

        # Action items
        ai_result = (
            supabase.table("action_items")
            .select("id, status, priority")
            .eq("user_id", user_id)
            .execute()
        )
        action_items = ai_result.data or []
        total_action_items = len(action_items)
        completed_action_items = sum(1 for ai in action_items if ai.get("status") == "completed")
        pending_action_items = sum(1 for ai in action_items if ai.get("status") == "pending")

        # Action items by priority
        priority_counts = {"low": 0, "medium": 0, "high": 0, "urgent": 0}
        for ai in action_items:
            p = ai.get("priority", "medium")
            if p in priority_counts:
                priority_counts[p] += 1

        # Upcoming reminders (unsent, remind_at in the future)
        reminders_result = (
            supabase.table("reminders")
            .select("id")
            .eq("user_id", user_id)
            .eq("is_sent", False)
            .gte("remind_at", utcnow_iso())
            .execute()
        )
        upcoming_reminders = len(reminders_result.data or [])

        return success_response({
            "total_meetings": total_meetings,
            "total_action_items": total_action_items,
            "completed_action_items": completed_action_items,
            "pending_action_items": pending_action_items,
            "upcoming_reminders": upcoming_reminders,
            "recent_meetings": [
                {
                    "id": m["id"],
                    "title": m["title"],
                    "date": m.get("meeting_date") or m.get("created_at"),
                    "status": m["status"],
                }
                for m in recent_meetings
            ],
            "action_items_by_priority": priority_counts,
        })

    except Exception as e:
        return error_response(f"Failed to fetch dashboard data: {e}", 500)


# ---------------------------------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    return success_response({"status": "ok", "timestamp": utcnow_iso()})


# ---------------------------------------------------------------------------
# RUN
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
