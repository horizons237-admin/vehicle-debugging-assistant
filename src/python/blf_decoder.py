#!/usr/bin/env python3
"""
Lightweight BLF decoder (Vector Binary Logging Format) - CAN subset.

Based on community layout used by python-can / vector_blf (no official public full spec).
Supports: file header, LOG_CONTAINER (zlib), CAN_MESSAGE, CAN_MESSAGE2, CAN_FD_MESSAGE (basic).
"""
from __future__ import annotations

import argparse
import json
import struct
import sys
import zlib
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

OBJ_LOG_CONTAINER = 10
OBJ_CAN_MESSAGE = 1
OBJ_CAN_ERROR = 2
OBJ_CAN_OVERLOAD = 3
OBJ_CAN_MESSAGE2 = 86
OBJ_CAN_FD_MESSAGE = 100
OBJ_CAN_FD_MESSAGE_64 = 101
OBJ_GLOBAL_MARKER = 96

FILE_HEADER_SIZE = 144


def _u16(data: bytes, off: int) -> int:
    return struct.unpack_from("<H", data, off)[0]


def _u32(data: bytes, off: int) -> int:
    return struct.unpack_from("<I", data, off)[0]


def _u64(data: bytes, off: int) -> int:
    return struct.unpack_from("<Q", data, off)[0]


def parse_file_header(data: bytes) -> Dict[str, Any]:
    if len(data) < 64:
        raise ValueError("BLF header too short")
    if data[0:4] != b"LOGG":
        raise ValueError(f"Not BLF (sig={data[0:4]!r})")
    header_size = _u32(data, 4) if len(data) >= 8 else FILE_HEADER_SIZE
    fmt = "<4sLBBBBBBBBQQLL"
    need = struct.calcsize(fmt)
    if len(data) < need:
        raise ValueError("Truncated BLF header")
    h = struct.unpack_from(fmt, data, 0)
    return {
        "signature": "LOGG",
        "headerSize": h[1],
        "applicationId": h[2],
        "appVersion": f"{h[3]}.{h[4]}.{h[5]}",
        "binLogVersion": f"{h[6]}.{h[7]}.{h[8]}.{h[9]}",
        "fileSize": h[10],
        "uncompressedSize": h[11],
        "objectCount": h[12],
        "headerBytes": max(header_size, FILE_HEADER_SIZE),
    }


def _parse_obj_header(buf: bytes, pos: int) -> Optional[Tuple[int, int, int, int, int]]:
    if pos + 16 > len(buf):
        return None
    if buf[pos : pos + 4] != b"LOBJ":
        return None
    header_size = _u16(buf, pos + 4)
    header_version = _u16(buf, pos + 6)
    obj_size = _u32(buf, pos + 8)
    obj_type = _u32(buf, pos + 12)
    payload_start = pos + header_size
    return pos, header_size, obj_size, obj_type, payload_start


def _timestamp_ns(buf: bytes, pos: int, header_size: int, header_version: int) -> int:
    try:
        if header_version == 1 and header_size >= 32:
            return _u64(buf, pos + 24)
        if header_size >= 32:
            return _u64(buf, pos + 24)
    except Exception:
        pass
    return 0


def _decode_can_payload(obj_type: int, payload: bytes) -> Optional[Dict[str, Any]]:
    if obj_type == OBJ_CAN_MESSAGE and len(payload) >= 16:
        channel, flags, dlc, can_id = struct.unpack_from("<HBBI", payload, 0)
        data = payload[8 : 8 + min(dlc, 8)]
        return {
            "channel": channel,
            "id": can_id & 0x1FFFFFFF,
            "extended": bool(can_id & 0x80000000),
            "dlc": dlc,
            "data": data.hex(" "),
            "is_fd": False,
        }
    if obj_type == OBJ_CAN_MESSAGE2 and len(payload) >= 16:
        channel, flags, dlc, can_id = struct.unpack_from("<HBBI", payload, 0)
        data_off = 16 if len(payload) >= 24 else 8
        data = payload[data_off : data_off + min(dlc, 8)]
        if len(data) < min(dlc, 8) and len(payload) >= 8 + min(dlc, 8):
            data = payload[8 : 8 + min(dlc, 8)]
        return {
            "channel": channel,
            "id": can_id & 0x1FFFFFFF,
            "extended": bool(can_id & 0x80000000),
            "dlc": dlc,
            "data": data.hex(" "),
            "is_fd": False,
        }
    if obj_type in (OBJ_CAN_FD_MESSAGE, OBJ_CAN_FD_MESSAGE_64) and len(payload) >= 20:
        channel = _u16(payload, 0)
        dlc = payload[2] if len(payload) > 2 else 0
        can_id = _u32(payload, 4) if len(payload) >= 8 else 0
        data_off = 20
        max_len = 64
        data = payload[data_off : data_off + min(max_len, max(0, len(payload) - data_off))]
        return {
            "channel": channel,
            "id": can_id & 0x1FFFFFFF,
            "extended": bool(can_id & 0x80000000),
            "dlc": dlc,
            "data": data[:64].hex(" "),
            "is_fd": True,
        }
    return None


