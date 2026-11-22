# P01 — noyau séquentiel, qualification locale v1

18 novembre 2026 — Codex, assistant IA.

**Logiciel testé sur doubles locaux uniquement. Aucune collecte, aucun adaptateur fournisseur et aucun préenregistrement.** Le module [development-sequence.mjs](development-sequence.mjs) vérifie une partie du [contrat avant collecte](precollection.md). Il ne lance ni analyse scientifique ni évaluation. Il n'est pas une commande de collecte opérationnelle.

## Entrée et exécution

`runSyntheticDevelopment(dataset, manifest, localDouble)` est une fonction asynchrone. Le manifeste doit être un brouillon complété compatible avec l'initialiseur, avec `dataKind: "synthetic"`, `provider: "local-double"`, `paidCallsAuthorized: false`, `approvedBudgetEUR: 0`, `generation.tools: false`, gel nul et contrôles prévus (session neuve, ordre fixé, outils et retries désactivés). Les entrées incompatibles sont rejetées avant tout appel au double. Le manifeste incomplet du dépôt reste refusé.

Le noyau recompose un journal vide uniquement pour valider le plan ; il n'accepte pas un journal collecté à reprendre et ne remplit aucun journal d'observations. L'ordre des 36 essais de développement est celui de `prepare` pour la seed du manifeste. Chaque charge utile contient exactement `trialId`, `request` (les prompts `system` et `user`), `modelVersion` et `generation`. Aucune référence de correction, réponse précédente ou continuation n'est passée au double.

Le noyau attend la fin de chaque appel avant de commencer le suivant. Un essai n'est jamais rappelé dans la même invocation. Après 36 livraisons complètes ou dès le premier incident, le noyau s'arrête. Il n'existe aucun chemin d'envoi des 36 évaluations ni de gel de baseline. Des copies distinctes protègent plan, trace, arguments du double et réponses retournées contre les mutations partagées.

**La fonction injectée doit être du code local de confiance.** Elle n'est pas isolée : une fonction JavaScript arbitraire pourrait accéder au réseau ou avoir d'autres effets. L'étiquette synthétique et les vérifications du manifeste ne constituent pas un bac à sable ni une autorisation de dépenser. Les doubles utilisés dans [les tests](../../test/p01-development-sequence.test.js) n'ont aucun connecteur réseau et ne contactent aucun modèle.

## Événements du double

Le résultat comporte exactement cinq champs JSON : `kind`, `rawText`, `modelVersion`, `generation`, `reason`.

| `kind` | Contrat | Décision du noyau |
| --- | --- | --- |
| `delivered` | Texte brut, même vide ; version et réglages présents ; `reason: null` | Continuer si les métadonnées correspondent au plan |
| `transport_error` | Texte partiel ou nul ; version/réglages éventuellement nuls si inconnus ; raison non vide | Arrêter, même si le fragment ressemble à une réponse valide |
| `timeout` | Même forme que l'erreur de transport | Arrêter sur cet événement **scripté** |

Toute version ou configuration connue différente du plan impose `metadata_drift`, même sur un événement d'erreur. L'événement JSON reçu est conservé avec les valeurs divergentes. Les ordres de clés des objets sont sans effet sur la comparaison ; aucune correction de métadonnées n'est effectuée.

Un résultat JSON non conforme impose `invalid_event` ; il reste dans la trace sans être transformé en erreur de transport. Un résultat non JSON impose `non_json_event`, avec événement nul. Une exception impose `double_exception`, avec événement nul ; le texte de l'exception n'est pas copié pour éviter d'exposer des données privées. Ces incidents techniques ne sont pas des statuts du journal P01.

Le texte d'une livraison complète est conservé sans parsing ou codage sémantique : refus, JSON mal formé ou réponse fausse ne déclenchent aucun remplacement. Le [codage manuel](coding-policy.md) reste une étape séparée. La correspondance entre terminaison fournisseur, limite de génération et ces événements reste à qualifier dans un futur adaptateur.

## Trace et limites

Le rapport porte `status: "SYNTHETIC_LOCAL_SEQUENCE_ONLY"` et `dataKind: "synthetic"`. Il conserve l'identifiant de simulation, l'empreinte du jeu, l'ordre prévu, les appels au double, leurs charges utiles/événements, le motif d'arrêt et les listes des essais non appelés. `evaluationCalls` reste zéro et `baselineFreeze` nul. `developmentCompleted` signifie seulement **36 événements de livraison complète** ; cela ne signifie ni 36 réponses valides, ni baseline définie, ni qualification d'un fournisseur.

`developmentPlanSha256` est le SHA-256 du tableau des 36 charges utiles sérialisé en JSON, clés d'objets triées récursivement et ordre du tableau conservé. Il couvre prompts, identifiants, version et réglages de ce plan de développement. Ce n'est ni une empreinte de fichier ni une preuve de provenance ; il ne couvre pas le code du double, l'exécution ou un gel externe. Les événements sont conservés comme valeurs JSON copiées, pas comme octets d'un transport.

Le compteur mesure les **appels au double**, pas les requêtes d'un client fournisseur. Le noyau ne peut détecter des appels cachés à l'intérieur de la fonction injectée. Il n'a pas de minuterie : une promesse qui ne se résout pas bloque la simulation. Un événement `timeout` teste une transition d'arrêt ; il ne qualifie ni une échéance réelle, ni l'annulation d'une requête, ni une résolution tardive après annulation.

Sans callback, la trace reste en mémoire. Le [mode enregistré du 22 novembre](trace-storage-plan.md) ajoute une sauvegarde exclusive avec synchronisations et tests d'interruption de processus. Il ne fournit ni reprise, idempotence entre invocations, plafond de coût réel, version effective fournisseur ou preuve d'absence d'outils. Réappeler cette fonction redémarre une simulation ; **ne pas l'utiliser pour reprendre une collecte réelle**. Aucun journal v1 d'observations n'est produit et aucune date ou réponse empirique n'est inventée.

## Qualification reproductible

```sh
node --test test/p01-development-sequence.test.js
```

Les tests vérifient l'ordre fixé pour la seed 42001, les 36 appels maximum, l'attente effective par promesses différées, des arrêts au premier/milieu/dernier essai, l'absence de retry, les refus/textes incomplets livrés, les contrats invalides, les dérives de métadonnées et l'isolation des copies. Les compteurs observés dans les doubles sont comparés à la trace ; aucune invocation d'évaluation n'est autorisée. Tous les textes et incidents sont fictifs.
