'use strict';
const { Client } = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const CONN = 'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

const FULL_BRIEF = `# Interview Brief — Médecin Conseiller @ ARS Isère DD38
Date: 2026-06-04 | Interview type: TBC

## About ARS Isère DD38
La Direction Départementale de l'Isère est l'échelon territorial de l'ARS AuRA, interlocuteur direct des professionnels de santé, établissements sanitaires et médico-sociaux, services de l'Etat et collectivités. Natalie a effectué son stage de veille sanitaire dans cette même délégation (mai-nov 2024).

## Résumé du poste
Conseiller technique médical rattaché au directeur départemental, fonction transversale: réflexion stratégique offre de soins, projets de décloisonnement sanitaire/médico-social/social, instruction administrative (appels à projets, CPOM, schéma régional), analyse médico-légale (réclamations, EIAS), inspections, dossiers individuels (comité médical hospitalier). Profil MISP apprécié non exigé.

## Forces les plus directes

ELLE A DEJA TRAVAILLE ICI
Stage ARS AuRA DD38 Veille Sanitaire (Mai-Nov 2024): enquêtes MDO, épidémies coqueluche, rédaction et diffusion d'un protocole sur l'Arc Alpin. Elle connaît la structure.

DES SP + M2 = équivalent fonctionnel MISP pour un interne
DES Santé Publique (11/23-11/26) + Master 2 SP Ingénierie Santé (UCA 2024-25).

PREVAX38 = décloisonnement en pratique
Pilotage territorial multi-acteurs (CPAM, ARS, gérontopôle, pharmacies, CPTSs, MSPs, facultés). Convention CPAM en cours.

IS-ICOPE thèse = décloisonnement prouvé empiriquement
Résultat clé: approche décloisonnée = bénéfice net mesuré, vision globale de santé inaccessible autrement.

Terrain isérois connu de bout en bout
CDS Isère (vaccination, CLAT, primo-arrivants, CeGIDD), CHU Grenoble, Direction de l'Autonomie (Dpt 38), ARS DD38.

## Questions probables + amorces

Q: Pourquoi l'ARS et ce poste?
"J'ai effectué mon stage de veille sanitaire à la DD38 — cette expérience a confirmé que c'est le niveau d'action où j'ai envie d'opérer, à l'interface entre clinique, terrain et politique de santé."

Q: Parlez de votre expérience à l'ARS.
"J'étais à la veille sanitaire mai-nov 2024. Sur l'épisode coqueluche j'ai rédigé et diffusé un protocole à l'échelle de l'Arc Alpin — coordination avec ARS voisines et professionnels de terrain."

Q: Le décloisonnement concrètement?
"C'est la question centrale de ma thèse IS-ICOPE. J'ai vu des personnes âgées avoir pour la première fois une vision globale de leur santé — parce qu'on avait réuni des acteurs qui ne se parlaient pas: gériatres, direction autonomie, médecins traitants. Résultat mesuré."

Q: Coordination multi-acteurs PREVAX38?
"La coordination ne se décrète pas, elle se construit. Acteurs incontournables (CPAM, gérontopôle), acteurs inattendus (sages-femmes pour la population âgée), nœuds de blocage (absence données couverture vaccinale)."

Q: Pas MISP — comment compensez-vous?
"DES SP, Master 2, stage ici même, formation clinique solide. Je n'ai pas la formation réglementaire MISP mais je monte en compétence rapidement, notamment sur les inspections."

Q: Instruction appel à projets médico-social?
"Partir des besoins du territoire que je connais, analyser la cohérence avec le schéma régional et priorités DD38. Le cadre réglementaire des autorisations est nouveau pour moi — je serai honnête et proactive pour me former."

Q: Rigueur administrative?
"Sur le protocole coqueluche: délais courts, plusieurs interlocuteurs. J'ai appris à documenter au fil de l'eau, tracer chaque décision. Sur PREVAX38: plusieurs partenariats à des stades différents en parallèle."

Q: Apport vs médecin resté en clinique?
"Deux DES — gériatrie puis santé publique. Double culture: je comprends les soignants en établissement ET la logique institutionnelle. Un Médecin Conseiller doit parler les deux langues."

Q: Faire avancer sans autorité directe?
"Sur IS-ICOPE, équipe de pilotage sans position hiérarchique. J'ai convaincu par la qualité des données. Même chose pour embarquer les mutuelles sur PREVAX38."

Q: Où dans 3 ans?
"DES SP terminé nov 2026. Je veux m'ancrer en santé publique territoriale. L'ARS est l'endroit où je veux construire une carrière."

## Questions à poser
1. Priorité opérationnelle immédiate — dossier en cours?
2. Fonctionnement transversalité entre pôles?
3. Calendrier formation inspections/conformité?
4. Nature contrat et grille rémunération médecin DES?
5. Projets de territoire en cours sur lesquels le MC serait impliqué?

## Points de vigilance
- Ne pas sur-défendre l'absence MISP — une fois, calme, avancer
- Se présenter comme docteure (thèse soutenue 31/10/2025), jamais interne
- Fin DES nov 2026 = disponibilité pleine, formuler comme atout
- Experience USA: utile pour perspective internationale si contexte s'y prête
- Statut contrat à vérifier: praticien contractuel vs fonctionnaire
- La carte maîtresse = stage ARS DD38 — la jouer tôt

## Concepts-clés JD
décloisonnement, territorialisation, parcours de santé, offre de soins, ISS, accès aux soins, aller vers, coordination territoriale, démocratie sanitaire, santé communautaire, prévention et promotion, continuité des parcours, médico-social, CPOM, schéma régional de santé, EIAS, MDO`;

async function run() {
  const client = new Client({ connectionString: CONN });
  await client.connect();

  // Add feedback columns to enable iterative build-up across sessions
  await client.query(`
    ALTER TABLE interview_prep
    ADD COLUMN IF NOT EXISTS feedback text,
    ADD COLUMN IF NOT EXISTS questions_received jsonb,
    ADD COLUMN IF NOT EXISTS outcome text,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()
  `);
  console.log('Schema: feedback/questions_received/outcome/updated_at columns ensured');

  // Save full brief to record id=1
  const r = await client.query(
    `UPDATE interview_prep SET content=$1, sector=$2, updated_at=now() WHERE id=1 RETURNING id`,
    [FULL_BRIEF, "Santé publique / Fonction publique d'Etat"]
  );
  console.log('Full brief saved, id:', r.rows[0].id);

  await client.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
