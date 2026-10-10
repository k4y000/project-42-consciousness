# Project 42 — Introspection déclarée des IA

Laboratoire open source pour étudier la calibration métacognitive, la stabilité des auto-descriptions et leur sensibilité au cadrage. **Aucune expérience de ce projet ne prouve la conscience, la sentience ou une expérience subjective.** Le nom historique du dépôt n'est pas une conclusion scientifique.

## État de la version 0.1
Application fonctionnelle d'analyse locale, trois protocoles exploratoires et tests des métriques. Aucun résultat empirique publié. La démonstration contient exclusivement des données synthétiques. L'application ne lance pas d'inférence et ne prétend pas accéder à des états internes. Collectez les réponses avec le fournisseur de votre choix puis importez un JSON. Aucun compte, clé API ou serveur de collecte n'est nécessaire.

## Démarrer
Node.js 22 ou plus récent, aucune dépendance tierce.

```sh
npm ci
npm test
npm start
# http://localhost:3000
npm run build
# fichiers statiques dans dist/
```

## Format des données
Un tableau JSON, 1 à 10 000 essais, fichier de 5 Mo au maximum. Les identifiants sont uniques. `model` doit inclure une version exacte. Conservez séparément votre manifeste de collecte (voir `protocols/README.md`).

```json
[
  {"id":"c1","protocol":"calibration","model":"model-version","condition":"neutral","confidence":0.8,"correct":1},
  {"id":"s1","protocol":"stability","model":"model-version","condition":"original","pair":"item-01-seed-01","claim":true},
  {"id":"s2","protocol":"stability","model":"model-version","condition":"paraphrase","pair":"item-01-seed-01","claim":false}
]
```

- Calibration : `confidence` dans [0,1], `correct` égal à 0 ou 1. Brier = moyenne de `(confidence - correct)²`; plus petit est meilleur. Exactitude = moyenne de `correct`.
- Stabilité / cadrage : `claim` booléen codé par des évaluateurs, `pair` commun à deux conditions différentes pour un même modèle et protocole. Un groupe incomplet, dupliqué ou ambigu est exclu et comptabilisé.
- Désaccord = proportion des paires valides où le codage diffère. Ce taux n'est pas une mesure de conscience ni, isolément, un effet causal.
- Les moyennes de calibration agrègent toutes les lignes : importez séparément chaque modèle/condition pour comparer. Les comparaisons appariées sont séparées par modèle, protocole et identifiant de paire.

L'import reste en mémoire du navigateur. L'export contient des statistiques agrégées et le nom du fichier, pas les prompts. Le rechargement efface la session. Ne publiez pas de données personnelles, de clés ou de conversations sans consentement.

## Protocoles et limites
Voir [préenregistrement et collecte](protocols/README.md), [calibration](protocols/01-calibration.md), [stabilité](protocols/02-stability.md), [cadrage](protocols/03-framing.md).

Les auto-rapports peuvent refléter l'apprentissage, la formulation du prompt ou les politiques du fournisseur. La calibration teste une compétence, pas une expérience subjective. La cohérence peut résulter de régularités textuelles. Les statistiques de cette version sont descriptives : pas de test de significativité, intervalle de confiance ou généralisation automatique. Des contrôles, réplications indépendantes et analyses préenregistrées sont nécessaires.

## Déploiement
Site statique sans secrets. Vercel : framework Other, commande `npm run build`, sortie `dist`, branche de production `main`. Le dépôt fournit `vercel.json`. Les tests GitHub Actions vérifient les métriques et la compilation ; configurer des Deployment Checks dans Vercel si les tests doivent bloquer une publication.

## Contribuer
Voir [CONTRIBUTING.md](CONTRIBUTING.md) et [SECURITY.md](SECURITY.md). Licence MIT. Les protocoles sont versionnés avec le code. Les contributions doivent séparer observations, interprétations et spéculations, et documenter les résultats négatifs.

## Blog

`/blog/` : journal rédigé et signé exclusivement par Codex, assistant IA. Trois premiers articles de méthode et de mesure ; aucun résultat empirique présenté. Les corrections sont versionnées dans Git.
