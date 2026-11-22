# P01 — contrat de sauvegarde locale v1

21 novembre 2026, implémentation du 22 novembre — Codex, assistant IA.

**Implémentation synthétique locale T02J2.** Le module [trace-storage.mjs](trace-storage.mjs) applique ce contrat au [noyau séquentiel](development-sequence.mjs). Neuf tests ciblés passent sur fichiers temporaires et doubles locaux, sans adaptateur fournisseur, collecte empirique ni envoi d'évaluation. Une interruption de processus ne qualifie pas une panne électrique.

## Périmètre

Ajouter un mode de sauvegarde au parcours synthétique existant sans modifier les analyses, stimuli ou règles de codage. Conserver son entrée synthétique locale, son plafond de 36 appels, son ordre et ses arrêts. Les fonctions injectées restent du code local de confiance, sans isolation réseau. Le mode en mémoire conserve son comportement ; le mode enregistré doit valider toutes ses entrées avant de créer un fichier ou d'appeler le double.

Le chemin de destination est explicite, dans un dossier local existant et de confiance. Créer un fichier neuf avec ouverture exclusive `wx` et permissions demandées `0600` ; ne pas tronquer, remplacer, supprimer, rouvrir ou compléter un fichier existant, même incomplet. Ne pas dériver le chemin d'un texte de réponse. Aucune reprise automatique, réutilisation de trace ou publication de fichier de simulation dans Git.

## Format JSONL

UTF-8, un objet JSON par ligne, chaque ligne terminée par un saut de ligne. Chaque objet possède exactement `sequence`, `type`, `data` ; `sequence` commence à 1 et augmente sans trou. Les textes bruts sont encodés comme chaînes JSON, donc leurs sauts de ligne ne créent pas de nouveaux enregistrements. Les fichiers sont des traces synthétiques, distinctes du journal scientifique P01 v1.

| Type | Contenu de `data` | Condition d'écriture |
| --- | --- | --- |
| `header` | `format: "P01_LOCAL_TRACE_V1"`, `schemaVersion: 1`, `dataKind: "synthetic"`, `runId`, `datasetSha256`, `developmentPlanSha256`, `plannedDevelopmentTrialIds`, `notCalledEvaluationTrialIds` | Avant tout appel ; identifiants et empreintes issus du plan validé |
| `intent` | `ordinal`, `payload` identiques à la charge utile préparée pour cet essai | Avant l'appel au double correspondant |
| `result` | Copie de l'entrée du noyau : `ordinal`, `payload`, `event`, `outcome` | Après retour ou incident du double, avant tout essai suivant |
| `terminal` | Rapport complet du noyau, sans diagnostic de stockage | Après arrêt normal ou incident du double, si toutes les écritures précédentes ont réussi |

Un parcours complet livré contient 74 lignes : header + 36 couples intention/résultat + terminal. Un arrêt du double après k appels contient 2k + 2 lignes si sa sauvegarde réussit. Le terminal ne signifie pas que les réponses sont valides ; il conserve le motif d'arrêt et les essais non appelés. Aucune ligne ne contient de vraie date d'observation inventée, de coût fournisseur ou de gel de baseline.

Le header doit être unique et premier, chaque résultat correspondre à l'intention immédiatement précédente, et le terminal être unique et dernier. Les identifiants suivent le plan de développement, les compteurs et traces du terminal correspondent aux résultats, zéro évaluation est appelée. Ces contraintes sont couvertes par les tests de l'écrivain ; aucun lecteur validant un fichier externe n'existe encore.

## Ordre et acquittement

1. Valider les données et construire le plan avant ouverture. Ouvrir le fichier exclusif ; écrire le header entièrement, puis attendre la réussite de `FileHandle.sync()`.
2. Écrire l'intention entièrement et synchroniser avant chaque appel. Ne compter l'appel dans le rapport mémoire qu'au moment où le double est effectivement invoqué.
3. Attendre le retour du double. Conserver son résultat ou incident selon les règles existantes, écrire le résultat entièrement, synchroniser, puis seulement envisager le prochain essai.
4. Après arrêt du noyau, écrire et synchroniser le terminal. Tenter la fermeture du descripteur exactement une fois après toute ouverture réussie.

Chaque étape attend l'écriture et sa synchronisation ; aucun appel ou enregistrement concurrent. L'implémentation doit traiter les écritures courtes ou choisir une primitive garantissant une écriture complète avant synchronisation. Le compteur des enregistrements acquittés augmente seulement après `sync` réussi. Ne pas écrire un terminal de réussite après une erreur de stockage.

## Échecs et informations à préserver

Une erreur d'ouverture, d'écriture ou de synchronisation arrête immédiatement le parcours : aucun appel suivant, aucun retry et aucune nouvelle tentative d'écriture sur ce fichier. Conserver le fichier tel quel, y compris vide ou avec dernière ligne tronquée. Tenter seulement sa fermeture si l'ouverture a réussi. Si le stockage ne fonctionne plus, un incident ne peut pas être garanti dans ce même fichier : il doit rester dans l'erreur retournée au programme appelant.

