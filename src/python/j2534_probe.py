#!/usr/bin/env python3
"""
J2534 Pass-Thru discovery and analysis-only probe (Windows-focused).

SAFETY / SCOPE
--------------
- Discovery: enumerate installed PassThru drivers from the Windows registry.
- Probe: optional PassThruOpen + PassThruReadVersion + PassThruClose only.
- NEVER: PassThruWriteMsgs for programming, flash, security access, or
  programming-related IOCTLs. This module is analysis/lab support only.

Bitness note
------------
Most classic OEM J2534 DLLs are 32-bit. Prefer a 32-bit Python interpreter
when probing real hardware. 64-bit Python may fail to load 32-bit DLLs.
"""

from __future__ import annotations

import argparse
import json
import os
import platform
import sys
from typing import Any, Dict, List, Optional


PASS_THRU_KEYS = [
    r"SOFTWARE\PassThruSupport.04.04",
    r"SOFTWARE\WOW6432Node\PassThruSupport.04.04",
    r"SOFTWARE\PassThruSupport.05.00",
    r"SOFTWARE\WOW6432Node\PassThruSupport.05.00",
]


def _emit(payload: Dict[str, Any]) -> None:
    print(json.dumps(payload, ensure_ascii=False))


def discover_registry() -> Dict[str, Any]:
    """Enumerate J2534 drivers registered on Windows. No DLL load."""
    if platform.system() != "Windows":
        return {
            "status": "unsupported_os",
            "os": platform.system(),
            "message": (
                "J2534 registry discovery is Windows-only. "
                "On Linux/macOS use SocketCAN, PEAK, Vector, or a vendor .so SDK — "
                "not classic PassThru DLLs."
            ),
            "drivers": [],
            "analysisOnly": True,
        }

    try:
        import winreg  # type: ignore
    except ImportError:
        return {
            "status": "error",
            "message": "winreg not available",
            "drivers": [],
            "analysisOnly": True,
        }

    drivers: List[Dict[str, Any]] = []
    seen_paths = set()
    errors: List[str] = []

    for root_name, root in (
        ("HKLM", winreg.HKEY_LOCAL_MACHINE),
        ("HKCU", winreg.HKEY_CURRENT_USER),
    ):
        for sub in PASS_THRU_KEYS:
            try:
                key = winreg.OpenKey(root, sub)
            except OSError as exc:
                errors.append(f"{root_name}\\{sub}: {exc}")
                continue
            try:
                i = 0
                while True:
                    try:
                        name = winreg.EnumKey(key, i)
                    except OSError:
                        break
                    i += 1
                    try:
                        dkey = winreg.OpenKey(key, name)
                    except OSError:
                        continue
                    entry: Dict[str, Any] = {
                        "name": name,
                        "registryRoot": root_name,
                        "registryPath": f"{root_name}\\{sub}\\{name}",
                    }
                    for value_name in (
                        "FunctionLibrary",
                        "Vendor",
                        "Name",
                        "ConfigApplication",
                        "CAN",
                        "ISO15765",
                        "ISO9141",
                        "J1850PWM",
                        "J1850VPW",
                    ):
                        try:
                            val, _ = winreg.QueryValueEx(dkey, value_name)
                            entry[value_name] = val
                        except OSError:
                            pass
                    try:
                        winreg.CloseKey(dkey)
                    except OSError:
                        pass
                    lib = entry.get("FunctionLibrary") or ""
                    if lib and str(lib).lower() in seen_paths:
                        continue
                    if lib:
                        seen_paths.add(str(lib).lower())
                    entry["libraryExists"] = bool(lib) and os.path.isfile(str(lib))
                    drivers.append(entry)
            finally:
                try:
                    winreg.CloseKey(key)
                except OSError:
                    pass

    return {
        "status": "ok",
        "os": platform.system(),
        "pythonBits": 64 if sys.maxsize > 2**32 else 32,
        "pythonExecutable": sys.executable,
        "driverCount": len(drivers),
        "drivers": drivers,
        "notes": [
            "Discovery only — no PassThru DLL was loaded.",
            "Prefer 32-bit Python when probing most OEM DLLs.",
            "VDA remains analysis-only: no programming/flash via J2534.",
        ],
        "registryErrorsSample": errors[:8],
        "analysisOnly": True,
    }


def _load_pass_thru(dll_path: str):
    import ctypes

    if not os.path.isfile(dll_path):
        raise FileNotFoundError(f"Library not found: {dll_path}")

    lib = ctypes.WinDLL(dll_path)
    lib.PassThruOpen.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_ulong)]
    lib.PassThruOpen.restype = ctypes.c_long
    lib.PassThruClose.argtypes = [ctypes.c_ulong]
    lib.PassThruClose.restype = ctypes.c_long
    lib.PassThruReadVersion.argtypes = [
        ctypes.c_ulong,
        ctypes.c_char_p,
        ctypes.c_char_p,
        ctypes.c_char_p,
    ]
    lib.PassThruReadVersion.restype = ctypes.c_long
    if hasattr(lib, "PassThruGetLastError"):
        lib.PassThruGetLastError.argtypes = [ctypes.c_char_p]
        lib.PassThruGetLastError.restype = ctypes.c_long
    return lib


