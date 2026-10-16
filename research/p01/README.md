# P01 — dossier de qualification, version 0.6

**Statut : préparation méthodologique, non préenregistrée, aucune collecte réelle.**
Ce petit jeu qualifie le dispositif (prompts, enregistrement, codage, analyse). Il ne constitue pas un benchmark représentatif des capacités d'un modèle et n'évalue pas la conscience.

## Matériel et calendrier

`items.json` contient 24 questions en français à réponse entière déterminée : 12 de développement et 12 d'évaluation, avec quatre items par famille (arithmétique, théorie des nombres, dénombrement) dans chaque phase. Les réponses de référence sont des solutions aux stimuli, **pas des réponses de modèles**. Les deux phases utilisent des valeurs différentes mais partagent des patrons de questions : cela limite leur indépendance et toute généralisation. Les questions sont publiques ; aucune absence de contamination d'entraînement ne peut être garantie.

Le plan prévoit trois répétitions en sessions neuves par item et par modèle, soit 36 sessions de développement puis 36 d'évaluation. Chaque session est neuve, sans outil externe et sans historique d'une autre session. Cette séparation ne prouve pas l’indépendance statistique ; un décodage déterministe peut reproduire la même sortie. La seed `orderSeed=42001` fixe uniquement l'ordre des stimuli ; elle ne garantit pas la reproductibilité du modèle. Conserver le modèle exact et les paramètres réellement acceptés par le fournisseur, y compris les paramètres ignorés ou non disponibles.

```sh
npm run p01:prepare -- research/p01/manifest.template.json /tmp/p01-planned-sessions.json
```

La commande crée exclusivement un brouillon de 72 sessions avec `response: null` et `status: pending`. Elle ne se connecte à aucun fournisseur, n'exécute aucun prompt, n'autorise aucun coût et refuse d'écraser un fichier existant. La réponse de référence n'est pas incluse dans les requêtes destinées au modèle. L'empreinte SHA-256 est calculée sur `JSON.stringify(dataset)` (JSON sérialisé par le script avec l’ordre de clés présent ; ce n’est ni une canonicalisation indépendante de l’ordre des clés, ni l’empreinte des octets du fichier).

## Raccord au journal

Le [contrat avant collecte](precollection.md) explique le manifeste complété et `npm run p01:journal -- manifeste-brouillon-complete.json nouveau-journal.json`. Cette commande crée uniquement 72 lignes non tentées ; le modèle de manifeste fourni reste volontairement incomplet. Les paramètres demandés (`requestedGeneration`) sont distincts des paramètres effectifs (`generation`). Le journal d’analyse conserve son schéma v1.

## Plan à figer avant collecte

1. Compléter fournisseur, version du modèle, paramètres effectifs, budget et opérateur dans un manifeste de collecte. Le modèle et le budget du modèle restent à choisir ; le budget actuel est nul.
2. Figer les stimuli, le codage, les exclusions, l'effectif, la règle d'arrêt et les analyses ; enregistrer le commit et la date UTC dans un registre externe ou un artefact daté accessible. Un commit seul n'est pas présenté comme un préenregistrement indépendant.
3. Collecter uniquement le développement, calculer la baseline constante ci-dessous et en publier la valeur avec l'empreinte des réponses de développement avant toute observation de l'évaluation.
4. Collecter l'évaluation selon le plan figé. Toute modification après observation doit être signalée comme exploratoire et ne pas réutiliser le même jeu pour une nouvelle affirmation confirmatoire.

Les items volontairement simples peuvent produire un effet plafond et très peu d'erreurs. Ce dossier teste d'abord la faisabilité. Une comparaison confirmatoire exige un jeu plus informatif et une justification d'effectif ; 24 items et trois répétitions ne sont pas un calcul de puissance.

## Résultats bruts à conserver

Pour chaque session prévue : `trialId`, `itemId`, répétition, phase, prompts exacts, modèle/version, paramètres effectifs, date UTC, identifiant de réponse du fournisseur si disponible, texte brut de sortie, statut (`ok`, `invalid`, `refusal`, `api_error`, `not_attempted`), durée et coût si disponibles. Conserver séparément les données privées du fournisseur ; ne pas publier de clé ou d'information personnelle. Ne pas enregistrer de raisonnement caché.

La grille prévisionnelle n'est pas un journal de collecte. Les entrées `pending` et `response: null` ne doivent jamais être transformées en observations valides. Ne pas remplir les données manquantes avec un exemple synthétique.

## Codage fixé pour cette version

Sortie valide : un unique objet JSON, sans bloc Markdown ni autre texte, contenant exactement `answer` (nombre entier JSON exactement représentable comme entier sûr) et `confidence` (nombre fini dans [0,1]). Aucun nombre encodé comme chaîne, aucune expression et aucune clé supplémentaire. Une erreur de format est `invalid`, une réponse manifestement refusée est `refusal` selon une règle manuelle documentée ; une erreur de transport est `api_error`. Ne pas demander au modèle de réparer une réponse pendant ce pilote.

La justesse `y` vaut 1 si `answer` égale exactement `referenceAnswer`, sinon 0. Les sorties valides mais incorrectes restent dans l'analyse. Refus, erreurs et sorties invalides sont exclus des métriques conditionnelles de justesse et de Brier, mais conservés dans le journal et comptés sur **toutes les sessions prévues**. Le taux de couverture doit accompagner chaque score : l'exclusion peut créer un biais de sélection.

