"""
make_cv_template.py — Run ONCE to create the CV Word template.

Reads your base resume .docx, replaces the job title line and profile summary
with {{CV_HEADLINE}} and {{PROFILE_SUMMARY}} placeholders, and saves a
template file. The populate_cv.py script fills those placeholders per application.

Usage:
    py scripts/make_cv_template.py
"""

from docx import Document

SOURCE = r"C:\Users\zberl\OneDrive\Documents\France Job Applications\2026\WORD VERSION FOR EDIT\Zack_Resume_English_2025_revised.docx"
OUTPUT = r"C:\Users\zberl\OneDrive\Documents\France Job Applications\2026\WORD VERSION FOR EDIT\cv_template.docx"


def replace_paragraph_text(para, new_text):
    """Replace a paragraph's text while preserving the formatting of the first run."""
    for run in para.runs:
        run.text = ""
    if para.runs:
        para.runs[0].text = new_text
    else:
        para.add_run(new_text)


def main():
    doc = Document(SOURCE)

    # Document is one table, one row, two cells.
    # Cell 1 = right column: Name → Headline → PROFILE → Summary → Experience
    table = doc.tables[0]
    right_cell = table.rows[0].cells[1]
    paras = right_cell.paragraphs

    after_name = False
    headline_replaced = False
    after_profile = False
    summary_replaced = False

    for para in paras:
        text = para.text.strip()
        if not text:
            continue

        if text == "ZACHARY BERLO":
            after_name = True
            continue

        if after_name and not headline_replaced:
            print(f"Replacing headline: '{text}'")
            replace_paragraph_text(para, "{{CV_HEADLINE}}")
            headline_replaced = True
            after_name = False
            continue

        if text == "PROFILE":
            after_profile = True
            continue

        if after_profile and not summary_replaced:
            print(f"Replacing profile: '{text[:80]}...'")
            replace_paragraph_text(para, "{{PROFILE_SUMMARY}}")
            summary_replaced = True
            after_profile = False
            break

    if not headline_replaced:
        print("ERROR: Could not find the headline paragraph.")
        return
    if not summary_replaced:
        print("ERROR: Could not find the profile summary paragraph.")
        return

    doc.save(OUTPUT)
    print(f"\nTemplate saved: {OUTPUT}")
    print("Run populate_cv.py to fill it for a specific application.")


if __name__ == "__main__":
    main()
