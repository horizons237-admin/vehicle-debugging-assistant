#!/usr/bin/env python3
import json
import sys

result = {"ok": True, "modules": {}}

for mod in ["can", "udsoncan", "isotp"]:
    try:
        __import__(mod)
        result["modules"][mod] = True
    except ImportError:
        result["modules"][mod] = False
        result["ok"] = False

print(json.dumps(result))
