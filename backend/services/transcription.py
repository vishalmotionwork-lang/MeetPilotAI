import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def transcribe_chunk(chunk_path: str) -> str:
    """Transcribe a single audio chunk using Groq Whisper."""
    from groq import Groq

    client = Groq(api_key=GROQ_API_KEY)

    with open(chunk_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            file=(os.path.basename(chunk_path), audio_file.read()),
            model="whisper-large-v3",
            response_format="text",
        )

    return transcription


def parallel_transcribe(chunk_paths: list[str]) -> str:
    """Transcribe multiple audio chunks in parallel and concatenate results."""
    if not GROQ_API_KEY:
        return "ERROR: GROQ_API_KEY not set. Please use the live mic feature to send transcript text directly."

    if not chunk_paths:
        return ""

    results = {}

    with ThreadPoolExecutor(max_workers=4) as executor:
        future_to_index = {
            executor.submit(transcribe_chunk, path): idx
            for idx, path in enumerate(chunk_paths)
        }

        for future in as_completed(future_to_index):
            idx = future_to_index[future]
            try:
                text = future.result()
                results[idx] = text.strip() if isinstance(text, str) else str(text).strip()
            except Exception as e:
                results[idx] = f"[Transcription error for chunk {idx}: {e}]"

    # Concatenate in order
    ordered = [results[i] for i in sorted(results.keys())]
    return " ".join(ordered)
