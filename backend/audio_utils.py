import os
import tempfile
from pydub import AudioSegment


def convert_audio(input_path: str) -> str:
    """Convert any audio file to WAV format. Returns path to the WAV file."""
    try:
        audio = AudioSegment.from_file(input_path)
        output_path = os.path.splitext(input_path)[0] + "_converted.wav"
        audio.export(output_path, format="wav")
        return output_path
    except Exception as e:
        raise RuntimeError(f"Audio conversion failed: {e}")


def split_audio(wav_path: str, chunk_duration_ms: int = 25000) -> list[str]:
    """Split a WAV file into chunks of specified duration. Returns list of chunk file paths.
    Limits to 10 chunks max (about 4 minutes of audio at 25s chunks).
    """
    chunk_paths = []
    try:
        audio = AudioSegment.from_wav(wav_path)
        total_duration = len(audio)
        max_chunks = 10

        chunks_needed = min(
            (total_duration + chunk_duration_ms - 1) // chunk_duration_ms,
            max_chunks,
        )

        temp_dir = tempfile.mkdtemp(prefix="meeting_chunks_")

        for i in range(chunks_needed):
            start = i * chunk_duration_ms
            end = min(start + chunk_duration_ms, total_duration)
            chunk = audio[start:end]

            chunk_path = os.path.join(temp_dir, f"chunk_{i:03d}.wav")
            chunk.export(chunk_path, format="wav")
            chunk_paths.append(chunk_path)

        return chunk_paths

    except Exception as e:
        # Clean up any chunks created before the error
        cleanup_files(chunk_paths)
        raise RuntimeError(f"Audio splitting failed: {e}")


def cleanup_files(file_paths: list[str]) -> None:
    """Remove temporary files. Silently ignores missing files."""
    for path in file_paths:
        try:
            if os.path.exists(path):
                os.remove(path)
        except OSError:
            pass

    # Also try to remove parent directories if they're temp chunk dirs
    dirs_to_remove = set()
    for path in file_paths:
        parent = os.path.dirname(path)
        if "meeting_chunks_" in parent:
            dirs_to_remove.add(parent)

    for d in dirs_to_remove:
        try:
            if os.path.isdir(d):
                os.rmdir(d)
        except OSError:
            pass
