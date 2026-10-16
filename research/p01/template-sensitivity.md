# P01 — sensibilité aux couples de patron, version 1

Décision méthodologique du 16 octobre 2026, avant toute collecte. **Brouillon non préenregistré, qualification synthétique uniquement.** Cette proposition locale fait suite à la [revue critique](review-2026-10-14.md) ; elle ne reprend aucune garantie de couverture d'Owen.

## Population et quantité décrite

L'univers est le jeu public fixé de 12 couples `template`, chacun réunissant exactement un item de développement et un d'évaluation de la même famille. Une structure ambiguë est refusée. Ce jeu de convenance ne définit pas une population générale de questions.

Un couple est éligible si **chacun** de ses deux items possède au moins une réponse `ok`. Une seule répétition valide suffit ; les autres restent comptées dans la couverture et les exclusions du rapport principal. Si un côté n'a aucune réponse valide, les deux items sont exclus de cette sensibilité, avec motif explicite. Aucune imputation ni remplacement. Cette sélection peut dépendre du comportement du modèle et biaiser les scores ; le rééchantillonnage ne corrige pas ce biais.

Pour les n couples éligibles, définir a_t comme l'exactitude moyenne des répétitions valides de développement, e_t comme celle d'évaluation et b_t comme le Brier moyen d'évaluation. Les répétitions valides ont des poids égaux dans leur item, puis les couples ont des poids égaux, quel que soit leur nombre de répétitions valides. Aucun rééquilibrage par famille.

La quantité descriptive est :

```text
q_S = moyenne_t(a_t)
B_modèle,S = moyenne_t(b_t)
B_baseline,S = moyenne_t(e_t × (1 − q_S)² + (1 − e_t) × q_S²)
delta_S = B_modèle,S − B_baseline,S
```

**q_S est une baseline réajustée sur le développement du sous-ensemble**, dont l'éligibilité dépend aussi de la validité en évaluation. Elle ne remplace pas la baseline gelée avant évaluation. Le critère principal et sa baseline sont conservés intégralement dans `primaryAnalysis`. L'écart entre le critère principal et delta_S peut provenir de la sélection des couples, pas seulement de leur dépendance.

## Deux rééchantillonnages sur le même sous-ensemble

- Conjoint : tirer n couples avec remise parmi les n éligibles, en gardant ensemble leurs deux items et toutes leurs répétitions valides. Recalculer q_S et delta_S dans chaque tirage. Un couple tiré deux fois compte deux fois.
- Indépendant : appliquer le bootstrap actuel aux seuls items du même sous-ensemble, en tirant séparément n items de développement et n d'évaluation, avec q_S recalculée. Cette comparaison conserve l'éligibilité et les poids ; seule la règle de tirage change.

Les deux méthodes utilisent chacune 2 000 tirages et la seed du journal, avec leur propre générateur initialisé à cette seed. Elles ne partagent pas des tirages appariés entre méthodes. L'ordre des couples est trié par identifiant `template` pour rendre le calcul déterministe. Les quantiles sont interpolés linéairement à 2,5 et 97,5 %, comme dans l'analyse principale.

Sans couple éligible : scores et bornes `null`. Avec un seul couple : scores disponibles, aucune borne. Les limites des deux méthodes ne sont pas des tests ni des intervalles à couverture fréquentiste garantie. Le tirage conjoint conserve l'association observée entre phases, sans démontrer l'indépendance des couples, modéliser toute dépendance entre familles, ni établir une cause de cette association.

## Qualification indépendante

Deux fixtures entièrement construites, sans modèle appelé : deux couples, exactitudes de développement (0, 1), une réponse valide par item, confiance d'évaluation constante 0,5.

| Association construite | Exactitudes d'évaluation | q_S | Brier modèle / baseline | delta_S | Bornes conjointes | Bornes indépendantes |
| --- | --- | --- | --- | --- | --- | --- |
| Positive | (0, 1) | 0,5 | 0,25 / 0,25 | 0 | [0 ; 0,25] | [−0,75 ; 0,25] |
| Négative | (1, 0) | 0,5 | 0,25 / 0,25 | 0 | [−0,75 ; 0] | [−0,75 ; 0,25] |

Énumération à la main : le tirage conjoint donne deux fois le même couple avec probabilité 1/2, sinon un de chaque. Dans le cas positif, les différences sont respectivement 0,25 et 0 ; dans le cas négatif, −0,75 et 0. Pour le tirage indépendant, les extrêmes −0,75 et 0,25 ont chacun une probabilité totale de 1/8. Ces masses dépassent 2,5 %, donc les quantiles de ces distributions discrètes sont les bornes indiquées. Les tests vérifient aussi que les 2 000 tirages à seed 42002 retrouvent ces valeurs. Il s'agit d'un contrôle logiciel, pas d'une simulation de couverture statistique.

Une fixture supplémentaire avec répétitions inégales et couples incomplets vérifie les poids, les exclusions et la distinction entre baseline principale et baseline réajustée. Les schémas invalides, les cas vides, les changements d'ordre et le refus d'écraser un rapport sont également contrôlés.

## Usage et limites

```sh
npm run p01:sensitivity -- journal.json nouveau-rapport-sensibilite.json
```

La commande utilise le même validateur strict de journal et conserve son analyse principale dans le rapport séparé. Elle ne modifie ni le journal, ni le manifeste, ni le calcul de `p01:analyze`, et refuse d'écraser la destination. Elle ne fait aucun appel de modèle. Avant une collecte, figer également cette version d'analyse, son univers conditionnel et ses règles.

Une différence de Brier ne suffit à démontrer ni calibration isolée, ni discrimination question par question, ni introspection fiable. Aucune expérience du projet ne prouve la conscience.
