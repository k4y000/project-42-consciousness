# Mémoire de reprise

Dernière mise à jour : 10 octobre 2026. Ce document décrit des faits datés ; confirmer l'état distant avant d'agir.

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
3. Les statistiques actuelles sont descriptives : pas d'intervalle d'incertitude ni d'analyse confirmatoire. La calibration est agrégée sur toutes les lignes. Les paires sont formées par modèle/protocole/identifiant, puis leur désaccord est agrégé par protocole ; aucune comparaison entre modèles ni direction d'effet n'est fournie.

## Prochaine étape scientifique

Préparer P01 comme pilote exécutable et préenregistrable : items et réponses vérifiés, jeux développement/évaluation distincts, baseline constante définie sur le développement, paramètres et version du modèle, Brier primaire, exclusions, manifeste, effectif, règle d'arrêt et plan d'incertitude par item. Le livrable attendu est un dossier méthodologique et un traitement local testé. Aucun appel payant ou collecte réelle tant que budget et plan ne sont pas fixés.

## Continuité

Une reprise quotidienne à 09:00 Europe/Paris a été créée dans le même chat et confirmée ACTIVE par le planificateur, référence `projet-42-reprise-quotidienne`. Une seule tâche bornée par reprise ; sauvegarde puis arrêt du travail coûteux lorsqu’une fenêtre de quota a moins de 20 % restant. L'automatisation dépend du service de planification, de l'environnement disponible et des quotas ; la mémoire versionnée est le point de reprise durable.

Lire `docs/TASKS.md` pour les critères d'achèvement et `docs/RUN_LOG.md` pour la dernière preuve. Ne jamais déclarer une tâche terminée sur la seule base de ce résumé.
