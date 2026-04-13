"""
import_examples_to_notion.py — One-time import of existing CV and CL Word files to Notion.

Reads all .docx files from the CV and CL example directories, extracts plain text,
and creates sub-pages in Notion:
  - CVs  → sub-pages under CV Templates  (3412fc3ca02a819e9d52fe0a393f2d23)
  - CLs  → sub-pages under CL Examples   (3412fc3ca02a81379fd2c383f0f8e467)

These pages give /job-apply rich style and content reference for future applications.

Usage:
    py scripts/import_examples_to_notion.py           # import all, skip already-existing
    py scripts/import_examples_to_notion.py --dry-run # preview titles without writing

Notion token: read from .mcp.json in the repo root, or set NOTION_API_TOKEN env var.
"""

import sys
import os
import json
import re
from pathlib import Path
from docx import Document
from notion_client import Client

# --- Paths ---
CV_DIR = r"C:\Users\zberl\OneDrive\Documents\France Job Applications\2026\CV examples word"
CL_DIR = r"C:\Users\zberl\OneDrive\Documents\France Job Applications\2026\CL examples Word"

# --- Notion parent page IDs ---
CV_TEMPLATES_PARENT = "3412fc3ca02a819e9d52fe0a393f2d23"   # CV Templates page
CL_EXAMPLES_PARENT  = "3412fc3ca02a81379fd2c383f0f8e467"   # CL Examples page

REPO_ROOT = Path(__file__).parent.parent


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


def filename_to_title(filename, doc_type):
    """
    Convert a filename to a clean Notion page title.

    CV examples:
      Zack_CV_Raydiall_RAF_FR.docx       -> "CV — Raydiall — RAF (FR)"
      Zack_CV_SiemensEnergy_FinanceHead_EN.docx -> "CV — Siemens Energy — Finance Head (EN)"

    CL examples:
      LM_Raydiall_RAF_FR.docx            -> "CL — Raydiall — RAF (FR)"
      LM_ESRF_HeadOfFinance_EN.docx      -> "CL — ESRF — Head Of Finance (EN)"
      CL_English_revised.docx            -> "CL — English (revised)"
    """
    stem = Path(filename).stem

    # Detect language suffix
    lang = ""
    if stem.endswith("_FR"):
        lang = "FR"
        stem = stem[:-3]
    elif stem.endswith("_EN"):
        lang = "EN"
        stem = stem[:-3]

    # Strip leading prefix
    if stem.startswith("Zack_CV_"):
        stem = stem[len("Zack_CV_"):]
    elif stem.startswith("LM_"):
        stem = stem[len("LM_"):]
    elif stem.startswith("CL_"):
        stem = stem[len("CL_"):]

    # Insert spaces before capital letters that follow lowercase (camelCase split)
    # e.g. SiemensEnergy -> Siemens Energy, HeadOfFinance -> Head Of Finance
    spaced = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", stem)

    # Replace remaining underscores with " — "
    parts = [p.strip() for p in spaced.split("_") if p.strip()]

    prefix = "CV" if doc_type == "cv" else "CL"

    if lang:
        return f"{prefix} — {' — '.join(parts)} ({lang})"
    else:
        return f"{prefix} — {' — '.join(parts)}"


def extract_docx_text(filepath):
    """Extract all text from a .docx file (handles tables and paragraphs)."""
    doc = Document(filepath)
    lines = []

    body = doc.element.body
    NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

    for child in body:
        tag = child.tag.split("}")[-1]
        if tag == "p":
            text = "".join(r.text or "" for r in child.iter(f"{NS}t"))
            if text.strip():
                lines.append(text.strip())
        elif tag == "tbl":
            # For tables (two-column CV layout), extract each cell's paragraphs
            rows = child.findall(f".//{NS}tr")
            for row in rows:
                cells = row.findall(f"{NS}tc")
                for cell in cells:
                    cell_lines = []
                    for para in cell.findall(f".//{NS}p"):
                        text = "".join(t.text or "" for t in para.iter(f"{NS}t"))
                        if text.strip():
                            cell_lines.append(text.strip())
                    if cell_lines:
                        lines.extend(cell_lines)
                        lines.append("")  # blank line between cells

    return "\n".join(lines)


def get_existing_titles(notion, parent_id):
    """Fetch titles of existing sub-pages under a parent page."""
    existing = set()
    try:
        response = notion.blocks.children.list(block_id=parent_id)
        for block in response.get("results", []):
            if block["type"] == "child_page":
                title = block["child_page"].get("title", "")
                existing.add(title)
    except Exception:
        pass
    return existing


def import_directory(notion, directory, doc_type, parent_id, dry_run=False):
    """Import all .docx files from a directory as Notion sub-pages."""
    files = sorted(Path(directory).glob("*.docx"))
    if not files:
        print(f"  No .docx files found in: {directory}")
        return

    existing = get_existing_titles(notion, parent_id) if not dry_run else set()

    created = 0
    skipped = 0

    for filepath in files:
        title = filename_to_title(filepath.name, doc_type)

        if title in existing:
            print(f"  SKIP (exists): {title}")
            skipped += 1
            continue

        if dry_run:
            print(f"  WOULD CREATE: {title}")
            continue

        print(f"  Creating: {title} ...", end=" ", flush=True)
        try:
            text = extract_docx_text(str(filepath))

            # Split text into <=2000 char chunks for Notion's block limit
            chunk_size = 1900
            chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
            # Cap at 50 blocks to stay well under Notion page limits
            chunks = chunks[:50]

            children = [{
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": chunk}}]
                }
            } for chunk in chunks]

            notion.pages.create(
                parent={"page_id": parent_id},
                properties={"title": [{"text": {"content": title}}]},
                children=children
            )
            print("done")
            created += 1
        except Exception as e:
            print(f"ERROR: {str(e)[:120]}")

    print(f"  Result: {created} created, {skipped} skipped")
    return created


def main():
    dry_run = "--dry-run" in sys.argv

    if dry_run:
        print("DRY RUN — no pages will be created\n")
        notion = None
    else:
        token = get_notion_token()
        notion = Client(auth=token)

    print("=== CVs -> CV Templates ===")
    import_directory(notion, CV_DIR, "cv", CV_TEMPLATES_PARENT, dry_run)

    print("\n=== CLs -> CL Examples ===")
    import_directory(notion, CL_DIR, "cl", CL_EXAMPLES_PARENT, dry_run)

    if not dry_run:
        print("\nImport complete. Open Notion to review the new pages.")
        print("Next: identify which CV to use as the base FP&A Focus template and rename it")
        print("      'CV — FP&A Focus — FR' (or EN) so /job-apply can find it.")


if __name__ == "__main__":
    main()
