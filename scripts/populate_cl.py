"""
populate_cl.py — Fill the cover letter template for a specific job application.

Reads the "Cover Letter" and "Application Notes" sections from a Notion
application document page, maps the paragraphs to placeholders, and saves
a finished .docx to the Output CLs folder.

Usage:
    py scripts/populate_cl.py <notion_page_id>
    py scripts/populate_cl.py <notion_page_id> "Company_JobTitle"
    py scripts/populate_cl.py <notion_page_id> --lang fr           # French template (default)
    py scripts/populate_cl.py <notion_page_id> --lang en           # English template

Templates:
    FR (default): cl_template.docx     (French CL layout — Raydiall base)
    EN:           cl_template_en.docx  (English CL layout — create when first needed)

The Notion page must be an Application Document page created by /job-apply.
It expects these sections: ## Cover Letter and ## Application Notes.

Notion token: read from .mcp.json in the repo root, or set NOTION_API_TOKEN env var.
"""

import sys
import os
import json
import re
from datetime import date
from pathlib import Path
from docx import Document
from notion_client import Client

TEMPLATES = {
    "fr": r"C:\Users\zberl\OneDrive\Documents\France Job Applications\2026\WORD VERSION FOR EDIT\cl_template.docx",
    "en": r"C:\Users\zberl\OneDrive\Documents\France Job Applications\2026\WORD VERSION FOR EDIT\cl_template_en.docx",
}
OUTPUT_DIR = r"C:\Users\zberl\OneDrive\Documents\France Job Applications\2026\Output CLs"

REPO_ROOT = Path(__file__).parent.parent

MONTHS_FR = {
    1: "janvier", 2: "février", 3: "mars", 4: "avril",
    5: "mai", 6: "juin", 7: "juillet", 8: "août",
    9: "septembre", 10: "octobre", 11: "novembre", 12: "décembre",
}


def get_notion_token():
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
    btype = block["type"]
    rich_text = block.get(btype, {}).get("rich_text", [])
    return "".join(rt.get("plain_text", "") for rt in rich_text)


def extract_section(blocks, section_heading):
    """Extract lines from a ## section until the next ## section."""
    in_section = False
    lines = []
    for block in blocks:
        btype = block["type"]
        text = block_text(block).strip()
        if btype == "heading_2" and section_heading in text:
            in_section = True
            continue
        if in_section:
            if btype == "heading_2":
                break
            if text:
                lines.append(text)
    return lines


def parse_application_notes(lines):
    """
    Extract company, job title, and location from Application Notes section.
    Looks for lines like:
      **Role:** Job Title @ Company
      **Location/Zone:** Voiron (38)
    """
    company = ""
    job_title = ""
    location = ""
    for line in lines:
        if "**Role:**" in line or "Role:" in line:
            # "Finance Director @ RAYDIALL" or "**Role:** title @ company"
            clean = re.sub(r"\*\*Role:\*\*", "", line).strip()
            if "@" in clean:
                parts = clean.split("@", 1)
                job_title = parts[0].strip()
                company = parts[1].strip()
        if "**Location" in line or "Location" in line:
            clean = re.sub(r"\*\*Location[^:]*:\*\*", "", line).strip()
            # Remove zone emoji if present
            clean = re.sub(r"[🟢🟡🟠🔴🌐]", "", clean).strip()
            location = clean.split("·")[0].strip()  # take city part before any ·
    return company, job_title, location


def french_date():
    today = date.today()
    return f"Grenoble, le {today.day} {MONTHS_FR[today.month]} {today.year}"


