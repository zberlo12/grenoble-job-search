"""
populate_cv.py — Fill the CV template for a specific job application.

Reads the "Tailored CV" section from a Notion application document page,
extracts the headline and profile summary, fills them into cv_template.docx,
and saves a finished .docx ready for formatting review.

Usage:
    py scripts/populate_cv.py <notion_page_id>
    py scripts/populate_cv.py <notion_page_id> "Company_JobTitle"  # custom filename

Notion token: read from .mcp.json in the repo root, or set NOTION_API_TOKEN env var.

Example:
    py scripts/populate_cv.py 3412fc3ca02a813a8315fb6fd0a2304e
"""

import sys
import os
import json
import re
from pathlib import Path
from docx import Document
from notion_client import Client

TEMPLATE = r"C:\Users\zberl\OneDrive\Documents\France Job Applications\2026\WORD VERSION FOR EDIT\cv_template.docx"
OUTPUT_DIR = r"C:\Users\zberl\OneDrive\Documents\France Job Applications\2026\Output CVs"

REPO_ROOT = Path(__file__).parent.parent


def get_notion_token():
    """Read Notion token from NOTION_API_TOKEN env var or .mcp.json."""
    token = os.environ.get("NOTION_API_TOKEN")
    if token:
        return token
    mcp_path = REPO_ROOT / ".mcp.json"
    if mcp_path.exists():
        with open(mcp_path) as f:
            data = json.load(f)
        try:
            return data["mcpServers"]["notion"]["env"]["NOTION_API_TOKEN"]
        except KeyError:
            pass
    print("ERROR: No Notion token found.")
    print("  Set NOTION_API_TOKEN env var, or ensure .mcp.json exists with the token.")
    sys.exit(1)


def fetch_page_blocks(notion, page_id):
    """Fetch all blocks from a Notion page, handling pagination."""
    blocks = []
    cursor = None
    while True:
        response = notion.blocks.children.list(block_id=page_id, start_cursor=cursor)
        blocks.extend(response["results"])
        if not response["has_more"]:
            break
        cursor = response["next_cursor"]
    return blocks


def block_text(block):
    """Extract plain text from a Notion block."""
    btype = block["type"]
    rich_text = block.get(btype, {}).get("rich_text", [])
    return "".join(rt.get("plain_text", "") for rt in rich_text)


def extract_cv_section(blocks):
    """
    Extract lines from the 'Tailored CV' section of the Notion page.
    Returns a list of non-empty text strings until the next h2 section.
    """
    in_cv = False
    lines = []

    for block in blocks:
        btype = block["type"]
        text = block_text(block).strip()

        if btype == "heading_2" and "Tailored CV" in text:
            in_cv = True
            continue

        if in_cv:
            if btype == "heading_2":
                break  # Hit the next section (Cover Letter)
            if text:
                lines.append(text)

    return lines


def parse_headline_and_summary(cv_lines):
    """
    Parse the CV headline and profile summary from the CV section lines.

    Expected structure (as drafted by /job-apply):
      Line 0: CV headline (short — the tailored job title variant)
      Later:  Profile summary (the longest paragraph-style line)
    """
    if not cv_lines:
        return None, None

    headline = cv_lines[0]

    # Profile summary: first line over 100 chars that isn't a section header or bullet
    summary = None
    for line in cv_lines[1:]:
        if len(line) > 100 and not line.startswith("##") and not line.startswith("-"):
            summary = line
            break

    # Fallback: second line if no long paragraph found
    if not summary and len(cv_lines) > 1:
        summary = cv_lines[1]

    return headline, summary


def replace_placeholder(cell, placeholder, new_text):
    """Replace a {{placeholder}} in a table cell, preserving run formatting."""
    for para in cell.paragraphs:
        for run in para.runs:
            if placeholder in run.text:
                run.text = run.text.replace(placeholder, new_text)
                return True
    return False


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    page_id = sys.argv[1].replace("-", "")  # accept UUID with or without dashes
    custom_name = sys.argv[2] if len(sys.argv) >= 3 else None

    token = get_notion_token()
    notion = Client(auth=token)

    print(f"Fetching Notion page {page_id}...")
    try:
        page_meta = notion.pages.retrieve(page_id=page_id)
    except Exception as e:
        print(f"ERROR fetching page: {e}")
        sys.exit(1)

    # Get page title for default filename
    title_prop = page_meta.get("properties", {}).get("title", {}).get("title", [])
    page_title = "".join(t.get("plain_text", "") for t in title_prop)
    if not page_title:
        # Try child_page type
        page_title = page_meta.get("child_page", {}).get("title", "CV_output")

    print(f"Page title: {page_title}")

    blocks = fetch_page_blocks(notion, page_id)
    cv_lines = extract_cv_section(blocks)

    if not cv_lines:
        print("ERROR: 'Tailored CV' section not found in the Notion page.")
        print("       Make sure this is an Application Document page created by /job-apply.")
        sys.exit(1)

    headline, summary = parse_headline_and_summary(cv_lines)

    print(f"\nExtracted:")
    print(f"  Headline : {headline}")
    print(f"  Summary  : {summary[:80]}..." if summary and len(summary) > 80 else f"  Summary  : {summary}")

    if not os.path.exists(TEMPLATE):
        print(f"\nERROR: Template not found at:\n  {TEMPLATE}")
        print("Run 'py scripts/make_cv_template.py' first to create it.")
        sys.exit(1)

    doc = Document(TEMPLATE)
    table = doc.tables[0]
    right_cell = table.rows[0].cells[1]

    h_ok = replace_placeholder(right_cell, "{{CV_HEADLINE}}", headline or "")
    s_ok = replace_placeholder(right_cell, "{{PROFILE_SUMMARY}}", summary or "")

    if not h_ok:
        print("WARNING: {{CV_HEADLINE}} placeholder not found in template.")
    if not s_ok:
        print("WARNING: {{PROFILE_SUMMARY}} placeholder not found in template.")

    # Build output filename
    if custom_name:
        filename = custom_name if custom_name.endswith(".docx") else custom_name + ".docx"
    else:
        safe_title = re.sub(r'[<>:"/\\|?*]', "", page_title).strip()
        filename = safe_title + ".docx" if safe_title else "CV_output.docx"

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_DIR, filename)
    doc.save(output_path)

    print(f"\nDone. CV saved to:\n  {output_path}")


if __name__ == "__main__":
    main()
