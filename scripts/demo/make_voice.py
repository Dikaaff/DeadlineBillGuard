"""Generate the voiceover bed, caption file and timing report for the demo video."""

from __future__ import annotations

import asyncio
import json
import subprocess
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / "demo" / "work"
VOICE_DIR = WORK / "voice"
SCENES_PATH = Path(__file__).with_name("scenes.json")

SAMPLE_RATE = 48_000
CHANNELS = 1
SAMPLE_WIDTH = 2

BASE_RATE = 4
RATE_STEPS = [4, 8, 12, 16, 20, 24]


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, check=True)


def probe_duration(path: Path) -> float:
    out = run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=nk=1:nw=1",
            str(path),
        ]
    ).stdout.strip()
    return float(out)


async def _synth(text: str, voice: str, rate: int, out: Path) -> None:
    import edge_tts

    last_error: Exception | None = None
    for attempt in range(4):
        try:
            communicate = edge_tts.Communicate(text, voice, rate=f"+{rate}%")
            await communicate.save(str(out))
            if out.exists() and out.stat().st_size > 500:
                return
        except Exception as error:  # noqa: BLE001 - edge-tts raises network errors
            last_error = error
        await asyncio.sleep(0.4 * (attempt + 1))
    raise RuntimeError(f"edge-tts failed for {text!r}: {last_error}")


def synth(text: str, voice: str, rate: int, out: Path) -> None:
    asyncio.run(_synth(text, voice, rate, out))


def to_wav(src: Path, dst: Path) -> None:
    run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-i",
            str(src),
            "-ar",
            str(SAMPLE_RATE),
            "-ac",
            str(CHANNELS),
            "-c:a",
            "pcm_s16le",
            str(dst),
        ]
    )


def read_pcm(path: Path) -> bytes:
    with wave.open(str(path), "rb") as handle:
        if handle.getframerate() != SAMPLE_RATE or handle.getnchannels() != CHANNELS:
            raise RuntimeError(f"unexpected wav format in {path}")
        return handle.readframes(handle.getnframes())


def ass_time(seconds: float) -> str:
    seconds = max(0.0, seconds)
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    return f"{hours}:{minutes:02d}:{secs:05.2f}"


def main() -> int:
    config = json.loads(SCENES_PATH.read_text(encoding="utf-8"))
    voice = config.get("voice", "en-US-AndrewNeural")
    base_rate = int(str(config.get("rate", "+4%")).replace("%", "").replace("+", ""))
    duration = float(config["duration"])

    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    for stale in VOICE_DIR.glob("cue-*"):
        stale.unlink()

    scenes = config["scenes"]
    flat: list[dict] = []
    for scene in scenes:
        cues = scene["cues"]
        for index, cue in enumerate(cues):
            if index + 1 < len(cues):
                limit = float(cues[index + 1]["at"]) - 0.2
            else:
                limit = float(scene["end"]) - 0.15
            flat.append(
                {
                    "scene": scene["id"],
                    "index": len(flat) + 1,
                    "at": float(cue["at"]),
                    "text": cue["text"],
                    "limit": limit,
                }
            )

    timeline: list[dict] = []
    overflow = False
    for i, cue in enumerate(flat, start=1):
        stem = VOICE_DIR / f"cue-{i:03d}"
        mp3 = stem.with_suffix(".mp3")
        wav = stem.with_suffix(".wav")
        slot = cue["limit"] - cue["at"]
        chosen_rate = None
        chosen_duration = None
        for rate in RATE_STEPS:
            synth(cue["text"], voice, max(base_rate, rate), mp3)
            length = probe_duration(mp3)
            if length <= slot:
                chosen_rate = rate
                chosen_duration = length
                break
            print(
                f"  cue {i:02d} over slot at +{rate}%: {length:.2f}s > {slot:.2f}s",
                file=sys.stderr,
            )
        if chosen_rate is None:
            chosen_rate = RATE_STEPS[-1]
            chosen_duration = probe_duration(mp3)
            overflow = True
            print(f"  cue {i:02d} STILL OVERFLOWS: {chosen_duration:.2f}s", file=sys.stderr)
        if chosen_rate != base_rate:
            print(f"  cue {i:02d} regenerated at +{chosen_rate}%")
        to_wav(mp3, wav)
        timeline.append(
            {
                **cue,
                "rate": chosen_rate,
                "duration": round(chosen_duration, 3),
                "end": round(cue["at"] + chosen_duration, 3),
                "wav": str(wav.relative_to(ROOT)),
            }
        )
        print(f"cue {i:02d}  {chosen_duration:5.2f}s  +{chosen_rate}%  {cue['text'][:64]}")

    total_frames = int(duration * SAMPLE_RATE)
    bed = bytearray(total_frames * SAMPLE_WIDTH)
    for cue in timeline:
        pcm = read_pcm(ROOT / cue["wav"])
        start = int(cue["at"] * SAMPLE_RATE) * SAMPLE_WIDTH
        end = start + len(pcm)
        if end > len(bed):
            raise RuntimeError(f"audio overruns the {duration}s bed at {cue['text']!r}")
        bed[start:end] = pcm

    voice_path = WORK / "voiceover.wav"
    with wave.open(str(voice_path), "wb") as handle:
        handle.setnchannels(CHANNELS)
        handle.setsampwidth(SAMPLE_WIDTH)
        handle.setframerate(SAMPLE_RATE)
        handle.writeframes(bytes(bed))
    print(f"wrote {voice_path.relative_to(ROOT)} ({duration:.0f}s)")

    ass_path = WORK / "captions.ass"
    header = """[Script Info]
Title: Deadline Bill Guard demo
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Segoe UI Semibold,42,&H00FFFFFF,&H00FFFFFF,&H00101828,&H00000000,-1,0,0,0,100,100,0.2,0,1,2.5,1,2,150,150,54,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
    for cue in timeline:
        start = cue["at"]
        end = min(cue["end"] + 0.18, cue["limit"] + 0.05)
        text = cue["text"].replace("{", "(").replace("}", ")")
        lines.append(
            f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Caption,,0,0,0,,"
            f"{{\\fad(120,80)}}{text}"
        )
    ass_path.write_text(header + "\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {ass_path.relative_to(ROOT)} ({len(lines)} captions)")

    timings_path = WORK / "timings.json"
    timings_path.write_text(
        json.dumps({"duration": duration, "cues": timeline}, indent=2), encoding="utf-8"
    )
    print(f"wrote {timings_path.relative_to(ROOT)}")

    if overflow:
        print("WARNING: one or more cues still overflow their slot.", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