def replace_placeholder(doc, placeholder, new_text):
    """Replace a placeholder anywhere in the document (paragraphs + tables)."""
    replaced = False

    # Top-level paragraphs
    for para in doc.paragraphs:
        for run in para.runs:
            if placeholder in run.text:
                run.text = run.text.replace(placeholder, new_text)
                replaced = True

    # Tables
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for para in cell.paragraphs:
                    for run in para.runs:
                        if placeholder in run.text:
                            run.text = run.text.replace(placeholder, new_text)
                            replaced = True

    return replaced


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    # Parse args: page_id [custom_name] [--lang fr|en]
    args = sys.argv[1:]
    lang = "fr"
    if "--lang" in args:
        idx = args.index("--lang")
        lang = args[idx + 1].lower() if idx + 1 < len(args) else "fr"
        args = [a for i, a in enumerate(args) if i != idx and i != idx + 1]

    if lang not in TEMPLATES:
        print(f"ERROR: Unknown language '{lang}'. Use 'fr' or 'en'.")
        sys.exit(1)

    page_id = args[0].replace("-", "")
    custom_name = args[1] if len(args) >= 2 else None
    template_path = TEMPLATES[lang]

    token = get_notion_token()
    notion = Client(auth=token)

    print(f"Fetching Notion page {page_id}...")
    try:
        page_meta = notion.pages.retrieve(page_id=page_id)
    except Exception as e:
        print(f"ERROR fetching page: {e}")
        sys.exit(1)

    title_prop = page_meta.get("properties", {}).get("title", {}).get("title", [])
    page_title = "".join(t.get("plain_text", "") for t in title_prop)
    print(f"Page title: {page_title}")

    blocks = fetch_page_blocks(notion, page_id)

    # Extract Cover Letter section
    cl_lines = extract_section(blocks, "Cover Letter")
    if not cl_lines:
        print("ERROR: 'Cover Letter' section not found in the Notion page.")
        sys.exit(1)

    # Extract Application Notes for addressee/location/title
    notes_lines = extract_section(blocks, "Application Notes")
    company, job_title, location = parse_application_notes(notes_lines)

    # Extract CV headline from Tailored CV section (reuse for CL header)
    cv_lines = extract_section(blocks, "Tailored CV")
    cl_headline = cv_lines[0] if cv_lines else job_title

    # Map CL paragraphs to placeholders
    # Expected order: opening, body1, body2, body3 (optional), closing
    cl_paras = [l for l in cl_lines if len(l) > 30]  # filter out short/empty lines

    opening = cl_paras[0] if len(cl_paras) > 0 else ""
    body1   = cl_paras[1] if len(cl_paras) > 1 else ""
    body2   = cl_paras[2] if len(cl_paras) > 2 else ""
    body3   = cl_paras[3] if len(cl_paras) > 3 else ""
    closing = cl_paras[4] if len(cl_paras) > 4 else (cl_paras[3] if len(cl_paras) > 3 else "")

    # If only 4 paras: opening, body1, body2, closing (no body3)
    if len(cl_paras) == 4:
        body3   = ""
        closing = cl_paras[3]

    print(f"\nExtracted:")
    print(f"  Company    : {company}")
    print(f"  Job title  : {job_title}")
    print(f"  Location   : {location}")
    print(f"  CL headline: {cl_headline}")
    print(f"  Paragraphs : {len(cl_paras)}")
    print(f"  Opening    : {opening[:60]}...")

    print(f"  Language   : {lang.upper()} -> {Path(template_path).name}")

    if not os.path.exists(template_path):
        script = "make_cl_template.py" if lang == "fr" else "make_cl_template_en.py"
        print(f"\nERROR: Template not found: {template_path}")
        print(f"Run 'py scripts/{script}' first.")
        sys.exit(1)

    doc = Document(template_path)

    replacements = {
        "{{CL_HEADLINE}}":       cl_headline,
        "{{DATE}}":              french_date(),
        "{{COMPANY_ADDRESSEE}}": f"{company} — Service Recrutement" if company else "{{COMPANY_ADDRESSEE}}",
        "{{COMPANY_LOCATION}}":  location,
        "{{SUBJECT_LINE}}":      f"Objet : Candidature — {job_title}" if job_title else "{{SUBJECT_LINE}}",
        "{{OPENING_PARA}}":      opening,
        "{{BODY_PARA_1}}":       body1,
        "{{BODY_PARA_2}}":       body2,
        "{{BODY_PARA_3}}":       body3,
        "{{CLOSING_PARA}}":      closing,
    }

    for placeholder, value in replacements.items():
        ok = replace_placeholder(doc, placeholder, value)
        status = "✓" if ok else "✗ NOT FOUND"
        print(f"  {placeholder}: {status}")

    # Output filename
    if custom_name:
        filename = custom_name if custom_name.endswith(".docx") else custom_name + ".docx"
    else:
        safe_title = re.sub(r'[<>:"/\\|?*]', "", page_title).strip()
        filename = (safe_title + "_CL.docx") if safe_title else "CL_output.docx"

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_DIR, filename)
    doc.save(output_path)
    print(f"\nDone. CL saved to:\n  {output_path}")


if __name__ == "__main__":
    main()
