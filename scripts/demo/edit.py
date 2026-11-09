"""Assemble the demo: zoom the capture, append the end card, burn captions, mux audio."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / "demo" / "work"
OUT = ROOT / "demo" / "out"
SCENES_PATH = Path(__file__).with_name("scenes.json")
FONTS = Path("C:/Windows/Fonts")

RAW = WORK / "raw.webm"
META = WORK / "meta.json"
MAIN = WORK / "main-zoom.mp4"
ENDCARD = WORK / "endcard.mp4"
FULL = WORK / "full.mp4"
VOICE = WORK / "voiceover.wav"
CAPTIONS = WORK / "captions.ass"
FINAL = OUT / "deadline-bill-guard-demo.mp4"


def run(cmd: list[str], cwd: Path | None = None) -> None:
    print("+", " ".join(str(part) for part in cmd))
    result = subprocess.run(cmd, cwd=str(cwd or ROOT), capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stdout[-4000:])
        print(result.stderr[-8000:], file=sys.stderr)
        raise SystemExit(result.returncode)


def zoom_expression(scenes: list[dict], end: float) -> str:
    pieces = []
    for scene in scenes:
        if scene["id"] == "15-end-card":
            continue
        start = float(scene["start"])
        stop = min(float(scene["end"]), end)
        if stop <= start:
            continue
        z0, z1 = scene["zoom"]
        span = stop - start
        pieces.append(
            (
                stop,
                f"{z0}+({z1}-{z0})*(T-{start})/{span}",
            )
        )
    if not pieces:
        return "1.0"
    expression = pieces[-1][1]
    for stop, piece in reversed(pieces[:-1]):
        expression = f"if(lt(T,{stop}),{piece},{expression})"
    return expression


def build_main(lead_in: float, end: float, scenes: list[dict]) -> None:
    z = zoom_expression(scenes, end).replace("T", "(on/30)")
    video_filter = (
        "setpts=PTS-STARTPTS,"
        "fps=30,"
        "scale=2880:1620:flags=lanczos,"
        f"zoompan=z='{z}':x='(iw-iw/zoom)/2':y='0':d=1:s=1920x1080:fps=30,"
        "format=yuv420p"
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-i",
            str(RAW),
            "-ss",
            f"{lead_in:.3f}",
            "-t",
            f"{end:.3f}",
            "-vf",
            video_filter,
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "17",
            "-movflags",
            "+faststart",
            str(MAIN),
        ]
    )


def build_endcard() -> None:
    font_title = (FONTS / "georgiab.ttf").as_posix().replace(":", "\\:")
    font_body = (FONTS / "segoeui.ttf").as_posix().replace(":", "\\:")
    font_mono = (FONTS / "consola.ttf").as_posix().replace(":", "\\:")

    title = "Deadline Bill Guard"
    tagline = "Forward a bill. Get reminded. Pay with PayPal."
    repo = "github.com/Dikaaff/DeadlineBillGuard"
    footer = "PayPal Orders v2  |  AI bill extraction  |  Next.js 16"

    draw = [
        (
            f"drawtext=fontfile='{font_title}':text='{title}':fontcolor=0xF4EFE4:fontsize=96:"
            "x=(w-text_w)/2:y=400:alpha='if(lt(t,0.5),t/0.5,1)'"
        ),
        "drawbox=x=(iw-150)/2:y=552:w=150:h=3:color=0xC9882E@0.95:t=fill",
        (
            f"drawtext=fontfile='{font_body}':text='{tagline}':fontcolor=0xC7D2E2:fontsize=34:"
            "x=(w-text_w)/2:y=596:alpha='if(lt(t,0.8),0,min((t-0.8)/0.6,1))'"
        ),
        (
            f"drawtext=fontfile='{font_mono}':text='{repo}':fontcolor=0x8FB8FF:fontsize=34:"
            "x=(w-text_w)/2:y=686:alpha='if(lt(t,1.4),0,min((t-1.4)/0.6,1))'"
        ),
        (
            f"drawtext=fontfile='{font_body}':text='{footer}':fontcolor=0x7C8AA0:fontsize=22:"
            "x=(w-text_w)/2:y=762:alpha='if(lt(t,1.9),0,min((t-1.9)/0.6,1))'"
        ),
    ]
    video_filter = (
        "drawbox=x=0:y=0:w=iw:h=ih:color=0x050A12@0.28:t=fill,"
        + ",".join(draw)
        + ",fade=t=in:st=0:d=0.55,fade=t=out:st=11.35:d=0.65,format=yuv420p"
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-f",
            "lavfi",
            "-i",
            "gradients=s=1920x1080:r=30:d=12:c0=0x0A1322:c1=0x172A48:x0=0:y0=0:x1=1920:y1=1080:t=radial:speed=0.004",
            "-vf",
            video_filter,
            "-t",
            "12",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "17",
            "-movflags",
            "+faststart",
            str(ENDCARD),
        ]
    )


def concat() -> None:
    listing = WORK / "concat.txt"
    listing.write_text(
        "file 'main-zoom.mp4'\nfile 'endcard.mp4'\n", encoding="utf-8"
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            "concat.txt",
            "-c",
            "copy",
            "-movflags",
            "+faststart",
            "full.mp4",
        ],
        cwd=WORK,
    )


def mux() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    video_filter = "ass=captions.ass"
    run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-i",
            "full.mp4",
            "-i",
            "voiceover.wav",
            "-vf",
            video_filter,
            "-af",
            "loudnorm=I=-16:TP=-1.5:LRA=11",
            "-c:v",
            "libx264",
            "-preset",
            "slow",
            "-crf",
            "18",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-ar",
            "48000",
            "-movflags",
            "+faststart",
            "-shortest",
            str(FINAL),
        ],
        cwd=WORK,
    )


def verify() -> None:
    probe = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration,size,bit_rate",
            "-show_entries",
            "stream=index,codec_type,codec_name,width,height,r_frame_rate",
            "-of",
            "json",
            str(FINAL),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    print(probe.stdout)
    frames = WORK / "frames"
    frames.mkdir(exist_ok=True)
    for seconds in (2, 10, 30, 70, 95, 118, 130, 150, 160, 170):
        run(
            [
                "ffmpeg",
                "-y",
                "-v",
                "error",
                "-ss",
                str(seconds),
                "-i",
                str(FINAL),
                "-frames:v",
                "1",
                "-q:v",
                "2",
                str(frames / f"check-{seconds:03d}.jpg"),
            ]
        )


def main() -> int:
    config = json.loads(SCENES_PATH.read_text(encoding="utf-8"))
    scenes = config["scenes"]
    end = float(config["endCardStart"])
    meta = json.loads(META.read_text(encoding="utf-8"))
    lead_in = float(meta["leadIn"])

    print(f"lead-in {lead_in:.2f}s, main {end:.0f}s, end card 12s")
    build_main(lead_in, end, scenes)
    build_endcard()
    concat()
    mux()
    verify()
    print(f"done: {FINAL}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
