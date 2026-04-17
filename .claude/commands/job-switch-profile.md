---
description: Switch the active job search profile on this machine. Lists available profiles, shows which is active, and activates a different one by running setup.py. Use when multiple people share this repo (e.g. two job searchers on the same computer).
argument-hint: Optional profile name to switch to directly (e.g. "zack" or "sarah"). Leave blank to list profiles and pick interactively.
allowed-tools: Bash
---

# Switch Active Profile

## Step 1 — List available profiles

Run:
```bash
python setup.py --list
```

Show the output to the user.

## Step 2 — Select a profile

If `$ARGUMENTS` is a non-empty profile name → use it directly, skip asking.

Otherwise ask:
> "Which profile do you want to activate? (Type the name exactly as shown above)"

Wait for the user's response.

## Step 3 — Activate

Run:
```bash
python setup.py --profile <chosen_profile>
```

Show the output. If successful, confirm:
> "✓ Switched to profile **[name]**. Claude Code will use [name]'s Notion workspace from this session."

If it fails (missing .env file or unfilled values), show the error and explain what the user needs to do to fix it.

## Notes

- Switching profiles regenerates `.mcp.json` immediately — takes effect on next tool call.
- Each profile has its own `.env.<name>` file with a separate Notion token and profile page ID.
- To create a new profile: copy `.env.template` to `.env.<newname>` and fill in the values.