def _iter_objects(buf: bytes) -> List[Dict[str, Any]]:
    frames: List[Dict[str, Any]] = []
    pos = 0
    n = len(buf)
    while pos + 16 <= n:
        if buf[pos : pos + 4] != b"LOBJ":
            pos += 1
            continue
        header_size = _u16(buf, pos + 4)
        header_version = _u16(buf, pos + 6)
        obj_size = _u32(buf, pos + 8)
        obj_type = _u32(buf, pos + 12)
        if obj_size < 16:
            pos += 4
            continue
        end = pos + obj_size
        if end > n:
            break
        ts = _timestamp_ns(buf, pos, header_size, header_version)
        payload = buf[pos + header_size : end]

        if obj_type == OBJ_LOG_CONTAINER:
            if len(payload) >= 16:
                method = _u16(payload, 0)
                comp = payload[16:] if len(payload) > 16 else payload
                try:
                    if method == 2:
                        raw = zlib.decompress(comp)
                    elif method == 0:
                        raw = comp
                    else:
                        try:
                            raw = zlib.decompress(comp)
                        except Exception:
                            raw = comp
                    frames.extend(_iter_objects(raw))
                except Exception:
                    pass
            pos = end
            while pos % 4 and pos < n:
                pos += 1
            continue

        if obj_type in (
            OBJ_CAN_MESSAGE,
            OBJ_CAN_MESSAGE2,
            OBJ_CAN_FD_MESSAGE,
            OBJ_CAN_FD_MESSAGE_64,
        ):
            can = _decode_can_payload(obj_type, payload)
            if can:
                f_ts = ts / 1e9 if ts >= 1e9 else float(ts)
                frames.append({"ts_ns": ts, "ts": f_ts, **can})

        pos = end
        while pos % 4 and pos < n:
            pos += 1
    return frames


def decode_blf(path: str, limit: int = 10000) -> Dict[str, Any]:
    data = Path(path).read_bytes()
    header = parse_file_header(data[:FILE_HEADER_SIZE])
    body = data[header["headerBytes"] :]
    frames = _iter_objects(body)
    if limit and len(frames) > limit:
        frames = frames[:limit]
    if frames:
        t0 = frames[0]["ts"]
        for f in frames:
            f["ts_rel"] = f["ts"] - t0
    return {
        "status": "ok",
        "decoder": "vda-blf-lite",
        "header": header,
        "frameCount": len(frames),
        "frames": frames,
    }


def frames_to_text(frames: List[Dict[str, Any]]) -> str:
    lines = ["# VDA BLF lite decode"]
    for f in frames:
        ts = f.get("ts_rel", f.get("ts", 0))
        lines.append(f"{ts:.6f}  0x{f['id']:X}  {f.get('data', '')}")
    return "\n".join(lines) + "\n"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("action", choices=["decode", "analyze"])
    args = ap.parse_args()
    cfg = json.loads(sys.stdin.read() or "{}")
    path = cfg.get("path")
    limit = int(cfg.get("limit", 10000))
    if not path or not Path(path).is_file():
        print(json.dumps({"status": "error", "message": "path required"}))
        sys.exit(2)
    try:
        result = decode_blf(path, limit)
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)
    if args.action == "decode":
        print(json.dumps(result, ensure_ascii=False))
        return
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from can_flow_analyzer import analyze_text  # type: ignore

    text = frames_to_text(result.get("frames") or [])
    analysis = analyze_text(text)
    print(
        json.dumps(
            {
                "status": "ok",
                "decoder": "vda-blf-lite",
                "header": result.get("header"),
                "frameCount": result.get("frameCount"),
                "analysis": analysis,
                "framesPreview": (result.get("frames") or [])[:30],
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
