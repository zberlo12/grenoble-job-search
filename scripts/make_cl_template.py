"""
make_cl_template.py — Run ONCE to create the cover letter Word template.

Reads your Raydiall CL .docx and replaces all variable content with
{{placeholders}}, saving cl_template.docx. The populate_cl.py script
fills those placeholders per application.

Usage:
    py scripts/make_cl_template.py
"""

from docx import Document

SOURCE = r"C:\Users\zberl\OneDrive\Documents\France Job Applications\2026\WORD VERSION FOR EDIT\LM_Raydiall_RAF_FR.docx"
OUTPUT = r"C:\Users\zberl\OneDrive\Documents\France Job Applications\2026\WORD VERSION FOR EDIT\cl_template.docx"

NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def replace_para_text(para, new_text):
    """Replace paragraph text, preserving first run's formatting."""
    for run in para.runs:
        run.text = ""
    if para.runs:
        para.runs[0].text = new_text
    else:
        para.add_run(new_text)


def replace_cell_text(cell, old_substring, new_text):
    """Replace a paragraph in a table cell that contains old_substring."""
    for para in cell.paragraphs:
        if old_substring in para.text:
            replace_para_text(para, new_text)
            return True
    return False


def main():
    doc = Document(SOURCE)

    # --- Header table: cell 0 contains Name + Title on separate lines ---
    # The title line is the one that changes per application
    header_table = doc.tables[0]
    left_cell = header_table.rows[0].cells[0]
    replaced = replace_cell_text(
        left_cell,
        "Responsable Administratif",
        "{{CL_HEADLINE}}",
    )
    print(f"Header title replaced: {replaced}")

    # --- Body paragraphs (top-level, not in table) ---
    # Structure:
    #   [0] Date
    #   [1] Addressee (company name + service)
    #   [2] Company location
    #   [3] Subject line
    #   [4] Salutation — STATIC
    #   [5] Opening paragraph
    #   [6] Body paragraph 1
    #   [7] Body paragraph 2
    #   [8] Body paragraph 3
    #   [9] Closing paragraph
    #   [10] Sign-off line — STATIC
    #   [11] "Cordialement," — STATIC
    #   [12] "Zachary Berlo" — STATIC

    STATIC = {
        "Madame, Monsieur",
        "Je serais ravi",
        "Cordialement",
        "Zachary Berlo",
    }

    placeholders = [
        "{{DATE}}",
        "{{COMPANY_ADDRESSEE}}",
        "{{COMPANY_LOCATION}}",
        "{{SUBJECT_LINE}}",
        # salutation skipped (static)
        "{{OPENING_PARA}}",
        "{{BODY_PARA_1}}",
        "{{BODY_PARA_2}}",
        "{{BODY_PARA_3}}",
        "{{CLOSING_PARA}}",
    ]

    ph_index = 0
    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
        if any(text.startswith(s) for s in STATIC):
            continue
        if ph_index >= len(placeholders):
            break
        print(f"Replacing '{text[:60]}' -> {placeholders[ph_index]}")
        replace_para_text(para, placeholders[ph_index])
        ph_index += 1

    doc.save(OUTPUT)
    print(f"\nTemplate saved: {OUTPUT}")
    print(f"Replaced {ph_index} variable paragraphs.")


if __name__ == "__main__":
    main()