def _last_error(lib) -> str:
    import ctypes

    if not hasattr(lib, "PassThruGetLastError"):
        return ""
    buf = ctypes.create_string_buffer(256)
    try:
        lib.PassThruGetLastError(buf)
        return buf.value.decode("utf-8", errors="replace")
    except Exception:
        return ""


def probe_library(dll_path: str, allow_open: bool = True) -> Dict[str, Any]:
    if platform.system() != "Windows":
        return {
            "status": "unsupported_os",
            "message": "PassThru DLL probe requires Windows.",
            "analysisOnly": True,
        }

    bits = 64 if sys.maxsize > 2**32 else 32
    result: Dict[str, Any] = {
        "status": "error",
        "libraryPath": dll_path,
        "pythonBits": bits,
        "pythonExecutable": sys.executable,
        "analysisOnly": True,
        "safety": {
            "allowed": [
                "PassThruOpen",
                "PassThruReadVersion",
                "PassThruClose",
                "PassThruGetLastError",
            ],
            "forbidden": [
                "PassThruWriteMsgs (programming/flash)",
                "security access / seed-key",
                "programming IOCTLs",
                "PassThruStartPeriodicMsg for actuator control",
            ],
        },
        "bitnessWarning": None
        if bits == 32
        else (
            "Running 64-bit Python. Many OEM J2534 DLLs are 32-bit and will fail to load. "
            "Set vehicleDebug.j2534.pythonPath32 to a 32-bit interpreter when possible."
        ),
    }

    try:
        lib = _load_pass_thru(dll_path)
        result["dllLoaded"] = True
    except OSError as exc:
        result["message"] = f"Failed to load DLL: {exc}"
        result["dllLoaded"] = False
        return result
    except Exception as exc:
        result["message"] = f"Load error: {exc}"
        result["dllLoaded"] = False
        return result

    if not allow_open:
        result["status"] = "ok"
        result["message"] = "DLL loaded only (open skipped)."
        result["opened"] = False
        return result

    import ctypes

    device_id = ctypes.c_ulong(0)
    rc = lib.PassThruOpen(None, ctypes.byref(device_id))
    result["PassThruOpen"] = {"returnCode": int(rc), "deviceId": int(device_id.value)}
    if rc != 0:
        result["status"] = "open_failed"
        result["message"] = _last_error(lib) or f"PassThruOpen returned {rc}"
        result["opened"] = False
        return result

    result["opened"] = True
    fw = ctypes.create_string_buffer(80)
    dll_ver = ctypes.create_string_buffer(80)
    api_ver = ctypes.create_string_buffer(80)
    rc_ver = lib.PassThruReadVersion(device_id, fw, dll_ver, api_ver)
    result["PassThruReadVersion"] = {
        "returnCode": int(rc_ver),
        "firmware": fw.value.decode("utf-8", errors="replace"),
        "dllVersion": dll_ver.value.decode("utf-8", errors="replace"),
        "apiVersion": api_ver.value.decode("utf-8", errors="replace"),
    }

    rc_close = lib.PassThruClose(device_id)
    result["PassThruClose"] = {"returnCode": int(rc_close)}
    result["status"] = "ok"
    result["message"] = (
        "Analysis-only probe complete (Open/ReadVersion/Close). "
        "No channel connect and no writes were performed."
    )
    return result


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="J2534 discovery / analysis-only probe")
    parser.add_argument(
        "action",
        choices=["discover", "probe", "probe_load_only"],
        help="discover=registry only; probe=Open/ReadVersion/Close; probe_load_only=LoadLibrary only",
    )
    parser.add_argument("--library", default="", help="Path to J2534 FunctionLibrary DLL")
    args = parser.parse_args(argv)

    stdin_cfg: Dict[str, Any] = {}
    if not sys.stdin.isatty():
        try:
            raw = sys.stdin.read()
            if raw.strip():
                stdin_cfg = json.loads(raw)
        except Exception:
            stdin_cfg = {}

    library = args.library or stdin_cfg.get("libraryPath") or stdin_cfg.get("path") or ""

    if args.action == "discover":
        _emit(discover_registry())
        return 0

    if not library:
        _emit(
            {
                "status": "error",
                "message": "libraryPath / --library is required for probe",
                "analysisOnly": True,
            }
        )
        return 1

    allow_open = args.action == "probe"
    _emit(probe_library(str(library), allow_open=allow_open))
    return 0


if __name__ == "__main__":
    sys.exit(main())
