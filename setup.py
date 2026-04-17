#!/usr/bin/env python3
"""
Generate .mcp.json from a profile .env file.

Usage:
  python setup.py --profile zack       # activate profile 'zack' (reads .env.zack)
  python setup.py                      # re-activate the last used profile
  python setup.py --list               # list available profiles
"""

import json
import sys
import argparse
from pathlib import Path

REPO_ROOT = Path(__file__).parent
ACTIVE_PROFILE_FILE = REPO_ROOT / ".active-profile"
MCP_JSON_PATH = REPO_ROOT / ".mcp.json"


def list_profiles():
    profiles = [f.name.replace(".env.", "") for f in REPO_ROOT.glob(".env.*")
                if f.name != ".env.template"]
    return sorted(profiles)


def read_env_file(path: Path) -> dict:
    env = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            env[key.strip()] = value.strip()
    return env


def validate(env: dict, profile_name: str, env_file: Path):
    required = ["NOTION_API_TOKEN", "NOTION_CONFIG_PAGE_ID"]
    missing = []
    for key in required:
        val = env.get(key, "")
        if not val or val.startswith("your_") or val.startswith("secret_your"):
            missing.append(key)
    if missing:
        print(f"\nERRMissing or unfilled values in {env_file.name}:")
        for k in missing:
            print(f"   - {k}")
        print(f"\n   Open {env_file.name} and fill in the real values, then re-run.")
        sys.exit(1)


def generate_mcp_json(env: dict, profile: str):
    config = {
        "mcpServers": {
            "notion": {
                "command": "npx",
                "args": ["-y", "@notionhq/notion-mcp-server"],
                "env": {
                    "NOTION_API_TOKEN": env["NOTION_API_TOKEN"]
                }
            }
        },
        "notion_config_page_id": env["NOTION_CONFIG_PAGE_ID"],
        "active_profile": profile
    }
    MCP_JSON_PATH.write_text(json.dumps(config, indent=2), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Activate a job search profile")
    parser.add_argument("--profile", "-p", help="Profile name (e.g. zack, sarah)")
    parser.add_argument("--list", "-l", action="store_true", help="List available profiles")
    args = parser.parse_args()

    if args.list:
        profiles = list_profiles()
        active = ACTIVE_PROFILE_FILE.read_text().strip() if ACTIVE_PROFILE_FILE.exists() else None
        print("\nAvailable profiles:")
        for p in profiles:
            marker = " (active)" if p == active else ""
            print(f"  {p}{marker}")
        if not profiles:
            print("  (none — copy .env.template to .env.<yourname> to create one)")
        print()
        return

    # Determine which profile to use
    if args.profile:
        profile = args.profile
    elif ACTIVE_PROFILE_FILE.exists():
        profile = ACTIVE_PROFILE_FILE.read_text().strip()
        print(f"No --profile given, re-activating last profile: {profile}")
    else:
        print("Error: no profile specified and no active profile found.")
        print("Run:  python setup.py --profile <yourname>")
        sys.exit(1)

    env_file = REPO_ROOT / f".env.{profile}"
    if not env_file.exists():
        print(f"\nERRFile not found: {env_file.name}")
        print(f"   Copy .env.template to {env_file.name} and fill in your values.")
        sys.exit(1)

    env = read_env_file(env_file)
    validate(env, profile, env_file)
    generate_mcp_json(env, profile)
    ACTIVE_PROFILE_FILE.write_text(profile, encoding="utf-8")

    print(f"\nOK Profile activated: {profile}")
    print(f"OK .mcp.json written")
    print(f"OK Notion config page: {env['NOTION_CONFIG_PAGE_ID']}")
    print(f"\n   Start Claude Code and run /job-dashboard to verify.\n")


if __name__ == "__main__":
    main()
