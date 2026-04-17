---
description: Switch the active job search profile on this machine. Lists available profiles, shows which is active, and activates a different one by running setup.py. Use when multiple people share this repo (e.g. two job searchers on the same computer). Trigger with /job-user-select.
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
> "Which profile do you want to activate? Type the name exactly as shown above."

Wait for the user's response.

## Step 3 — Activate

Run:
```bash
python setup.py --profile <chosen_profile>
```

Show the output. If successful, confirm:
> "Switched to profile **[name]**. Claude Code will now use [name]'s Notion workspace."

If it fails (missing .env file or unfilled values), explain in plain language:
> "I couldn't find a profile file for '[name]'. To create it, copy the file `.env.template` to `.env.[name]` and fill in your Notion token and profile page ID. Then try again."

## Notes

- Switching profiles regenerates `.mcp.json` immediately — takes effect on the next Notion tool call.
- Each profile has its own `.env.<name>` file with a separate Notion token and profile page ID.
- To create a new profile from scratch, run `/job-user-setup`.
