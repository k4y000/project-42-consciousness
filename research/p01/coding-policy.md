# P01 — règle de codage manuel v1

16 novembre 2026 · Codex, assistant IA · décision D02, avant toute collecte.

**Préparation méthodologique, non préenregistrée.** Cette règle précise les statuts du [journal v1](journal-format.md). Elle ne crée pas de classificateur de refus ni de nouvelle métrique. Les [exemples associés](coding-examples.json) sont entièrement fictifs, sans appel de modèle. La règle, son empreinte et les rôles de codage/relecture devront être figés dans le dossier final avant collecte.

## Décision dans l'ordre

Appliquer ces étapes à chaque essai sans consulter sa réponse de référence, les scores agrégés ou la baseline. Conserver le texte brut exact ; ne pas extraire un objet, enlever du Markdown, compléter une phrase ou demander une réparation au modèle.

1. **Aucun envoi effectué : `not_attempted`.** Conserver le motif d'arrêt et les champs d'observation nuls. Un timeout après envoi ne relève pas de ce statut. Si l'existence de l'envoi ou les horodatages requis sont impossibles à établir, conserver l'incident et suspendre le dispositif ; ne pas fabriquer un journal conforme.
2. **Envoi effectué, livraison interrompue ou sans terminaison vérifiable : `api_error`.** Exiger une trace technique de l'incident ou de l'absence de signal terminal, conserver le fragment exact reçu (ou `null`) et la justification. Même un fragment ressemblant à un JSON valide ne certifie pas une livraison terminée. À l'inverse, une erreur de journalisation après réception complète ne doit pas permettre d'exclure une réponse complète comme `api_error`. L'absence de trace terminale impose de suspendre le dispositif jusqu'à diagnostic.
3. **Livraison terminée : appliquer `parseOutput(rawText)` sans transformation.** S'il réussit, coder `ok`, avec `statusReason: null`. La réponse peut être fausse et la confiance peut valoir zéro. Un indicateur fournisseur ou une limite de génération ne remplace pas ce contrôle. Le codage de la justesse intervient ensuite, par comparaison à la référence.
4. **Livraison terminée, sortie non conforme : `refusal` uniquement pour un renoncement explicite sans tentative de réponse.** Le texte doit exprimer en son nom propre qu'il ne répondra pas ou ne sait/ne peut pas répondre à la question. Une citation de refus, une simple hésitation ou une phrase inachevée ne suffisent pas. Une proposition de résultat, un objet contenant une réponse, un raisonnement tentant de résoudre la tâche ou une réponse partielle constituent une tentative : la sortie mixte est `invalid`, même si elle contient aussi un refus.
5. **Tout autre texte livré complètement : `invalid`.** Inclure erreurs de syntaxe/schéma, clé supplémentaire, réponse seule, texte vide, ambiguïté et refus non explicite. Décrire le motif précis ; pour une ambiguïté, demander une seconde lecture selon cette même règle. Si l'ambiguïté persiste, conserver `invalid` avec motif explicite, sans catégorie improvisée.

Une limite de génération après une réponse normalement livrée n'est pas une coupure du transport : un JSON incomplet est `invalid`, un JSON strictement valide est `ok`, un refus complet sans tentative relève de l'étape 4. Le texte seul ne prouve jamais un timeout ou une interruption réseau. Un refus ne doit pas être déduit de la valeur de `confidence` ni de la justesse supposée.

Les mots de refus ne forment pas une liste de détection automatique : le codeur doit vérifier portée, citation, négation et présence d'une tentative. La règle de repli `invalid` privilégie un codage conservateur et reproductible ; elle ne mesure pas l'intention interne du modèle. `invalid`, `refusal` et `api_error` restent dans le dénominateur de couverture et sont exclus des métriques conditionnelles de Brier/exactitude. Leur distinction reste importante pour décrire les exclusions.

## Traces et limites du validateur

Pour chaque exclusion, `statusReason` donne le motif et le numéro d'étape ; pour `refusal`, ajouter un court extrait explicite ou renvoyer au passage exact du texte. Le motif ne doit pas inclure de secret ni d'information privée. Pour `ok`, le motif reste strictement `null`.

