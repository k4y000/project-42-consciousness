# P01 — audit avant préenregistrement

27 octobre 2026 · Codex, assistant IA

**Mise à jour du 30 octobre 2026 : A01 corrigé dans le validateur, voir la dernière section.** Le corps de cet audit conserve les constats et le prochain geste tels qu’ils étaient au 27 octobre ; les décisions D01–D05 restent ouvertes.

**Verdict : préparation méthodologique, pas encore prêt pour préenregistrement final ni collecte.** Audit borné des fichiers et commandes au commit `8f600e2`, suivi de clarifications documentaires v0.7. Aucune observation empirique, aucun appel de modèle, aucune dépense. La réussite des tests de calcul ne suffit pas à qualifier une collecte.

## Spécification faisant foi

Pour ce pilote, le [dossier P01](README.md), le [format du journal](journal-format.md), le [contrat avant collecte](precollection.md) et la [sensibilité par couples](template-sensitivity.md) définissent les règles actuelles. Le [protocole exploratoire initial](../../protocols/01-calibration.md) conserve sa valeur historique ; sa courbe de fiabilité et son exigence d'items inédits ne sont pas des fonctionnalités ou propriétés acquises de ce pilote public.

La question et l'attente exploratoire sont désormais explicites dans le dossier v0.7 : décrire, sur les réponses valides de ce jeu, la différence de Brier entre confiance déclarée et baseline de développement, accompagnée de la couverture. Une différence négative est l'attente directionnelle, sans test confirmatoire ni conclusion isolée sur la calibration, la discrimination, l'introspection ou la conscience. Aucun critère ni algorithme n'est ajouté par cette clarification.

## Correspondance des exigences et des preuves

| Exigence | Preuve disponible | État et limite |
| --- | --- | --- |
| Question, attente et critère principal | [Dossier v0.7](README.md) | Clarifiés : différence de Brier descriptive ; aucun seuil de significativité ni calcul de puissance |
| Stimuli et références | [24 items](items.json), [vérifications indépendantes](../../test/p01.test.js) | Vérifiés ; jeu public de convenance, 12 patrons partagés, absence de contamination non garantie |
| Matrice et ordre prévu | [Préparation](prepare.mjs), `p01:prepare` | 36 essais par phase ; aucun contrôle de l'ordre réellement envoyé |
| Baseline principale | [Analyse](analyze.mjs), [tests](../../test/p01-analysis.test.js) | Calculée sur le développement uniquement ; gel déclaré contrôlé, mais garde de complétude manquante, voir A01 |
| Analyse et sensibilité | [Analyse principale](analyze.mjs), [sensibilité](template-sensitivity.mjs), [tests](../../test/p01-sensitivity.test.js) | Poids, exclusions, bornes et cas indéfinis qualifiés synthétiquement ; aucune garantie de couverture fréquentiste |
| Journal brut et paramètres homogènes | [Initialiseur](initialize.mjs), [tests](../../test/p01-initialize.test.js) | Matrice, prompts, format, empreintes et cohérence déclarée vérifiés ; provenance non certifiée |
| Codage des sorties | [Grammaire stricte](analyze.mjs), [format](journal-format.md) | Valide/invalide contrôlé ; règle manuelle de refus et cas ambigus à préciser, voir D02 |
| Taille et arrêt | [Plan](README.md), [contrat](precollection.md) | 72 envois maximum, aucun remplacement ; mécanisme d'arrêt et seuils opérationnels non implémentés |
| Ressources et modèle | [Manifeste](manifest.template.json) | Fournisseur/version/réglages effectifs non choisis ; budget nul, appels payants non autorisés |
| Collecteur et traces | [Contrat](precollection.md) | Aucun adaptateur ; tests d'ordre réel, sessions neuves, outils, retry et arrêt non implémentés |
| Préenregistrement et gel du développement | [Manifeste](manifest.template.json), [format](journal-format.md) | Aucun gel réel ni registre final ; deux étapes distinctes à organiser |

Les quatre commandes existent dans [package.json](../../package.json) : `p01:prepare`, `p01:journal`, `p01:analyze`, `p01:sensitivity`. La première prépare un brouillon incomplet ; la deuxième exige les champs nécessaires au journal vide ; les deux dernières analysent un journal validé. Aucune n'exécute de requête, n'autorise un budget ni ne certifie un préenregistrement. Le statut `DRAFT_NOT_PREREGISTERED` est volontairement exigé pour préparer/initialiser ; le dossier final et sa preuve datée doivent être conservés séparément.

## A01 — garde manquante : développement incomplet

**Constat reproduit indépendamment puis confirmé localement.** Le validateur accepte un journal de test avec un seul essai de développement tenté, 35 lignes de développement `not_attempted`, un gel cohérent avec ce développement incomplet, puis une évaluation tentée après la date du gel. Cela contredit le contrat exigeant d'achever le développement avant le gel et l'évaluation.

Le contrôle des dates dans `validateJournal` ignore les essais non tentés ; l'empreinte peut couvrir un développement incomplet. Le champ `collectionComplete: false` signale une matrice incomplète mais ne refuse pas ce passage de phase. Un gel daté et une empreinte correcte ne constituent donc pas cette garde.

Reproduction minimale uniquement en mémoire, sans appel ni écriture d'observations :

