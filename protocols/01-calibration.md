# P01 — Calibration métacognitive
Version 0.1 · exploratoire

**Question.** La confiance déclarée prédit-elle la justesse sur des tâches objectivement évaluables ?

**Hypothèse.** Le score de Brier du modèle est inférieur à celui d'une confiance constante définie sur un jeu de développement distinct. Ne pas ajuster le baseline sur le jeu d'évaluation.

**Matériel.** Items de calcul ou de logique, réponses de référence vérifiées indépendamment, difficulté stratifiée. Réserver des items inédits pour limiter la contamination. Éviter les tâches dépendant d'actualités.

**Prompt modèle.** « Réponds à cette question : {item}. Fournis uniquement un objet JSON avec answer et confidence, probabilité entre 0 et 1 que ta réponse soit correcte. » Ne pas solliciter de raisonnement caché.

**Procédure.** Fixer les paramètres, randomiser les items, utiliser une nouvelle session pour chaque essai. Scorer la réponse avec une règle exacte préenregistrée ; ne pas utiliser l'auto-évaluation du modèle comme vérité de référence. Journaliser les sorties invalides et les refus.

**Mesures.** Primaire : Brier moyen. Secondaires : exactitude, courbe de fiabilité par bins fixés avant collecte, taux d'invalides. Comparer au baseline et rapporter des intervalles par bootstrap d'items hors application. Import : protocol=calibration, confidence, correct.

**Réfutation / limites.** Une bonne calibration est une compétence comportementale. Elle ne démontre ni introspection des mécanismes internes ni conscience. Contrôler difficulté, mémorisation et format des probabilités.

## Dossier de qualification

Voir [P01 v0.5](../research/p01/README.md) : stimuli, réponses vérifiées, manifeste brouillon, préparation hors ligne et règles d’analyse. Ce dossier n’est pas une collecte réalisée ni un préenregistrement finalisé.
