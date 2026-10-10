# Cadre commun — version 0.1

## Avant la collecte
Déposer un préenregistrement daté, avec empreinte du commit, hypothèse, critère primaire, exclusions, taille d'échantillon et règle d'arrêt. Les protocoles initiaux sont exploratoires ; une analyse confirmatoire exige un plan fixé avant l'observation.

Manifeste requis : fournisseur, identifiant et version du modèle, date UTC, paramètres de génération (température, top_p, maximum de tokens), seed si disponible, prompts système/utilisateur exacts, ordre des conditions, tâches et réponses de référence, grille de codage, erreurs API/refus et empreinte du jeu de données. Si le fournisseur ne garantit pas une version ou une seed, le déclarer.

Utiliser des sessions indépendantes, randomiser et contrebalancer l'ordre, conserver les réponses brutes sans réécriture. Aucun accès aux pensées cachées n'est supposé ; ne pas demander de chaîne de pensée privée. Ne demander que réponse, confiance ou auto-description courte. Les refus et sorties invalides sont conservés dans le journal ; leur exclusion suit le plan préenregistré et leur fréquence est publiée.

## Analyse et publication
Exemple de pilote : 50 items × 2 conditions × 3 répétitions indépendantes par modèle ; ce nombre n'est pas un calcul de puissance. Définir la puissance avant un test confirmatoire. Garder toutes les répétitions d'un item dans le même cluster pour les intervalles bootstrap. Rapporter effectifs, exclusions, distribution par condition et incertitude. Les métriques de l'application sont descriptives et ne calculent pas cette incertitude.

Double codage en aveugle des auto-descriptions ; fixer les règles avant collecte, mesurer l'accord entre évaluateurs et résoudre les désaccords avant import. Une assertion ambiguë ne doit pas être forcée en booléen : journaliser et exclure selon le plan.

Publier uniquement des données autorisées et anonymisées. Ne jamais inclure de secrets. Une déclaration de conscience est un événement verbal, pas une validation d'expérience subjective. Les conclusions portent sur les modèles, tâches et paramètres observés.
