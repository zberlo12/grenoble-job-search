"""
Create templates/cv_template_natalie_fr.docx from the base CV.

Applies all content updates (correct order, updated entries, placeholders)
while preserving the photo and visual layout.

Usage: py scripts/make_cv_template_natalie.py
"""
from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import copy
from pathlib import Path

REPO = Path(__file__).parent.parent
SRC  = REPO / "4. CV nat AR.docx"
OUT  = REPO / "templates" / "cv_template_natalie_fr.docx"


def set_para_text(para, new_text):
    """Replace paragraph text while preserving run formatting."""
    if not para.runs:
        para.add_run(new_text)
        return
    para.runs[0].text = new_text
    for run in para.runs[1:]:
        run.text = ""


def insert_para_after(ref_para, new_text, style_ref=None):
    """Insert a new paragraph immediately after ref_para."""
    new_p = OxmlElement("w:p")
    new_r = OxmlElement("w:r")
    new_t = OxmlElement("w:t")
    new_t.text = new_text
    new_t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    new_r.append(new_t)
    new_p.append(new_r)
    src = style_ref._element if style_ref else ref_para._element
    pPr = src.find(qn("w:pPr"))
    if pPr is not None:
        new_p.insert(0, copy.deepcopy(pPr))
    ref_para._element.addnext(new_p)