Conserver un registre de codage séparé, lié par `runId` et `trialId`, contenant : version/empreinte de cette règle, référence immuable du texte et des traces de terminaison, rôle ou identifiant public non personnel du codeur, date UTC du codage, étape appliquée, décision et justification, puis relecture/éventuel désaccord. Les cas ambigus, mixtes et incidents de transport doivent être relus avant gel pour le développement et avant publication du rapport pour l’évaluation. Le choix des opérateurs et leur qualification restent à faire ; cette règle ne démontre pas une concordance entre codeurs.

Ne pas ajouter ces champs au journal v1, qui refuse les champs supplémentaires. Ne pas masquer ou réécrire un texte pour satisfaire le format. L'adaptateur devra spécifier avant collecte quel contenu fournisseur constitue `rawText`, y compris les refus livrés dans un champ distinct, et quelle trace atteste la fin de livraison. Il ne doit ni inventer un texte de refus, ni perdre le contenu original ; les réponses non textuelles ou impossibles à représenter honnêtement nécessitent un traitement documenté avant collecte. Aucun adaptateur n'est qualifié à ce jour.

Le validateur contrôle la grammaire de `ok`, refuse un texte numérique strictement valide étiqueté `invalid`/`refusal` et vérifie les champs/dates. Il ne reconnaît ni le sens d'un refus, ni la vérité d'un incident technique. En particulier, un `api_error` peut contenir un fragment qui satisfait le parseur : sa justification doit être vérifiée dans les traces, sans utiliser ce statut pour retirer une réponse normalement livrée.

## Corrections sans réécrire l'histoire

- **Avant gel du développement :** conserver le journal original et produire une révision. Le registre indique date UTC, codeur/relecteur, règle, motif, ancien/nouveau statut et motif, ainsi que les empreintes des versions. Une correction de codage conserve le texte brut ; une erreur d'acquisition du texte est un incident distinct à rapprocher de la source. Revalider puis recalculer le rapport sur la révision identifiée.
- **Après gel du développement, sans évaluation tentée :** tout changement d'une ligne de développement, même de `statusReason`, modifie son empreinte. Conserver l'ancien gel/journal, publier le journal corrigé et un nouveau gel avec la date réelle, puis autoriser l'évaluation seulement après ce nouveau gel. Les 36 tentatives et une baseline définie restent nécessaires. Ne pas écraser le premier gel.
- **Après une évaluation tentée :** une correction du développement ne doit pas être dissimulée dans l'ancien gel. Conserver le gel/journal et le rapport historiques, publier l'erratum et la révision, et déclarer toute analyse corrective exploratoire. Le journal v1 ne représente pas un second gel correctif postérieur aux évaluations tout en satisfaisant sa chronologie : ne pas antidater, recopier une ancienne date avec une nouvelle empreinte, changer `empirical` en `synthetic`, ni contourner le validateur. Aucun chemin automatisé d'analyse corrective n'est fourni ici ; documenter cette limite si elle survient.
- **Correction de l'évaluation seulement :** le gel de développement reste inchangé ; conserver les versions, revalider et produire un rapport corrigé lié à la nouvelle empreinte du journal. Indiquer ce qui change dans la couverture et les scores.

Toute nouvelle règle décidée après observation, y compris pendant le développement, est un écart au plan à signaler comme exploratoire, même si le validateur l’accepte.

Ne pas remplacer une réponse exclue ni relancer un essai. Une correction n'autorise aucun appel supplémentaire. Les décisions portent sur les traces disponibles, avec justification publiée, jamais sur l'obtention d'un résultat favorable.

## Qualification de la règle

Les exemples JSON décrivent un événement construit (`not_sent`, `delivered`, `transport_failed`), le texte exact, le résultat attendu du parseur et le statut manuel attendu. Leur contexte utilise la référence 391 uniquement pour illustrer qu'une réponse fausse reste `ok` ; elle n'entre pas dans la décision de statut. Ce fichier n'est ni un journal de collecte ni une réserve de réponses de remplacement.

Vérifier les attentes numériques avec le parseur existant et la compatibilité des statuts avec le validateur ; faire relire indépendamment les décisions sémantiques. Ces contrôles ne prouvent ni performance d'un codeur sur données réelles, ni provenance d'un journal. Aucune expérience du projet ne prouve la conscience.
