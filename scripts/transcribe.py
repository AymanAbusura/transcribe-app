#!/usr/bin/env python3
"""
Transcribes an audio file using faster-whisper and prints JSON to stdout.

Usage:
    python3 scripts/transcribe.py <audio_path> [--model base] [--language en]

Requires:
    pip install faster-whisper
"""
import sys
import json
import argparse


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("audio_path")
    parser.add_argument("--model", default="base", help="tiny, base, small, medium, large-v3")
    parser.add_argument("--language", default=None, help="e.g. en, fr, es. Omit to auto-detect")
    args = parser.parse_args()

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print(json.dumps({
            "error": "faster-whisper not installed. Run: pip install faster-whisper"
        }))
        sys.exit(1)

    try:
        # CPU by default; change device="cuda" if you have a GPU + CUDA set up
        model = WhisperModel(args.model, device="cpu", compute_type="int8")

        segments, info = model.transcribe(args.audio_path, language=args.language, beam_size=5)

        full_text = []
        segment_list = []
        for seg in segments:
            full_text.append(seg.text.strip())
            segment_list.append({
                "start": seg.start,
                "end": seg.end,
                "text": seg.text.strip(),
            })

        result = {
            "text": " ".join(full_text).strip(),
            "language": info.language,
            "segments": segment_list,
        }
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
