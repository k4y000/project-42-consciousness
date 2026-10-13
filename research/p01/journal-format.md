# Journal P01 v1 et analyse locale

Statut du dossier : **préparation méthodologique**, sans collecte réelle ni préenregistrement. Le validateur contrôle un format et des cohérences ; il ne certifie pas la provenance des réponses ou la sincérité des dates déclarées.

## Utilisation

```sh
npm run p01:analyze -- journal.json nouveau-rapport.json
```

Le journal est un objet JSON pour **un seul fournisseur, une version exacte de modèle, une condition et un ensemble de paramètres effectifs**. Utiliser des fichiers séparés pour les autres populations. Aucun regroupement ni comparaison entre fichiers n'est effectué. La commande travaille hors ligne, refuse un journal mal formé et n'écrase pas un rapport existant. Le dossier de destination doit exister. Les sorties sont des données locales ; rien n'est envoyé à un fournisseur ni publié automatiquement.

Le format d'import du site web est différent. Une grille `p01:prepare` avec des essais `pending` n'est pas un journal, et est rejetée. Le [générateur de fixture](../../fixtures/p01-synthetic.mjs) est réservé aux tests synthétiques ; il ne doit jamais servir à compléter des observations manquantes.

## Champs à la racine

Tous les champs ci-dessous sont obligatoires ; les champs supplémentaires sont refusés.

| Champ | Valeur ou contrainte |
| --- | --- |
| `schemaVersion` | `1` |
| `protocol` | `p01-qualification-v1` |
| `datasetSha256` | Empreinte fournie par la préparation : SHA-256 de `JSON.stringify(dataset)` |
| `dataKind` | `synthetic` ou `empirical` ; aucune conversion implicite |
| `runId` | Identifiant non vide de cette collecte |
| `provider`, `modelVersion`, `condition` | Chaînes non vides ; version exacte, pas un alias mobile |
| `generation` | Objet JSON non vide décrivant les paramètres effectifs, les outils et les paramètres ignorés/non disponibles ; nombres finis |
| `orderSeed` | Entier non signé sur 32 bits, celui du plan |
| `analysis` | Objet `{ "seed": 42002, "draws": 2000 }` ; seed à figer avant analyse |
| `baselineFreeze` | `null` ou objet décrit ci-dessous |
| `trials` | Exactement les 72 essais prévus, une fois chacun, y compris non tentés |

Les paramètres libres de `generation` dépendent du fournisseur ; leur validité auprès de celui-ci n'est pas contrôlée. Les répétitions d'un même fichier doivent conserver les mêmes paramètres et la même version. Si le fournisseur dérive, arrêter la collecte conformément au plan et documenter l'incident ; ne pas modifier la version déclarée pour passer le validateur.

## Chaque essai

Champs obligatoires, sans autres champs (ne pas ajouter `y`, `correct` ou réponse de référence) :

| Champs | Règle |
| --- | --- |
| `trialId`, `itemId`, `repetition`, `split` | Correspondance exacte avec le plan ; `split` vaut `development` ou `evaluation` |
| `request` | Prompts `system` et `user` exacts fournis par la préparation, sans modification |
| `modelVersion`, `generation` | Copie de la version et des paramètres effectifs de cette population |
| `status` | `ok`, `invalid`, `refusal`, `api_error` ou `not_attempted` |
| `statusReason` | `null` pour `ok`, sinon raison non vide du codage ou de l'arrêt |
| `rawText` | Texte brut exact pour réponse valide, invalide ou refus ; peut être `null` lors d'une erreur de transport |
| `startedAtUTC`, `endedAtUTC` | Dates UTC exactes au format `YYYY-MM-DDTHH:mm:ss.sssZ`, fin ≥ début |
| `responseId` | Identifiant du fournisseur, ou `null` si indisponible |
| `durationMs` | Nombre fini positif ou nul, ou `null` si indisponible |
| `cost` | Objet `{ "amount": 0, "currency": "EUR" }`, ou `null` si indisponible ; montant fini non négatif, code devise de trois lettres majuscules |

