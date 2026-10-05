#!/usr/bin/env python3
"""One-off: replace hardcoded Supabase URIs in archive/*.js with pg_conn_helper."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SECRET_URI = re.compile(
    r"['\"]postgresql://postgres\.ginjhaioodmaqfajtinv:[^'\"]+"
    r"@aws-0-eu-west-1\.pooler\.supabase\.com:\d+/postgres['\"]"
)
HELPER = "const { getConnectionString } = require('../../scripts/pg_conn_helper');\n"


def patch(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if not SECRET_URI.search(text):
        return False
    text = SECRET_URI.sub("getConnectionString(__dirname)", text)
    if "pg_conn_helper" not in text:
        if text.startswith("'use strict';"):
            text = text.replace("'use strict';", "'use strict';\n\n" + HELPER, 1)
        else:
            text = HELPER + text
    path.write_text(text, encoding="utf-8")
    return True


def main():
    n = 0
    for p in ROOT.rglob("*.js"):
        if "node_modules" in p.parts:
            continue
        if patch(p):
            print(p.relative_to(ROOT))
            n += 1
    print(f"Updated {n} file(s)")


if __name__ == "__main__":
    main()
