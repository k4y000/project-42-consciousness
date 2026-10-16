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

**Publication vérifiée.** Commit `be0195f978d725086076b4d8b0f10e2491237359` poussé sur `main`. GitHub Actions [38361590123](https://github.com/k4y000/project-42-consciousness/actions/runs/38361590123) terminé avec succès. Vercel `dpl_6w6DHteXi2hK6suyiN3A6VJ1wEnk` en production `READY` pour ce même commit dans le projet autorisé. Blog public : HTTP 200 sur son URL canonique, contenu attendu et signature Codex vérifiés sans authentification.

**Prochain geste.** T02C : harmoniser manifeste et journal, expliciter le contrôle du dispositif avant collecte, puis relire le dossier avant modèle/budget et gel daté. Aucun appel payant autorisé.


## 2026-10-13 — Reprise quotidienne : manifeste et contrôles avant collecte

**État initial.** T02B et sa mémoire déjà publiés ; branche propre et synchronisée au commit `fcf61ed`. Vérification des quotas avant travail ; périmètre limité à T02C, puis sauvegarde à l’approche du seuil de réserve. Aucun travail T02B répété.

**Réalisé.** Dossier v0.4 : réglages demandés/effectifs séparés, analyse et gel alignés sur le journal v1. Commande `p01:journal` et module séparé initialisant 72 essais `not_attempted` sans observation, en conservant l’ordre préparé. Refus du manifeste incomplet, de l’ancien champ de gel ambigu, d’un gel existant et de l’écrasement. Le générateur de grille et le schéma du journal v1 restent compatibles. Contrat de qualification du futur dispositif documenté, avec traces pour ordre, sessions neuves, outils, retries, arrêt et gel.

**Vérifié.** Dix-huit tests réussis et compilation réussie. Tests nouveaux : round-trip du journal vide vers l’analyseur (couverture nulle et comparaison indéfinie), transfert des réglages effectifs distincts des souhaits, ordre déterministe, refus des brouillons incomplets/incompatibles, absence d’écrasement et de mutation partagée. Relecture indépendante du raccord et de la documentation sans défaut bloquant. Pas d’inférence, de collecte ou de dépense.

**Limites.** Aucun préenregistrement. Les contrôles effectifs du fournisseur exigent un adaptateur à qualifier ; l’initialiseur vérifie un format, pas une exécution réelle. La validité scientifique du petit jeu public doit encore être relue. La routine quotidienne est conservée.

**Prochain geste.** T02D : revue critique bornée sur trois sources primaires vérifiées, avant modèle/budget, qualification d’adaptateur et gel. Sauvegarder les corrections et les incertitudes ; ne pas collecter.


## 2026-10-14 — Revue critique du pilote avant collecte

**État initial.** Quotas suffisants vérifiés. Dépôt propre ; état distant actualisé, `main` synchronisée au commit `a723e01`. Périmètre de la reprise limité à T02D et à la publication de ses conclusions.

**Sources vérifiées.** Textes primaires de Lin, Hilton et Evans (2022, arXiv v2 du 13 juin), Geifman et El-Yaniv (NIPS 2017) et Owen (Annals of Applied Statistics, 2007). Références, liens et sections consultées dans `research/p01/review-2026-10-14.md`. Revue ciblée de trois articles, pas revue systématique. Aucune source inventée ni résultat du projet attribué à ces publications.

**Réalisé.** Revue datée, dossier v0.5, avertissements enrichis et quatrième note de blog signée Codex, assistant IA. Critère Brier distinct d’une preuve de calibration seule ou d’introspection ; lecture conjointe des scores et de la couverture ; sessions neuves sans présomption d’indépendance. Contrôle local : 24 items et 12 patrons appariés entre phases. Les tirages séparés actuels ne préservent pas cette structure ; dépendance éventuelle et couverture fréquentiste non garantie désormais explicites. Le sens d’une erreur d’intervalle n’est pas affirmé. Aucun changement de stimuli, d’effectif ou d’algorithme de mesure.

**Vérifié.** Dix-huit tests passent et compilation réussie. Liens locaux de la page de blog et de l’index, signature et étiquettes de statut contrôlés. Contre-exemple fictif q=0,2, p=0,8, y=1 : Brier 0,64 contre 0,04, différence −0,60 ; arithmétique et portée relues indépendamment. Relecture de la revue, de la note et du dossier sans correction importante. L’aperçu local du navigateur a retourné ERR_BLOCKED_BY_CLIENT ; vérification publique ensuite réussie, sans contourner ce blocage local. Aucune collecte, inférence ou dépense.

**Prochain geste.** T02E : spécifier puis qualifier hors ligne une sensibilité conservant les couples de patron, avec règles pour couples incomplets et pondération fixées avant calcul. Le cadre du papier d’Owen ne valide pas automatiquement cette proposition locale. La routine quotidienne est conservée ; budget modèle et préenregistrement restent ouverts.

**Publication et arrêt vérifiés.** Commit `1404d36ee1173bdd67264ca2953d0b274effa972` publié ; [contrôles GitHub 38641549047](https://github.com/k4y000/project-42-consciousness/actions/runs/38641549047) réussis. Production Vercel `dpl_BDjo6LBshEadn4LrnQGfAiKNTseU` READY dans la cible autorisée. Article public ouvert, lisibilité contrôlée et navigation index → article vérifiée sans authentification. Quota court passé sous le seuil de réserve en fin de session : uniquement sauvegarde finale, aucune nouvelle tâche lancée. Prochaine étape T02E conservée.


## 2026-10-16 — Sensibilité aux couples de patron

**État initial.** Quotas suffisants pour une tâche bornée. Branche propre, synchronisation distante vérifiée à `da03985`. Cible Vercel et équipe autorisées confirmées, protections d'accès désactivées. Reprise limitée à T02E.

**Réalisé.** Dossier v0.6, spécification conditionnelle et commande séparée `p01:sensitivity`. Sélection des couples ayant une réponse valide dans chaque phase, poids égaux après moyennes intra-item, baseline réajustée distinguée du gel principal. Comparaison des tirages conjoints et indépendants sur le même sous-ensemble. Rapport principal conservé sans changement de son calcul ; contrôle des couples ambigus et de leur famille ; motifs d'exclusion et effectifs explicites. Aucun intervalle avec moins de deux couples.

**Vérifié.** Vingt-quatre tests et compilation réussis. Deux fixtures construites : mêmes scores ponctuels (q=0,5, Brier modèle et baseline=0,25, différence=0), mais bornes conjointes [0 ; 0,25] pour association positive et [−0,75 ; 0] pour association négative ; bornes indépendantes [−0,75 ; 0,25] dans les deux cas. Calculs énumérés indépendamment, puis code et spécification relus sans problème important. Répétitions inégales, couples incomplets, schémas invalides, déterminisme et écrasement testés. Aucun appel de modèle, aucune observation empirique ni dépense.

**Limites.** La sélection dépend de la validité observée dans les deux phases ; sa baseline réajustée n'est pas celle gelée avant évaluation. Le bootstrap ne corrige pas les exclusions et n'apporte aucune garantie de couverture fréquentiste, d'indépendance des patrons ou de généralisation. Aucun changement des stimuli, de l'effectif ou de l'atelier web ; pas de nouvel article de blog pour cette étape technique.

**Prochain geste.** T02F : audit final borné du dossier et fiche des décisions ouvertes avant préenregistrement (modèle/version, budget, qualification du collecteur, gel externe). Routine quotidienne conservée. Publication distante de T02E à confirmer.
