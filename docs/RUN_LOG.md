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


## 2026-10-13 — Reprise reçue et analyse P01 hors ligne

**État initial vérifié.** Quotas suffisants pour une tâche bornée. Branche propre, un commit local non poussé (`8601907`, T02A) : publication effectuée sans refaire ce travail. Vercel confirme pour ce commit le déploiement de production `dpl_7ie1ixHwYSdpi3P6kC1JbMg799P2` en état `READY`, sous le projet et l’équipe autorisés.

**Réalisé.** T02B, dossier P01 v0.3 : validation des journaux complets de 72 essais, codage strict depuis le texte brut, refus des mélanges de versions/paramètres, empreintes et cohérence du gel de baseline avant évaluation empirique. Analyse par item, couverture et exclusions par phase/famille, Brier et comparaison à la baseline, bootstrap conditionnel de 2 000 tirages recalculant la baseline. Commande hors ligne `p01:analyze`, sans écrasement des rapports. Format et limites documentés. Aucun appel à un modèle, aucune donnée empirique ni dépense.

**Vérifié.** Quinze tests réussis et compilation réussie. Fixture exclusivement synthétique calculable à la main : q = 1/3, Brier modèle = 0,12, Brier baseline = 1/3, différence = −16/75 ; bootstrap de cette fixture [−0,84 ; 11/225]. Relecture indépendante des calculs et du code. Elle a détecté un arrondi JavaScript pouvant convertir une fraction brute en entier valide ou une probabilité au-dessus de 1 en 1 ; validation décimale corrigée, testée et revérifiée. Les chiffres de cette fixture ne sont pas des résultats de recherche.

**Limites.** Aucun préenregistrement. Provenance, ordre réel intra-phase, sessions neuves et outils accessibles ne sont pas certifiés par le validateur. Les refus demeurent un codage humain justifié. L’intervalle est conditionnel aux items avec réponses valides, sur un petit jeu public partageant des patrons entre phases. L’atelier web garde ses agrégats initiaux ; l’analyse P01 utilise une commande et un format séparés.

**Continuité.** La reprise unique prévue pour le 11 octobre a été reçue le 13 octobre. Suppression de `projet-42-reprise-00-h-47` confirmée par le planificateur ; routine quotidienne conservée ACTIVE dans sa configuration. Pas de nouvelle routine.

**Prochain geste.** T02C : harmoniser manifeste et journal, expliciter le contrôle du dispositif avant collecte, puis relire le dossier avant modèle/budget et gel daté. Aucun appel payant autorisé.