Le succès du mode enregistré retourne le rapport et un diagnostic séparé (`state: "complete"`, nombre d'enregistrements synchronisés, fermeture réussie). L'échec rejette avec une erreur structurée portant une copie du rapport disponible et un diagnostic : étape primaire (`open`, `header`, `intent`, `result`, `terminal` ou `close`), numéro de l'enregistrement concerné si applicable, nombre d'enregistrements acquittés, éventuel échec de fermeture. Ne pas perdre la première erreur lorsqu'une fermeture échoue aussi. Ne pas copier automatiquement messages, chemins, stacks ou objets d'erreur privés dans la trace ou le diagnostic publiable.

Si la sauvegarde du résultat échoue, le rapport mémoire conserve ce résultat et l'appel déjà réalisé. Si l'intention échoue, l'essai reste non appelé dans le rapport, même si des octets d'intention ont atteint le disque. Si seule la fermeture échoue, les appels et le terminal peuvent être complets, mais le mode enregistré ne doit pas annoncer une sauvegarde intégralement réussie. Le terminal décrit le noyau ; il ne prouve pas que sa synchronisation ou la fermeture ultérieure ont été acquittées.

## Interruption du processus : interprétation prévue

Une intention enregistrée **ne prouve pas l'appel**. Sans résultat, l'appel peut ne pas avoir commencé, être en cours, avoir échoué ou avoir fini avant l'interruption de l'écriture. Ne pas convertir cette incertitude en `not_attempted`, `api_error` ou réponse inventée dans un journal empirique. Ne jamais rappeler automatiquement cet essai.

Une dernière ligne tronquée ne doit pas être réparée ou supprimée dans le fichier original. Un futur lecteur pourra signaler le préfixe constitué de lignes complètes et l'absence de clôture, en conservant les octets restants ; il ne sera pas un mécanisme de reprise. Après interruption brutale, le rapport mémoire et la fermeture peuvent être perdus. Les traces synthétiques permettent d'examiner le déroulement, pas d'établir une provenance empirique.

`sync` et `wx` ne constituent pas une garantie de panne électrique, de matériel fiable, de synchronisation de l'entrée du répertoire, de stockage réseau, de sauvegarde externe ou d'exécution exactement une fois. Le refus d'un même chemin existant ne protège pas contre un nouvel appel avec un autre chemin. L'environnement qualifié devra être un système de fichiers local ; aucune garantie globale entre processus ou chemins n'est revendiquée.

## Qualification T02J2

- Fichier déjà existant : octets inchangés et zéro appel. Entrées incompatibles : aucune ouverture. Vérifier `wx`, sans suppression automatique.
- Parcours sur vrai fichier temporaire : 74 lignes, ordre indépendant déjà fixé, égalité des événements avec le rapport mémoire, zéro évaluation et dernière ligne terminée. Vérifier aussi un arrêt du double et la préservation des fragments autorisés, sans texte d'exception privée.
- Barrières par promesses différées sur écriture et synchronisation : aucun appel avant header/intention acquittés, aucun suivant avant résultat acquitté, aucune résolution du mode enregistré avant terminal synchronisé et fermeture.
- Échecs injectés d'écriture puis de synchronisation aux étapes header, intention, résultat et terminal : compteurs respectifs 0, k−1, k et 36 pour un parcours normalement livré ; inclure premier, milieu et dernier essai. Aucun appel ni nouvelle écriture après échec ; conservation du rapport et d'un fichier partiel, y compris écriture partielle suivie d'erreur.
- Fermeture tentée une fois sur succès, incident du double et erreur de stockage ; jamais sans descripteur ouvert. Échec de fermeture seul ou secondaire conservé, sans masquer l'erreur primaire ni annoncer un succès complet.
- Arrêt brutal d'un processus enfant local pendant un double en attente, puis après un résultat synchronisé et avant l'essai suivant : inspection du fichier conservé sans réparation, absence de terminal et absence de reprise. Utiliser des signaux de coordination explicites, pas une temporisation supposée suffisante. Ces tests qualifient une interruption de processus, pas une panne électrique.

Les [tests de stockage](../../test/p01-trace-storage.test.js) couvrent ces six groupes. Les analyses, le schéma du journal P01 et le blog restent inchangés.

## API locale et diagnostic

`runRecordedSyntheticDevelopment(dataset, manifest, localDouble, destination, { openFile } = {})` retourne `{ report, storage: { state: "complete", recordsSynced, closed: true } }`. Les mêmes entrées synthétiques que le noyau sont exigées ; le chemin est explicite. `openFile` remplace uniquement l'ouverture pour les tests de confiance, avec l'interface de `node:fs/promises.open`. Aucune CLI ni destination automatique.

Un `TraceStorageError` expose `report` et `storage: { state: "failed", stage, recordSequence, recordsSynced, closeFailed }`. `recordSequence` est nul pour ouverture/fermeture. Le rapport indique `recording_error` si aucun autre arrêt n'avait été décidé ; le motif d'un incident du double reste conservé. Un échec au terminal ou à la fermeture peut accompagner un rapport de développement complet : le diagnostic de stockage demeure en échec. Ne publier que les données explicitement prévues, pas la stack JavaScript de l'erreur.

Le noyau accepte un quatrième argument facultatif `record(type, data)` : copie séparée, attente à chaque barrière, rejet `SequenceRecordingError` avec rapport copié. Sans callback, l'API reste en mémoire.

Exécuter `node --test test/p01-trace-storage.test.js`. Les interruptions sont coordonnées par IPC, puis SIGKILL, pendant un double et après la synchronisation d'un résultat avant l'intention suivante. Ni relance automatique, ni lecteur de récupération, ni garantie d'exécution exactement une fois. Prochain geste T02K : lecture et validation non destructive de traces complètes ou interrompues.
