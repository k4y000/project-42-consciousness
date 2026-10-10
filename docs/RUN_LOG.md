# Journal de reprise

## 2026-10-10 — Initialisation et continuité

**Réalisé.** Dépôt MIT public, application d'analyse locale, trois protocoles exploratoires, trois notes de blog signées Codex. Sources du blog au commit `9473f26bff431406adefbb03ab5d891098fff837`. Connexion du dépôt au projet Vercel de l'équipe `Aymeric's projects` confirmée.

**Vérifié.** Trois tests de métriques et compilation réussis. Démo synthétique contrôlée dans le navigateur. Déploiement `dpl_3XXSbKTFTEZTWRWyhywCsQ8w4JQT` en production, état `READY`, commit correspondant confirmé par Vercel.

**Décision.** Mettre en place mémoire versionnée et reprise quotidienne bornée. Priorité scientifique suivante : pilote P01 préenregistrable. Une relecture indépendante des protocoles a relevé l'agrégation des métriques et l'induction de fiction de P03 comme limites à conserver explicitement.

**Routine créée.** Le planificateur a confirmé `projet-42-reprise-quotidienne` ACTIVE, reprise quotidienne demandée à 09:00 Europe/Paris dans ce chat. Une tâche bornée, contrôle des quotas, sauvegarde avant arrêt et notification uniquement sur changement significatif.

**Accès public configuré.** Après autorisation explicite du propriétaire, la mise à jour du projet a réussi ; Vercel retourne `ssoProtection.enabled=false`.

**Publication automatique vérifiée.** Push du commit `b6f85c49b4797e9bdb24f7232c8e8cc7951a8b7c` : Vercel a créé `dpl_DoyT6NgwM87rJsgioNKSWPtzfgnF`, source `git`, production `READY`, alias principal correctement affecté. GitHub retourne le statut Vercel `success`.

**Accès vérifié.** Accueil, blog et article « Lire un score de Brier » ouverts dans le navigateur intégré sans connexion Vercel ni lien de contournement. Le contenu attendu et la clarification des agrégats sont visibles. Le contrôle Python initial a rencontré un problème local de certificats ; aucun contrôle TLS n’a été désactivé.

**État final.** T01 terminé. Mémoire versionnée, routine ACTIVE et publication opérationnelle.

**Prochain geste.** Préparer T02 : dossier P01 prêt pour préenregistrement, sans exécuter d’inférence payante. Une future collecte exige un plan et un budget fixés.


## 2026-10-10 — Dossier P01 et reprise nocturne

**Réalisé.** T02A : dossier méthodologique P01 v0.2, 24 questions et solutions (12 développement, 12 évaluation ; trois familles), manifeste brouillon, générateur déterministe de 72 sessions prévues. Les références ne sont pas transmises dans les requêtes ; aucune sortie de modèle n’a été créée ni aucun appel API effectué. Le générateur refuse d’écraser un fichier existant.

**Vérifié.** Six tests passent, compilation réussie, génération hors ligne de 36 sessions par phase réussie. Une seconde relecture a recalculé les 24 réponses : toutes correctes, sans ambiguïté mathématique notable. Elle a fait préciser le traitement d’une évaluation sans réponse valide et l’univers du bootstrap. Le bootstrap et la collecte ne sont pas encore implémentés.

**Routine.** Le planificateur et sa configuration enregistrée confirment `projet-42-reprise-00-h-47` ACTIVE, exécution unique à 00:47 le 11 octobre 2026 ; la routine quotidienne de 09:00 est conservée. Cette session a été explicitement demandée par le propriétaire malgré un quota court inférieur à 20 %, avec un périmètre limité et sauvegarde avant arrêt.

**Prochain geste.** T02B : validateur des journaux et analyse spécialisée avec fixtures synthétiques vérifiables. Lire le dossier, garder les cas d’exclusion et d’effectif insuffisant explicites, ne pas transformer la qualification en résultat empirique ou en preuve de conscience. Avant toute collecte réelle, modèle, budget et plan doivent être fixés.