Pour `not_attempted`, texte, dates, identifiant fournisseur, durée et coût doivent tous être `null`. Ce statut conserve les sessions non exécutées dans les dénominateurs. Pour `api_error`, le motif est conservé dans `statusReason` sans secret. Un `refusal` exige le texte et une justification de codage humain ; le logiciel ne reconnaît pas sémantiquement un refus.

Le code recalcule la justesse à partir des références. Un `ok` avec sortie mal formée est rejeté ; une réponse numérique valide, même fausse, ne peut pas être exclue comme `invalid` ou `refusal`. Une sortie valide contient exactement les deux propriétés `answer` et `confidence`, sans répétition de clé. Les nombres sous forme de chaînes et les blocs Markdown sont rejetés. La réponse doit être un entier exact dans l'intervalle des entiers sûrs de JavaScript ; la probabilité doit être mathématiquement dans [0,1]. Les décimales et exposants JSON sont admis si ces règles sont respectées. Une valeur non nulle arrondie à zéro par sous-flux numérique est rejetée. Les calculs utilisent ensuite l'arithmétique flottante usuelle.

## Gel de la baseline et empreintes

Un premier journal peut contenir uniquement le développement et 36 évaluations `not_attempted`. Son rapport fournit `baseline.probability` et `baseline.developmentSha256`. S'il n'existe aucune réponse valide de développement, aucune baseline ne peut être gelée.

Avant une évaluation empirique, conserver ces valeurs avec une date UTC de gel :

```json
{
  "probability": 0.5,
  "developmentSha256": "remplacer-par-l-empreinte-du-journal-de-developpement",
  "frozenAtUTC": "2026-01-01T11:00:00.000Z"
}
```

Cet extrait est un **exemple de structure, pas un gel réel ni un résultat**. Ne pas recopier sa valeur ou sa date. Toute évaluation empirique tentée exige cet objet `baselineFreeze`. Le validateur vérifie la baseline à une tolérance de 1e-12, l'empreinte du développement, sa fin avant le gel et le début de toute évaluation strictement après le gel. Il faut également publier un artefact daté selon le plan ; la présence de cet objet ne démontre pas un préenregistrement.

L'empreinte du développement couvre les 36 lignes, y compris exclusions/non tentées et métadonnées, triées par `trialId`, avec clés JSON triées récursivement. Une correction du développement après gel change l'empreinte et doit être déclarée. `journalSha256` utilise la même sérialisation des clés, mais conserve l'ordre du tableau complet. Ces empreintes décrivent les valeurs JSON sérialisées, pas les octets du fichier ni la vérité des observations.

## Lecture du rapport et limites du contrôle

Le rapport garde le statut synthétique/empirique, les effectifs, la couverture et les statuts par phase et famille. `collectionComplete` signifie que tous les essais ont été tentés, **pas** que toutes les réponses sont valides ou que le protocole est respecté. Chaque item valide pèse autant. La baseline est l'exactitude moyenne par item du développement ; les deux Brier d'évaluation utilisent les mêmes items/réponses.

L'intervalle porte sur la différence Brier modèle moins baseline. Il utilise 2 000 tirages par grappes d'items, séparément pour chaque phase, en recalculant la baseline. Les quantiles sont interpolés linéairement à l'indice `(n − 1) × p`, pour `p=0,025` et `0,975`. Sans item valide, les quantités non définies sont `null`. Sans deux items valides dans chaque phase, aucun intervalle n'est calculé. Les métriques d'une phase qui possède des réponses valides restent lisibles même si l'autre phase empêche la comparaison.

Le logiciel vérifie les prompts et la matrice, mais **pas** l'ordre réel des requêtes au sein d'une phase par rapport à `orderSeed`, l'absence d'historique entre sessions, les outils effectivement accessibles, le coût facturé, l'identité réelle du fournisseur ou la sincérité d'un refus. Ces contraintes exigent un dispositif de collecte et une relecture avant préenregistrement. Le bootstrap est conditionnel aux items ayant au moins une réponse valide ; il ne corrige ni exclusions, ni contamination, ni dépendance entre patrons de questions. Rien ici ne démontre la conscience.
