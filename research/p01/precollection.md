# P01 — raccord manifeste, journal et contrôles avant collecte

**Préparation méthodologique uniquement.** Aucun modèle n'est choisi, aucun budget payant n'est autorisé et aucune collecte n'a été exécutée. Les commandes ci-dessous n'appellent aucun fournisseur. Un fichier rempli ne constitue ni une permission de dépenser, ni un préenregistrement.

## Du brouillon au journal vide

Le manifeste et le journal ont des fonctions différentes. Conserver le manifeste complété et daté avec la grille préparée, sous le même `runId`, dans le dossier de la collecte. Le journal v1 conserve ses champs exacts ; ne pas lui ajouter les champs du manifeste. Archiver aussi l'empreinte des octets du manifeste final et la référence du commit du logiciel dans le registre de préparation. `datasetSha256` ne couvre que les stimuli, pas ce manifeste.

| Champ du manifeste | Sens et destination |
| --- | --- |
| `runId`, `provider`, `modelVersion`, `condition`, `dataKind` | Identité explicite copiée dans le journal ; valeurs manquantes refusées |
| `requestedGeneration` | Réglages souhaités, conservés seulement dans le manifeste |
| `generation` | Réglages effectifs et capacités documentés, copiés dans le journal et chaque ligne ; `null` tant qu'inconnus |
| `analysis` | Seed et 2 000 tirages copiés sans modification ; à figer avant analyse |
| `orderSeed`, `repetitions` | Ordre préparé et trois répétitions par item ; aucune promesse de déterminisme du modèle |
| `baselineFreeze` | `null` pour un nouveau journal ; gel réel à établir après développement dans le journal selon son format |
| `collectionControls` | Intentions obligatoires : nouvelle session, aucun outil, ordre prévu, aucun retry ; ce ne sont pas des observations du fournisseur |
| Budget, `operator`, `preregistration` | Conservés dans le manifeste et le registre ; jamais convertis en preuve de permission ou de préenregistrement |

Les paramètres effectifs doivent être établis à partir du contrat fournisseur et de la configuration réelle. Documenter séparément les paramètres demandés mais ignorés ou indisponibles. Un changement pendant la collecte impose l'arrêt et la consignation de l'écart, pas la réécriture des lignes anciennes.

```sh
npm run p01:prepare -- research/p01/manifest.template.json nouvelle-grille.json
npm run p01:journal -- manifeste-brouillon-complete.json nouveau-journal.json
npm run p01:analyze -- nouveau-journal.json rapport-vide.json
```

La première commande accepte le modèle de manifeste incomplet pour préparer les stimuli. La deuxième utilise le validateur strict existant et **refuse ce modèle tant que l'identité et les réglages effectifs ne sont pas renseignés**. Elle crée exactement 72 lignes `not_attempted`, dans l'ordre préparé, sans texte de sortie, date, coût ni identifiant de réponse inventé. Elle refuse un gel déjà rempli, les contrôles incompatibles et tout écrasement. La troisième peut alors produire un rapport de couverture nulle et de scores `null` : ce n'est pas un résultat expérimental.

Le journal peut être déclaré `synthetic` pour tester le logiciel ou `empirical` pour réserver le format d'une future collecte. Un journal vide `empirical` contient **zéro observation empirique**. Choisir ce champ explicitement, jamais selon la seule présence d'un fichier. Le manifeste reste `DRAFT_NOT_PREREGISTERED` lors de ces opérations. Conserver ce brouillon ; établir séparément le dossier final et son gel daté avant toute exécution réelle.

### Migration du brouillon précédent

Le dossier v0.2/v0.3 utilisait `generation` pour les réglages souhaités et `baseline.developmentResponsesSha256` pour le futur gel. Dans le brouillon v0.4, déplacer les souhaits vers `requestedGeneration`, laisser `generation: null` jusqu'à clarification et utiliser `baselineFreeze: null` pour initialiser. L'initialiseur rejette explicitement l'ancien champ `baseline` pour éviter une perte silencieuse. **Ne pas migrer un journal collecté en le réinitialisant.** Les anciens stimuli/grilles restent lisibles ; le schéma du journal d'analyse v1 et ses empreintes restent inchangés.

## Contrat du dispositif de collecte à qualifier

Avant toute collecte, relire le protocole, le codage, les exclusions, l'effectif, les règles d'arrêt et le budget, puis enregistrer le plan final avec une preuve datée indépendante. Le dispositif futur doit satisfaire les contrôles suivants sur des doubles locaux du fournisseur, sans appel réel pour cette qualification.

| Contrainte | Contrôle attendu | Trace à conserver hors journal v1 |
| --- | --- | --- |
| Ordre prévu | Émettre les essais séquentiellement dans l'ordre de la grille ; terminer le développement avant le gel et l'évaluation | Liste ordonnée des `trialId` réellement envoyés avec compteur d'envoi et empreinte de la grille |
| Nouvelle session | Chaque requête contient uniquement les deux prompts prévus ; aucun historique ou identifiant de continuation | Requête effectivement transmise, nettoyée des secrets, attestant l'absence de messages antérieurs et de continuation |
| Aucun outil | Désactiver outils, recherche, exécution et capacités équivalentes ; vérifier le comportement de l'adaptateur | Configuration effective et charge utile transmise, plus documentation fournisseur des capacités indisponibles |
| Aucun retry | Désactiver les nouvelles tentatives implicites du client ; un seul envoi maximum par essai | Compteurs et événements d'envoi, y compris erreurs/timeout ; aucune réponse de remplacement |
| Plafond et arrêt | Au plus 72 essais ; arrêt au plafond budgétaire, indisponibilité ou changement de version ; ne pas continuer jusqu'à un score favorable | Motif d'arrêt, décompte des envois et coûts connus ; toutes les lignes restantes `not_attempted` |
| Gel de baseline | Achever le développement, calculer q et empreinte, publier un gel daté, puis seulement autoriser l'évaluation | Artefact de gel du développement, lien/datation et copie immuable du journal à ce stade |
| Séparation des populations | Une version et une configuration par collecte ; isoler les sessions et les fichiers | Identité fournisseur/version et paramètres effectifs rapprochés du manifeste |

Critères de qualification du futur adaptateur : tests de succès, refus, timeout et dérive de version doivent démontrer l'absence de retry et d'appel supplémentaire après arrêt. Le double local doit constater l'ordre des envois et l'absence d'historique/outils. Ces tests ne sont **pas encore implémentés** : aucun adaptateur fournisseur n'existe dans ce projet.

L'initialiseur n'effectue aucun de ces envois ou contrôles d'exécution. L'analyseur vérifie la matrice, les prompts, les champs et la cohérence déclarée du gel ; il ne prouve pas le déroulement réel. Ne jamais conclure « prêt à collecter » uniquement parce que ces commandes réussissent. Les traces doivent exclure secrets, données personnelles et raisonnement caché ; leur existence déclarée ne constitue pas à elle seule une preuve de provenance.
