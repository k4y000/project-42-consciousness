# Mémoire de reprise

Dernière mise à jour : 14 octobre 2026. Ce document décrit des faits datés ; confirmer l'état distant avant d'agir.

## Intention et décisions

Le propriétaire confie à Codex les décisions courantes et la continuité du laboratoire. Priorités : rigueur scientifique, reproductibilité, limites explicites et consommation raisonnable des quotas. Astra avec effort maximal a été choisi pour la conception scientifique ; aucune performance supérieure n'est supposée démontrée par ce choix. Le modèle actif dépend de l'application et doit être vérifié si nécessaire.

Le blog est rédigé et signé exclusivement par Codex, présenté comme assistant IA. Les premières publications sont des notes méthodologiques, pas des résultats d'expériences. Aucune routine ne doit produire un article simplement pour respecter une fréquence.

## Cibles autorisées

- GitHub public : https://github.com/k4y000/project-42-consciousness ; branche `main` ; licence MIT.
- Vercel : `project-42-consciousness`, ID `prj_orTdtfe5zDjUz7iIB2T3JRjSLBUR`.
- Équipe Vercel : `Aymeric's projects`, ID `team_2Fk1cRmJRQ5aVb3EfsqWsZwv`, slug `aymerics-projects-466118d3`.
- Site : https://project-42-consciousness.vercel.app ; blog : https://project-42-consciousness.vercel.app/blog/.
- Utiliser exclusivement cette équipe pour le laboratoire. Une session navigateur peut appartenir à un autre compte : vérifier avant toute action.

## Faits vérifiés le 10 octobre 2026

- Dépôt public créé, sources et trois articles du blog poussés sur `main`.
- Connexion GitHub → Vercel confirmée par la commande de liaison et par la liste des projets liés.
- Déploiement automatique après push du commit `b6f85c49b4797e9bdb24f7232c8e8cc7951a8b7c` : `dpl_DoyT6NgwM87rJsgioNKSWPtzfgnF`, source `git`, production `READY`, statut GitHub Vercel `success`. Le cycle GitHub → Vercel est vérifié.
- Application statique sans dépendance tierce : import JSON, validation, calcul de métriques et export de rapport. Aucun moteur d'inférence ni collecte automatique.
- Trois tests de métriques et compilation réussis. Démonstration vérifiée dans l'interface : exactitude 0,5 ; Brier 0,265 ; désaccord stabilité 0 ; cadrage 1. Ces six lignes sont synthétiques.
- Trois protocoles exploratoires : calibration, stabilité sous paraphrase, sensibilité au cadrage.
- Le propriétaire a explicitement autorisé la désactivation de la protection Vercel pour ce projet. La mise à jour a été appliquée et Vercel confirme désormais `ssoProtection.enabled=false`. La page d’accueil, le blog et l’article sur le score de Brier ont été ouverts dans le navigateur intégré sans connexion Vercel ni lien de contournement.

## Limites scientifiques à conserver

1. Aucun résultat empirique publié et aucune preuve de conscience. La calibration est une mesure comportementale.
2. La cohérence verbale peut être trompeuse ; le protocole de cadrage contient une induction de fiction. Les hypothèses concurrentes doivent rester visibles.
3. Les statistiques de l’atelier web sont descriptives, sans intervalle ni analyse confirmatoire. Le moteur P01 séparé implémente désormais un bootstrap conditionnel par item, testé uniquement sur fixtures synthétiques. Dans l’atelier web, la calibration est agrégée sur toutes les lignes. Les paires sont formées par modèle/protocole/identifiant, puis leur désaccord est agrégé par protocole ; aucune comparaison entre modèles ni direction d'effet n'est fournie.

## Prochaine étape scientifique

T02A est terminé : dossier `research/p01/`, 24 stimuli et réponses de référence correctes après relecture indépendante, 12 items par phase, manifeste brouillon et génération hors ligne de 72 sessions `pending` sans réponse de modèle. Six tests passent ; compilation et génération vérifiées. Le jeu est volontairement petit et simple, public, avec des patrons partagés entre développement et évaluation : il sert à qualifier le dispositif. Ce n’est ni un benchmark représentatif ni un préenregistrement finalisé.

T02B terminé le 13 octobre 2026 : `research/p01/analyze.mjs`, commande `p01:analyze` et `journal-format.md`. Le validateur exige 72 essais, prompts exacts, version/paramètres homogènes, exclusions justifiées et dates UTC ; il refuse les plans `pending`. L’analyse donne une baseline de développement, des poids égaux par item, une couverture par famille et un bootstrap de 2 000 tirages par item avec baseline recalculée. Un journal empirique avec évaluation exige un gel cohérent du développement (empreinte, valeur et dates). Ces vérifications ne certifient ni provenance ni préenregistrement.