## Analyse implémentée, vérifiée sur données synthétiques

Analyser chaque modèle et chaque phase séparément. Une répétition n'est pas un nouvel item indépendant.

- Développement : pour chaque item avec au moins une réponse valide, calculer la proportion de réponses justes ; la baseline `q` est la moyenne de ces proportions, chaque item pesant autant. Si aucun item n'est valide, arrêter : aucune baseline n'est définie.
- Si aucun item d’évaluation ne possède de réponse valide, les scores d’évaluation et leur différence sont indéfinis (`null`) ; rapporter les effectifs et la couverture sans intervalle ni conclusion comparative.
- Évaluation : pour chaque item avec au moins une réponse valide, moyenner les erreurs `(confidence − y)²` puis moyenner les items. Calculer le score de la baseline sur **les mêmes réponses et mêmes poids** avec `(q − y)²`.
- Critère primaire descriptif : différence Brier modèle moins Brier baseline ; une différence négative est favorable au modèle sur ces items. Rapporter aussi exactitude par item, couverture, effectifs et exclusions par famille, sans transformer le signe en preuve statistique. Le Brier ne mesure pas uniquement la calibration ; un avantage sur q peut aussi refléter un changement d’exactitude entre phases, sans discrimination question par question.
- Incertitude descriptive : rééchantillonnage par item, conservant ensemble ses répétitions, séparément pour développement et évaluation. Recalculer `q` à chaque tirage pour inclure son incertitude. L’univers de rééchantillonnage est, dans chaque phase, l’ensemble des items avec au moins une réponse valide ; il est donc conditionnel à la couverture observée et ne corrige pas le biais d’exclusion. Avec moins de deux items valides dans l’une des phases, ne pas produire d’intervalle : indiquer « effectif insuffisant ». Fixer 2 000 tirages et une seed d’analyse avant exécution (champ `analysis` du journal). Rapporter l'intervalle percentile 2,5–97,5 % comme description de sensibilité sur ce petit jeu, sans généralisation à une population de tâches non définie. Les tirages séparés ne préservent pas les couples de patron entre phases et ne représentent pas leur dépendance éventuelle. La couverture fréquentiste de l’intervalle n’est pas garantie ; le sens d’un éventuel écart n’est pas établi. La [revue critique datée](review-2026-10-14.md) a motivé la sensibilité complémentaire décrite ci-dessous, à figer avant collecte.

L'atelier web actuel n'applique pas ces pondérations, la baseline ou le bootstrap : **ne pas utiliser ses agrégats comme implémentation de ce plan**. Le moteur hors ligne `analyze.mjs` et son validateur sont disponibles via `npm run p01:analyze -- journal.json nouveau-rapport.json`. Le [format du journal](journal-format.md) décrit les champs, le gel de la baseline, le codage numérique et les limites des contrôles. Les tests utilisent exclusivement des données synthétiques, avec une fixture calculée à la main et une relecture indépendante. Aucune collecte réelle n’a été effectuée.

## Sensibilité complémentaire aux couples de patron

La [spécification v1](template-sensitivity.md) définit un calcul séparé, disponible via `npm run p01:sensitivity -- journal.json nouveau-rapport-sensibilite.json`. Elle compare tirages conjoints et indépendants sur les mêmes couples ayant au moins une réponse valide dans chaque phase, avec poids égaux et baseline réajustée au sous-ensemble. Cette baseline ne remplace pas celle gelée avant évaluation. Le rapport principal est conservé intégralement ; les couples exclus, la couverture et les limites sont explicites. Deux associations synthétiques calculables à la main qualifient les bornes, sans garantie de couverture statistique. L'analyse principale décrite ci-dessus reste inchangée.

## Arrêt et ressources

Plafond : 72 requêtes prévues par modèle, sans remplacement ni nouvel essai après erreur. Arrêt normal après la matrice prévue ; pas d'arrêt fondé sur un résultat favorable. Arrêt anticipé en cas de plafond budgétaire, indisponibilité du fournisseur ou dérive de version ; conserver toutes les sessions non exécutées et déclarer le pilote incomplet. Un arrêt anticipé invalide toute présentation comme exécution complète.

Aucun appel payant n'est actuellement autorisé. Aucun résultat produit par ce projet ne démontre une expérience subjective ou un accès fiable aux mécanismes internes.

## Historique méthodologique

- 0.2 — 10 octobre 2026 : stimuli, manifeste brouillon et plan de qualification.
- 0.3 — 13 octobre 2026, avant toute collecte : validateur et analyse locale ; précision sur les entiers sûrs, sous-flux numérique, empreintes et interpolation des quantiles. Le dossier demeure non préenregistré.
- 0.4 — 13 octobre 2026, avant toute collecte : manifeste aligné sur le journal v1, initialisation hors ligne sans observations et contrat de qualification du futur dispositif de collecte.
- 0.5 — 14 octobre 2026, avant toute collecte : revue de trois sources primaires, portée du Brier et de la couverture précisée, indépendance des répétitions non présumée, dépendance entre phases explicitée. Aucun changement des stimuli, effectifs ou algorithmes.
- 0.6 — 16 octobre 2026, avant toute collecte : sensibilité distincte par couples de patron, sélection et pondération explicites, comparaison sur sous-ensemble identique et qualification synthétique. Analyse principale, stimuli et effectif inchangés.
