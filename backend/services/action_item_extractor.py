import os
import pickle
import re
import json
import warnings
from groq import Groq

warnings.filterwarnings("ignore")


class ActionItemExtractor:
    def __init__(self, model_path: str, groq_api_key: str):
        with open(model_path, "rb") as f:
            self.pipeline = pickle.load(f)
        self.groq_client = Groq(api_key=groq_api_key)
        self.max_items = 5

    def _split_sentences(self, text: str) -> list:
        sentences = re.split(r'(?<=[.!?])\s+', text)
        clean = []
        for sent in sentences:
            sent = sent.strip()
            sent = re.sub(r'^[A-Za-z\s]+:\s*', '', sent)
            sent = re.sub(r'^\[.*?\]\s*', '', sent)
            sent = sent.strip()
            if len(sent.split()) >= 5:
                clean.append(sent)
        return clean

    def _is_candidate(self, text: str) -> bool:
        t = text.lower()

        reject = [
            r'\bnext slide\b', r'\bgo to.*slide\b',
            r'\bcan you go\b', r'\bshow.*slide\b',
            r'\bthis is how\b', r'\bthese are\b',
            r'\bfor example\b.*\bif\b',
            r'\bsuppose (you|if|the user)\b',
            r'\bwhen you press\b',
            r'\bthe (chip|circuit|transistor|sensor) will\b',
            r'^(okay|so|well|yeah|yes|no|right|alright)',
            r'\bthank you\b', r'\bany (questions|comments)\b',
            r'\bpeople (like|want)\b',
            r'\b(has|was|have) (mentioned|said|presented|discussed)\b',
            r'^(in the last meeting|also mentioned was)\b',
            r'\bit will (send|generate|amplify|recognize)\b',
        ]
        for p in reject:
            if re.search(p, t):
                return False

        must_have = [
            r'\b(will|needs?\s+to|must|should|has\s+to)\s+\w+',
            r'\bplease\s+\w+',
            r'\b(can|could)\s+(you|someone|the\s+team)\s+\w+',
            r'\bneed\s+to\s+\w+',
            r'\bgoing\s+to\s+\w+',
            r'\bfollow.?up\b',
            r'\bresponsible\s+for\b',
            r'\bassigned\s+to\b',
            r'\bby\s+(monday|tuesday|wednesday|thursday|friday|end\s+of|tomorrow|next)\b',
            r'\bdeadline\b', r'\baction\s+item\b',
            r'\b(submit|deliver|complete|finish|prepare|schedule)\b.*\bby\b',
        ]
        for p in must_have:
            if re.search(p, t):
                return True
        return False

    def _score_candidates(self, candidates: list) -> list:
        if not candidates:
            return []
        probs = self.pipeline.predict_proba(candidates)[:, 1]
        scored = [
            {"text": sent, "score": float(prob)}
            for sent, prob in zip(candidates, probs)
            if prob >= 0.55
        ]
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored

    def _groq_enrich(self, scored: list) -> list:
        """Use Groq LLM to filter and enrich action items with assignee/priority."""
        if not scored:
            return []

        candidate_text = "\n".join([
            f"{i+1}. {item['text']}"
            for i, item in enumerate(scored[:20])
        ])

        response = self.groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": """You are a meeting analyst.
                    Extract the best real action items.

                    A REAL action item MUST have:
                    - Clear owner (person name or role)
                    - Specific task to complete
                    - Optional deadline

                    REJECT:
                    - Slide navigation requests
                    - Technical explanations
                    - Opinions or discussions
                    - Past event descriptions
                    - Greetings or small talk

                    Return ONLY valid JSON array, max 5 items.
                    Format: [{"title": "concise task", "description": "details", "assignee": "person or Unassigned", "priority": "low|medium|high|urgent"}]
                    No explanation, no markdown, just JSON."""
                },
                {
                    "role": "user",
                    "content": f"Extract best action items:\n\n{candidate_text}"
                }
            ],
            max_tokens=500,
            temperature=0.1
        )

        try:
            raw = response.choices[0].message.content.strip()
            raw = re.sub(r'```json|```', '', raw).strip()
            items = json.loads(raw)
            return [
                {
                    "title": item.get("title", item.get("action", "")),
                    "description": item.get("description", ""),
                    "assignee": item.get("assignee", "Unassigned"),
                    "priority": item.get("priority", "medium")
                    if item.get("priority") in ("low", "medium", "high", "urgent")
                    else "medium",
                }
                for item in items
                if item.get("title") or item.get("action")
            ]
        except Exception:
            return [
                {
                    "title": item["text"][:100],
                    "description": item["text"],
                    "assignee": "Unassigned",
                    "priority": "medium",
                }
                for item in scored[:self.max_items]
            ]

    def extract(self, transcript: str) -> list:
        """Extract action items from transcript. Returns list of dicts."""
        sentences = self._split_sentences(transcript)
        if not sentences:
            return []

        candidates = [s for s in sentences if self._is_candidate(s)]
        if not candidates:
            return []

        scored = self._score_candidates(candidates)
        if not scored:
            return []

        return self._groq_enrich(scored)[:self.max_items]
