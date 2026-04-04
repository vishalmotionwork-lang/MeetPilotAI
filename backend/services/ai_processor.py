import os
import re
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL = "llama-3.1-8b-instant"


def summarize_transcript(transcript: str) -> dict:
    """Send transcript to Groq LLM and return structured summary."""
    if not GROQ_API_KEY:
        return {
            "error": "GROQ_API_KEY not set",
            "insight": "AI summarization unavailable. Please set the Groq API key.",
            "key_points": [],
            "action_items": [],
            "decisions": [],
        }

    client = Groq(api_key=GROQ_API_KEY)
    trimmed = transcript[:6000]

    prompt = f"""You are a meeting summarizer. You MUST analyze the transcript below and return a JSON object. Even if the transcript is short, incomplete, or informal — always summarize what you can.

Required JSON fields:
- "insight": Summary of what was discussed (1-3 paragraphs based on length)
- "key_points": Array of strings — key topics or points mentioned
- "action_items": Array of objects with "title", "description", "assignee" (use "Unassigned" if unknown), "priority" ("low"/"medium"/"high"/"urgent")
- "decisions": Array of strings — any decisions or conclusions

IMPORTANT: Never say you don't have a transcript. Always analyze the text below. Return ONLY valid JSON.

Transcript:
{trimmed}"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2000,
        )

        content = response.choices[0].message.content.strip()
        return _parse_json_response(content)

    except Exception as e:
        return {
            "error": str(e),
            "insight": f"Failed to generate AI summary: {e}",
            "key_points": [],
            "action_items": [],
            "decisions": [],
        }


def _parse_json_response(content: str) -> dict:
    """Parse JSON from LLM response with regex fallback."""
    try:
        return _validate_summary(json.loads(content))
    except json.JSONDecodeError:
        pass

    json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", content)
    if json_match:
        try:
            return _validate_summary(json.loads(json_match.group(1).strip()))
        except json.JSONDecodeError:
            pass

    brace_match = re.search(r"\{[\s\S]*\}", content)
    if brace_match:
        try:
            return _validate_summary(json.loads(brace_match.group(0)))
        except json.JSONDecodeError:
            pass

    return {
        "insight": content,
        "key_points": [],
        "action_items": [],
        "decisions": [],
    }


def _validate_summary(data: dict) -> dict:
    """Ensure all required fields exist with correct types."""
    return {
        "insight": data.get("insight", "No summary generated."),
        "key_points": data.get("key_points", []) if isinstance(data.get("key_points"), list) else [],
        "action_items": data.get("action_items", []) if isinstance(data.get("action_items"), list) else [],
        "decisions": data.get("decisions", []) if isinstance(data.get("decisions"), list) else [],
    }
