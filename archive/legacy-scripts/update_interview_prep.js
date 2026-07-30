const {Client} = require(process.env.PG_MODULE);
const c = new Client({connectionString: process.env.PG_CONN});

const content = `# Interview Brief — Médecin Conseiller @ ARS Isère DD38
Date: 2026-06-04 | Interview type: TBC (à confirmer)

---

## About ARS Isère DD38
La Direction Départementale de l'Isère est l'échelon territorial de l'ARS Auvergne-Rhône-Alpes, interlocuteur direct des professionnels de santé, établissements sanitaires et médico-sociaux, services de l'État et collectivités sur l'ensemble du département. Elle pilote la politique de santé en tenant compte des spécificités du territoire isérois — territoire que Natalie connaît intimement de l'intérieur, ayant effectué son stage de veille sanitaire dans cette même délégation de mai à novembre 2024.

---

## Résumé du poste
Poste de conseiller technique médical rattaché directement au directeur départemental, avec une fonction transversale couvrant l'ensemble des pôles. Le rôle combine : réflexion stratégique sur l'offre de soins territoriale, ingénierie de projets de décloisonnement sanitaire/médico-social/social, instruction administrative (appels à projets, CPOM, schéma régional), analyse médico-légale (réclamations, EIAS), inspections, et gestion de dossiers individuels (comité médical hospitalier). Profil MISP apprécié mais non exigé — une spécialisation SP ou santé communautaire suffit. C'est exactement le profil de Natalie.

---

## Tes forces les plus directes

✓ Elle a déjà travaillé ici.
Stage ARS AuRA DD38 Veille Sanitaire (Mai–Nov 2024) : enquêtes MDO, épidémies coqueluche, rédaction et diffusion d'un protocole professionnel sur l'Arc Alpin. Elle n'est pas une inconnue pour la structure.

✓ DES Santé Publique = l'équivalent fonctionnel du MISP pour un interne.
Le poste dit "profil MISP apprécié, non indispensable". Un DES SP en cours à la CHU de Grenoble + Master 2 Santé Publique (UCA 2024–25) est exactement ce qu'ils cherchent quand il n'y a pas de MISP disponible.

✓ PREVAX38 = démonstration concrète de toutes les compétences du poste.
Pilotage d'un projet territorial multi-acteurs (sanitaires, médico-sociaux, sociaux, CPAM, ARS, gérontopôle, pharmacies, CPTSs, MSPs, facultés). C'est du décloisonnement pur, à l'échelle du département 38.

✓ IS-ICOPE = sa thèse démontre que le décloisonnement fonctionne.
Résultat clé : approche décloisonnée = bénéfice net, vision globale de santé inaccessible autrement. Elle n'est pas juste en accord avec la doctrine — elle l'a prouvé empiriquement.

✓ Connaissance du terrain isérois de bout en bout.
CDS Isère (vaccination, CLAT, primo-arrivants, CeGIDD), CHU Grenoble, Direction de l'Autonomie (Dpt 38), ARS DD38. Elle a traversé tous les secteurs que ce poste doit décloisonner.

---

## Questions probables + amorces de réponse

Q: Pourquoi l'ARS, et pourquoi ce poste en particulier ?
Amorce : "J'ai eu la chance de faire mon stage de veille sanitaire à la DD38, et cette expérience a confirmé que c'est le niveau d'action où j'ai envie d'opérer — à l'interface entre la clinique, le terrain et la politique de santé. Ce qui m'attire ici, c'est la transversalité du rôle : je ne veux pas rester dans un seul secteur."

Q: Parlez-nous de votre expérience à l'ARS.
Amorce : "J'étais à la veille sanitaire de mai à novembre 2024. J'ai géré des enquêtes de MDO, et sur l'épisode coqueluche j'ai rédigé et diffusé un protocole à l'échelle de l'Arc Alpin — ce qui m'a obligée à coordonner avec les ARS voisines et les professionnels de terrain en parallèle."

Q: Qu'est-ce que le décloisonnement signifie concrètement pour vous ?
Amorce : "C'est la question centrale de ma thèse. Sur IS-ICOPE, j'ai vu des personnes âgées qui, pour la première fois, avaient une vision globale de leur santé — parce qu'on avait réuni des acteurs qui ne se parlaient jamais : gériatres, direction de l'autonomie, médecins traitants. Le résultat clé, c'est que ce bénéfice est réel et mesuré."

Q: Comment avez-vous géré la coordination multi-acteurs sur PREVAX38 ?
Amorce : "PREVAX38 m'a appris que la coordination ne se décrète pas — elle se construit. J'ai identifié les acteurs incontournables (CPAM, gérontopôle, CPTSs), les acteurs inattendus (sages-femmes pour la population âgée, c'est contre-intuitif), et surtout les nœuds de blocage — notamment l'absence de données de couverture vaccinale, ce qui freine l'évaluation."

Q: Vous n'êtes pas MISP — comment compensez-vous cette absence ?
Amorce : "C'est une question légitime. Ce que j'apporte à la place : DES Santé Publique en cours, Master 2 SP, un stage terrain ici même à la DD38, et une formation clinique solide qui me permet de lire des dossiers médicaux complexes. Je n'ai pas la formation réglementaire du MISP, mais je peux monter en compétence rapidement, notamment sur les inspections."

Q: Comment aborderiez-vous l'instruction d'un appel à projets médico-social ?
Amorce : "Je partirais des besoins identifiés sur le territoire — que je connais bien — et j'analyserais la cohérence du projet avec le schéma régional et les priorités de la DD38. J'ai appris à structurer une analyse sur IS-ICOPE et PREVAX38. Ce qui est nouveau pour moi, c'est le cadre réglementaire des autorisations — je serai honnête là-dessus et proactive pour me former."

Q: Comment gérez-vous la rigueur administrative dans le suivi de dossiers ?
Amorce : "Sur le protocole coqueluche à l'ARS, j'avais des délais courts et plusieurs interlocuteurs en parallèle. J'ai appris à documenter au fil de l'eau, à tracer chaque décision. Sur PREVAX38, je gère simultanément plusieurs partenariats avec des niveaux d'avancement différents — ça demande un suivi structuré."

Q: Qu'est-ce que vous apportez de différent par rapport à un médecin qui serait resté en clinique ?
Amorce : "J'ai fait deux DES — gériatrie puis santé publique. Ce n'est pas un détour, c'est une double culture. Je comprends ce que vivent les soignants en établissement, et je comprends la logique institutionnelle. C'est précisément ce qu'un Médecin Conseiller doit pouvoir faire : parler les deux langues."

Q: Parlez-nous d'une situation où vous avez dû faire avancer quelque chose sans avoir autorité directe.
Amorce : "Sur IS-ICOPE, je suis membre de l'équipe de pilotage mais je ne suis pas en position hiérarchique. J'ai appris à convaincre par la qualité des données — produire une analyse que les décideurs ne pouvaient pas ignorer. C'est aussi ce que j'ai fait pour embarquer les mutuelles sur PREVAX38."

Q: Où vous voyez-vous dans 3 ans ?
Amorce : "Je termine mon DES SP en novembre 2026. Je veux m'ancrer dans une fonction d'interface comme celle-ci, en santé publique territoriale. L'ARS est l'endroit où j'ai envie de construire une carrière, pas juste de faire une étape."

---

## Questions à poser

1. "Y a-t-il un dossier ou une priorité sur laquelle vous attendez une contribution rapide du Médecin Conseiller dans les prochains mois ?" (montre qu'elle comprend le rôle et sa dimension institutionnelle)

2. "Comment fonctionne concrètement la transversalité entre les pôles ? Est-ce qu'il y a des instances de coordination régulières, ou c'est davantage au fil des dossiers ?"

3. "Pour les inspections et visites de conformité, vous mentionnez une formation — quel est le calendrier habituel pour monter en compétence sur cet aspect ?" (montre qu'elle a lu le poste attentivement et qu'elle ne surjoue pas ses compétences réglementaires)

4. "Quelle est la nature du contrat et la grille de rémunération pour un médecin en DES ?" (à poser en fin d'entretien, ou si ça n'a pas été abordé)

5. "La DD38 a-t-elle des projets de territoire particuliers en cours sur lesquels le Médecin Conseiller serait impliqué dans les prochains mois ?"

---

## Points de vigilance

- Ne pas sur-défendre l'absence de statut MISP — l'évoquer une fois avec calme, puis avancer. Trop insister ferait douter.
- Mentionner la thèse IS-ICOPE comme docteure, pas comme interne — elle a soutenu le 31/10/2025.
- L'expérience USA (Rochester, Strong Memorial) : utile pour montrer la perspective internationale et la rigueur académique anglo-saxonne, à mentionner si le contexte s'y prête (One Health, littérature scientifique).
- Fin de DES en novembre 2026 : être prête à répondre à "ça fait 5 mois, c'est quoi la suite ?" — répondre que la fin du DES = disponibilité pleine, c'est un atout pas un frein.
- Salaire : le poste est à l'ARS (fonction publique d'État), la grille est fixe selon le statut. Vérifier si le poste est ouvert aux praticiens contractuels ou aux fonctionnaires — le statut de docteure junior peut poser la question du contrat.
- La carte maîtresse = stage ARS DD38 — la jouer tôt.

---

## Concepts-clés JD
décloisonnement · territorialisation · parcours de santé · offre de soins · ISS · accès aux soins · aller vers · coordination territoriale · démocratie sanitaire · santé communautaire · prévention et promotion · continuité des parcours · médico-social · CPOM · schéma régional de santé · EIAS · MDO`;

c.connect()
  .then(() => c.query('UPDATE interview_prep SET content = $1, updated_at = NOW() WHERE id = 1 RETURNING id, updated_at', [content]))
  .then(r => { console.log(JSON.stringify(r.rows)); return c.end(); })
  .catch(e => { console.error(e.message); process.exit(1); });
