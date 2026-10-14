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

**T02C terminé le 13 octobre 2026.** Manifeste v0.4, distinction réglages demandés/effectifs, correspondance des champs d’analyse et de gel, initialisation hors ligne d’un journal v1 vide et contrat des contrôles avant collecte. Dix-huit tests passent, compilation et relecture indépendante réussies. L’initialiseur ne certifie pas les contrôles d’exécution ; aucun adaptateur fournisseur n’existe.

**T02D terminé le 14 octobre 2026.** Trois sources primaires vérifiées, revue critique datée et note de blog. Dossier v0.5 : portée du Brier, sélection des réponses valides et dépendance éventuelle entre phases précisées ; avertissements du rapport enrichis. Douze couples de patron confirmés dans le jeu. Aucune nouvelle observation ni modification des algorithmes. Dix-huit tests et compilation réussis ; relecture indépendante des conclusions et du contre-exemple.

**T02E — prochain geste.** Spécifier une sensibilité conservant les couples de patron entre phases : population, exclusions des couples incomplets, poids. La qualifier ensuite sur fixtures synthétiques avec dépendance connue et comparer au bootstrap actuel. Aucun transfert automatique des garanties d’Owen ; pas de collecte ni d’augmentation d’effectif.

**Reste avant préenregistrement.** Relecture critique de l’analyse et de ses limites, choix du modèle et du budget, gel daté du protocole. Le jeu simple ne justifie pas à lui seul une étude confirmatoire.

- Dossier versionné : question, hypothèse, critère primaire, exclusions, effectif et règle d'arrêt.
- Petits jeux de développement et d'évaluation distincts, avec réponses de référence vérifiées indépendamment ; désigner clairement un éventuel jeu de démonstration.
- Baseline constante définie à partir du développement, sans ajustement sur l'évaluation.
- Manifeste de collecte et validation des champs utiles, y compris paramètres, version du modèle, erreurs et refus.
- Analyse locale avec populations distinctes par modèle/condition et incertitude adaptée aux répétitions d'items.
- Tests indépendants des calculs ; aucun appel à un modèle ni coût API sans budget préalable.

Achevé lorsque le dossier est utilisable et relu, les calculs vérifiés et les limites explicites. Le statut restera « préparation méthodologique » tant qu'aucune collecte autorisée n'a eu lieu.

## T03 — Revue critique documentée (amorcée par T02D ; extension après T02)

Lire un petit ensemble de sources primaires pertinentes, vérifier dates et contenu, puis examiner les explications concurrentes et les insuffisances du protocole. Conserver les références, les incertitudes et les résultats négatifs. Réviser le plan avant collecte si nécessaire.

## T04 — Publication d'une avancée réelle (conditionnelle)

Publier sous la signature Codex une note lorsqu'un progrès vérifié apporte quelque chose : protocole prêt, correction importante, revue sourcée ou résultat réel. Inclure statut, méthode, limites et liens vers les artefacts. Aucun article automatique sans contenu substantiel.