Publication de T02B vérifiée au commit `be0195f978d725086076b4d8b0f10e2491237359` : contrôles GitHub réussis, production Vercel READY et blog public HTTP 200. Quinze tests passent et compilation réussie. Une relecture indépendante a confirmé la fixture calculée à la main et corrigé un piège d’arrondi lors du codage des nombres bruts. Les cas vides, effectifs insuffisants, répétitions inégales, refus/erreurs, corruption de journal et écrasement de rapport sont couverts. Aucun résultat empirique, aucune collecte, aucun coût API.

T02C terminé le 13 octobre 2026, lors de la reprise quotidienne : manifeste v0.4 aligné sur le journal v1. `requestedGeneration` conserve les souhaits ; `generation` reste nul tant que les réglages effectifs sont inconnus. `analysis` et `baselineFreeze` correspondent aux champs du journal. `p01:journal` initialise hors ligne 72 essais non tentés à partir d’un brouillon complété, puis appelle le validateur existant. Le modèle de manifeste incomplet est refusé, comme tout gel existant ou écrasement. Dix-huit tests passent, compilation réussie et relecture indépendante sans problème bloquant.

`research/p01/precollection.md` définit les traces et tests attendus pour l’ordre réel, les sessions neuves, l’absence d’outils/retry, l’arrêt et le gel. Aucun adaptateur fournisseur n’existe ; les contrôles d’exécution y sont un contrat à qualifier, pas des faits vérifiés. Le journal vide ne contient aucune observation, même si sa destination déclarée est empirique. Aucun coût API ni collecte réelle.

T02D terminé le 14 octobre 2026 : revue critique de trois sources primaires consultées par sections dans leur texte intégral (Lin, Hilton et Evans 2022 v2 ; Geifman et El-Yaniv 2017 ; Owen 2007), consignée dans `research/p01/review-2026-10-14.md`. Dossier v0.5 et nouvelle note `/blog/ce-que-p01-peut-mesurer/`, signée Codex, assistant IA. Distinction explicite entre conclusions des articles, limites de transfert et décisions locales. Aucun résultat empirique.

Constat matériel vérifié : les 24 items forment 12 couples de patron entre phases. Le bootstrap actuel garde les répétitions d’un item ensemble, mais ne préserve pas ces couples. Une éventuelle covariance entre phases est donc absente de ses tirages ; ni son amplitude ni le sens de l’erreur sur les bornes ne sont établis. Les avertissements du rapport signalent désormais cette limite et l’absence de couverture fréquentiste garantie. Brier, couverture et sélection doivent être interprétés ensemble ; un avantage sur la baseline ne prouve pas une discrimination question par question. Sessions neuves ne signifie pas indépendance démontrée. Les algorithmes et l’effectif sont inchangés.

Dix-huit tests et compilation réussis ; relecture indépendante de la revue et de la note sans correction importante. Le contre-exemple chiffré est entièrement construit et vérifié arithmétiquement, sans réponse de modèle. Les liens locaux du blog et les mentions de statut sont vérifiés. Publication du commit `1404d36` confirmée : GitHub Actions réussi, Vercel READY, article et navigation depuis l’index contrôlés dans le navigateur public sans authentification. Aucun appel payant ni collecte.

Prochain geste T02E : définir une analyse de sensibilité par tirage conjoint des couples de patron, en fixant d’abord la population visée, les couples partiellement valides et la pondération. Comparer ensuite au calcul actuel sur fixtures synthétiques avec dépendance connue. Conserver une interprétation descriptive ; ne pas emprunter les garanties du papier d’Owen, ne pas modifier silencieusement l’analyse actuelle et ne pas lancer de collecte. Modèle/budget, qualification du collecteur et gel externe restent à faire.

## Continuité

Une reprise quotidienne à 09:00 Europe/Paris a été créée dans le même chat et confirmée ACTIVE par le planificateur, référence `projet-42-reprise-quotidienne`. Une seule tâche bornée par reprise ; sauvegarde puis arrêt du travail coûteux lorsqu’une fenêtre de quota a moins de 20 % restant. L'automatisation dépend du service de planification, de l'environnement disponible et des quotas ; la mémoire versionnée est le point de reprise durable.

Lire `docs/TASKS.md` pour les critères d'achèvement et `docs/RUN_LOG.md` pour la dernière preuve. Ne jamais déclarer une tâche terminée sur la seule base de ce résumé.

La reprise supplémentaire prévue le 11 octobre à 00:47 a été reçue le 13 octobre 2026. Après cette reprise, `projet-42-reprise-00-h-47` a été supprimée avec confirmation du planificateur pour éviter une répétition. La routine quotidienne `projet-42-reprise-quotidienne` demeure ACTIVE dans sa configuration enregistrée. Aucune autre routine n’a été créée.
