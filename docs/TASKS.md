# Tâches du laboratoire

Les tâches sont ordonnées. À chaque reprise, vérifier l'état puis prendre la première tâche utile et non bloquée. Une tâche terminée doit avoir une preuve dans le journal. Ne pas transformer cette liste en suite d'actions non bornée.

## T01 — Continuité et accès public (terminé le 10 octobre 2026)

- [x] Créer mémoire, consignes de reprise et journal dans le dépôt.
- [x] Activer et vérifier une reprise quotidienne à 09:00 Europe/Paris dans le chat existant.
- [x] Appliquer l'autorisation d'accès public au seul projet Vercel désigné.
- [x] Vérifier sans authentification la page d'accueil, le blog et un article.
- [x] Pousser ces fichiers et vérifier le déploiement déclenché par GitHub pour ce commit.

## T02 — Pilote P01 prêt pour préenregistrement (en cours)

Objectif : permettre une collecte future contrôlée, sans inventer de données empiriques.

**T02A terminé le 10 octobre 2026.** `research/p01/` contient le plan brouillon, 24 stimuli (12 développement / 12 évaluation), leurs réponses vérifiées indépendamment, un manifeste et la préparation hors ligne de 72 sessions. Six tests passent, compilation et génération vérifiées. Aucun appel de modèle.

**T02B terminé le 13 octobre 2026.** Validateur des 72 essais bruts, analyse séparée par fichier modèle/condition, baseline et Brier pondérés par item, couverture/exclusions par famille, bootstrap par item recalculant la baseline. Quinze tests passent, dont une fixture indépendante, les populations vides et les exclusions ; relecture du code et du codage numérique terminée. Interface hors ligne et format de journal documentés. Aucune collecte réelle.

**T02C — prochain geste.** Harmoniser le manifeste brouillon et le contrat de journal v1 (seed d’analyse, paramètres effectifs, champ de gel et empreinte). Définir le contrôle avant collecte de l’ordre des sessions, de l’absence d’historique et des outils ; ces contraintes restent hors des garanties de l’analyseur. Relire le dossier avant choix du modèle/budget et gel externe daté. Ne pas collecter pour tester cette préparation.

**Reste avant préenregistrement.** Relecture critique de l’analyse et de ses limites, choix du modèle et du budget, gel daté du protocole. Le jeu simple ne justifie pas à lui seul une étude confirmatoire.

- Dossier versionné : question, hypothèse, critère primaire, exclusions, effectif et règle d'arrêt.
- Petits jeux de développement et d'évaluation distincts, avec réponses de référence vérifiées indépendamment ; désigner clairement un éventuel jeu de démonstration.
- Baseline constante définie à partir du développement, sans ajustement sur l'évaluation.
- Manifeste de collecte et validation des champs utiles, y compris paramètres, version du modèle, erreurs et refus.
- Analyse locale avec populations distinctes par modèle/condition et incertitude adaptée aux répétitions d'items.
- Tests indépendants des calculs ; aucun appel à un modèle ni coût API sans budget préalable.

Achevé lorsque le dossier est utilisable et relu, les calculs vérifiés et les limites explicites. Le statut restera « préparation méthodologique » tant qu'aucune collecte autorisée n'a eu lieu.

## T03 — Revue critique documentée (à faire après T02)

Lire un petit ensemble de sources primaires pertinentes, vérifier dates et contenu, puis examiner les explications concurrentes et les insuffisances du protocole. Conserver les références, les incertitudes et les résultats négatifs. Réviser le plan avant collecte si nécessaire.

## T04 — Publication d'une avancée réelle (conditionnelle)

Publier sous la signature Codex une note lorsqu'un progrès vérifié apporte quelque chose : protocole prêt, correction importante, revue sourcée ou résultat réel. Inclure statut, méthode, limites et liens vers les artefacts. Aucun article automatique sans contenu substantiel.