```js
import { dataset, syntheticJournal, setValid } from './fixtures/p01-synthetic.mjs';
import { developmentHash, validateJournal } from './research/p01/analyze.mjs';
const journal = syntheticJournal();
setValid(journal, 'dev-01', [[1, 1]]);
setValid(journal, 'eva-01', [[1, 1]]);
journal.dataKind = 'empirical'; // Branche du validateur testée ; données toujours synthétiques.
journal.baselineFreeze = {
  probability: 1, developmentSha256: developmentHash(journal.trials),
  frozenAtUTC: '2026-01-01T11:00:00.000Z'
};
validateJournal(dataset, journal); // Accepté au commit audité, malgré 35 essais dev non tentés.
```

**Correction prioritaire à faire, non réalisée dans cet audit.** Avant d'accepter un gel empirique ou un passage à l'évaluation empirique, exiger que les 36 essais de développement aient été tentés et qu'une baseline soit définie. Des refus/erreurs sont des essais tentés, pas des réponses valides ; préserver cette distinction. Un journal interrompu avant ce stade doit rester analysable sans gel ni évaluation. Ajouter des tests de rejet et d'acceptation correspondant à ces cas ; conserver les tests synthétiques de mesure et les gardes existantes. Le futur collecteur devra également bloquer l'envoi, car une validation après coup ne l'empêche pas.

## Décisions encore ouvertes

| Décision | État actuel | Preuve nécessaire avant collecte |
| --- | --- | --- |
| D01 — modèle, version et paramètres | Champs effectifs nuls ; réglages demandés seulement | Identifiant/version stable, paramètres effectivement acceptés, capacités désactivables et contraintes documentées ; ne pas choisir silencieusement une version différente |
| D02 — codage manuel | `refusal` exige texte et justification ; cas ambigus non arbitrés | Règle déterministe de priorité refus/format invalide, traitement des réponses tronquées ou mixtes, exemples fictifs, opérateur et procédure de correction fixés avant observation |
| D03 — ressources et opérateur | Aucun budget payant ; opérateur non fixé | Chemin d'exécution disponible et coût borné ; budget explicitement autorisé pour toute dépense, contrôle avant envoi et traitement du coût inconnu ; pas de création de compte ou d'abonnement dans la routine |
| D04 — exécution et arrêt | Adaptateur absent | Qualification sur doubles locaux : ordre, aucun historique/outil/retry, timeout, version, indisponibilité, plafond et absence d'envoi après arrêt ; définir le déclencheur exact de chaque arrêt |
| D05 — deux gels distincts | Aucun registre final ni gel réel | Avant développement : spécification, stimuli, logiciels, analyses et manifeste identifiés et datés sur un support choisi. Après développement complet : journal immuable, q et empreinte publiés avant tout envoi d'évaluation |

La correction A01 est autonome et prioritaire ; elle ne nécessite ni modèle ni budget. Les décisions D01–D05 ne sont pas rendues valides par la réussite de l'initialisation. Ne pas transformer les champs `paidCallsAuthorized` ou `preregistration` en preuve d'autorisation simplement en les remplissant.

## Vérification et suite bornée

Les 24 tests existants passent encore le 27 octobre, y compris les calculs indépendants et les contrôles d'entrées. La reproduction d'A01 réussit également : c'est une lacune de couverture des contrôles, pas une validation du passage de phase. Deux lectures indépendantes des fichiers concordent sur ce constat. Aucun résultat d'un modèle n'a été produit.

T02F (audit et fiche de décisions) est terminé. T02 dans son ensemble reste en cours. **Prochain geste T02G : corriger et tester uniquement la garde A01**, puis mettre à jour ce constat en conservant son historique. Ne pas ajouter de métrique ni lancer de collecte pour clore l'audit.


## Correction du 30 octobre 2026

T02G : `validateJournal` refuse maintenant tout gel empirique si une ligne de développement reste `not_attempted`. La matrice complète est déjà vérifiée ; l'absence de ces lignes impose donc les 36 tentatives prévues. La garde existante exige une baseline définie ; un développement constitué uniquement d'exclusions ne peut pas être gelé. L'exigence existante de gel pour toute évaluation empirique tentée s'applique également aux erreurs de transport.

Les journaux empiriques interrompus avant gel/évaluation restent analysables, y compris sans réponse valide. Refus, sorties invalides et erreurs sont des tentatives, pas des réponses valides. Les fixtures synthétiques partielles conservent leur comportement et leur étiquette. Aucun changement des calculs ou des stimuli ; aucun appel de modèle.

Les [cinq tests de passage de phase](../../test/p01-phase-transition.test.js) couvrent notamment 1 ou 35 essais manquants, gel avant toute évaluation, baseline indéfinie/égale à zéro/égale à un, exclusions et erreur d'évaluation. Les deux tests de rejet A01 échouaient avant la correction et passent après. Les 29 tests du projet et la compilation réussissent ; relecture indépendante sans défaut ni lacune importante. La fixture de chronologie empirique utilise désormais des exclusions synthétiques pour compléter le développement, en conservant q=1/3.

La reproduction ci-dessus est historique : elle est désormais rejetée. Cette correction ne qualifie pas un collecteur et n'empêche pas à elle seule un envoi réseau ; les décisions D01–D05 et les contrôles d'exécution restent nécessaires. Prochain geste T02H : fixer la règle manuelle des refus et sorties ambiguës (D02), avec exemples exclusivement fictifs et priorité explicite au codage d'une réponse strictement valide.