def main():
    doc = Document(str(SRC))
    cell = doc.tables[0].rows[0].cells[0]

    def paras():
        return cell.paragraphs

    # ── Header ────────────────────────────────────────────────────────────────
    set_para_text(paras()[1], "Docteure Junior — DES Santé Publique")

    # ── Section header ─────────────────────────────────────────────────────────
    set_para_text(paras()[5], "EXPÉRIENCE PROFESSIONNELLE")

    # ── Slot 1: overwrite PREVAX38 block (P7-10) with IS-ICOPE ────────────────
    set_para_text(paras()[7],  "IS-ICOPE — CHU Grenoble Alpes & Direction de l'Autonomie (Dpt 38)")
    set_para_text(paras()[8],  "Pr Gaëtan GAVAZZI, Dr Laurence LORCET  |  Nov. 2024 – Nov. 2026")
    set_para_text(paras()[9],  "Année de recherche : analyse descriptive et qualitative du programme IS-ICOPE (programme OMS de prévention de la dépendance par dépistage de la fragilité)")
    set_para_text(paras()[10], "Membre des équipes de pilotage et opérationnelle")

    # ── Slot 2: overwrite IS-ICOPE block (P12-14) with PREVAX38 ───────────────
    set_para_text(paras()[12], "CDS Isère — Chargée de projet PREVAX38")
    set_para_text(paras()[13], "Dr Gaëlle VAREILLES  |  Nov. 2025 – Nov. 2026")
    set_para_text(paras()[14], "Co-pilotage avec le gérontopôle d'un projet de promotion de la vaccination chez les 60+ en Isère")
    insert_para_after(paras()[14], "Campagnes vaccination HPV et méningocoque ACWY en milieu scolaire")
    insert_para_after(paras()[14], "Coordination multi-acteurs : sanitaires, médico-sociaux et sociaux — CCAS, CPTS, médecine du travail, officines, Faculté de Pharmacie")

    # ── ARS entry ─────────────────────────────────────────────────────────────
    ars_idx = next(i for i, p in enumerate(paras()) if "ARS AuRA" in p.text)
    set_para_text(paras()[ars_idx],     "ARS AuRA — Veille Sanitaire")
    set_para_text(paras()[ars_idx + 1], "Dr Olivier GAGET, Dr Muriel DEHER  |  Mai – Nov. 2024")
    insert_para_after(paras()[ars_idx + 1],
        "Enquêtes épidémiologiques sur l'ensemble des MDOs de la région ; protocole coqueluche rédigé et diffusé sur l'Arc Alpin")

    # ── CDS Isère Nov 2023 – Mai 2024 ─────────────────────────────────────────
    def find_idx(test):
        return next(i for i, p in enumerate(paras()) if test(p.text))

    cds_idx = find_idx(lambda t: "Centre D" in t and ("sant" in t.lower() or "pr" in t.lower()))
    set_para_text(paras()[cds_idx],     "CDS Isère — Prévention et Santé Publique")
    set_para_text(paras()[cds_idx + 1], "Dr Gaëlle VAREILLES  |  Nov. 2023 – Mai 2024")
    set_para_text(paras()[cds_idx + 2], "Centre de vaccination, CLAT, consultations primo-arrivants, CeGIDD")
    insert_para_after(paras()[cds_idx + 2], "Campagne de vaccination HPV en milieu scolaire")

    # ── Registre des Cancers ───────────────────────────────────────────────────
    reg_idx = find_idx(lambda t: "Registre des Cancers" in t)
    set_para_text(paras()[reg_idx],     "Registre des Cancers de l'Isère")
    set_para_text(paras()[reg_idx + 1], "Pr Arnaud SEIGNEURIN  |  Mai – Nov. 2023")
    set_para_text(paras()[reg_idx + 2], "Analyses épidémiologiques sur R")

    # ── Compress 3 clinical stages into one ───────────────────────────────────
    neuro_idx = find_idx(lambda t: "Neurovasculaire" in t and "CHU" in t)
    set_para_text(paras()[neuro_idx],     "Formation clinique hospitalière — CHU Grenoble Alpes  |  Nov. 2021 – Nov. 2023")
    set_para_text(paras()[neuro_idx + 1], "")
    set_para_text(paras()[neuro_idx + 2], "Neurovasculaire, soins intensifs neurologiques (Pr DETANTE)")

    pneumo_idx = find_idx(lambda t: "Pneumologie" in t and "CHU" in t)
    set_para_text(paras()[pneumo_idx],     "")
    set_para_text(paras()[pneumo_idx + 1], "")
    set_para_text(paras()[pneumo_idx + 2], "Pneumologie, médecine infectieuse, oncologie thoracique (Pr DEGANO)")

    geria_idx = find_idx(lambda t: "riatrie Aigu" in t and "CHU" in t)
    set_para_text(paras()[geria_idx],     "")
    set_para_text(paras()[geria_idx + 1], "")
    set_para_text(paras()[geria_idx + 2], "Gériatrie aiguë, ortho-gériatrie, médecine vasculaire (Pr GAVAZZI)")

    # ── Research section ───────────────────────────────────────────────────────
    research_idx = find_idx(lambda t: "TRAVAUX" in t)
    set_para_text(paras()[research_idx], "TRAVAUX DE RECHERCHE")

    isicope_r = find_idx(lambda t: t.strip() == "IS-ICOPE " or t.strip() == "IS-ICOPE")
    set_para_text(paras()[isicope_r],     "IS-ICOPE — Impact perçu et satisfaction des usagers  |  2025")
    set_para_text(paras()[isicope_r + 1], "Pr Gaëtan GAVAZZI, Dr Laurence LORCET — Thèse d'exercice")
    set_para_text(paras()[isicope_r + 2], "Analyse mixte descriptive et qualitative, 2023–2025 — publication en préparation")

    prev_idx = find_idx(lambda t: "Preventive Care" in t)
    set_para_text(paras()[prev_idx + 1], "Pr Jill HALTERMAN, MD-MPH — Strong Memorial Hospital, USA  |  2010–2014")
    set_para_text(paras()[prev_idx + 2], "Assistante de recherche : programme d'intervention communautaire, création d'un réseau de soins")

    # Remove Mycobacterium entry
    myco_idx = next((i for i, p in enumerate(paras()) if "Mycobacterium" in p.text), None)
    if myco_idx is not None:
        for offset in range(3):
            if myco_idx + offset < len(paras()):
                set_para_text(paras()[myco_idx + offset], "")

    # ── Add COMMUNICATIONS section ─────────────────────────────────────────────
    halterman_idx = find_idx(lambda t: "HALTERMAN" in t)
    assist_idx = halterman_idx + 1
    while assist_idx < len(paras()) and not paras()[assist_idx].text.strip():
        assist_idx += 1
    last_research = paras()[assist_idx]
    insert_para_after(last_research, "Congrès Européen de Médecine Gériatrique — sept. 2026")
    insert_para_after(last_research, "Congrès de Fragilité, Toulouse — 2025, 2026")
    insert_para_after(last_research, "COMMUNICATIONS ET AFFICHES")
    insert_para_after(last_research, "")

    # ── INTÉRÊTS PROFESSIONNELS → placeholder ─────────────────────────────────
    int_idx = next((i for i, p in enumerate(paras()) if "NT" in p.text and "PROFESSION" in p.text), None)
    if int_idx is not None:
        set_para_text(paras()[int_idx], "INTÉRÊTS PROFESSIONNELS")
        idx = int_idx + 1
        first = True
        while idx < len(paras()):
            t = paras()[idx].text.strip()
            if not t or "EDUCATION" in t or "FORMATION" in t or "LANGUES" in t:
                break
            if first:
                set_para_text(paras()[idx], "{{INTERETS_PROFESSIONNELS}}")
                first = False
            else:
                set_para_text(paras()[idx], "")
            idx += 1

    doc.save(str(OUT))
    print(f"Template saved: {OUT}")


if __name__ == "__main__":
    main()
