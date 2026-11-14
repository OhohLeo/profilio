# Profilio – CV en ligne interactif de Léo Martin

- Stack : Vite + React + TypeScript (site statique, GitHub Pages) + Ghost en CMS headless (optionnel).
- Utiliser le MCP Context7 (`use context7`) pour la doc à jour de React / Vite / Ghost avant d'utiliser une API.
- Ne jamais publier adresse, téléphone, âge ou situation familiale (présents sur le CV PDF, volontairement exclus du site).
- Les chiffres/infos du projet Robeau issus du back-office sont confidentiels : ne publier que ce que l'utilisateur a validé.
- Ne jamais committer `.env` (clé Admin API Ghost). La clé Content API (`VITE_GHOST_CONTENT_KEY`) est publique par conception.

## Contenu : deux sources

`src/ghost.ts` (`useCvContent`) lit Ghost si `VITE_GHOST_URL` + `VITE_GHOST_CONTENT_KEY` sont définis et que Ghost contient des `#experience`. Sinon, ou si Ghost est injoignable, le site utilise `src/data.ts` (repli, et source du seed). Profil, étude de cas Robeau et schéma d'architecture restent dans `src/data.ts`.

## Modèle de contenu Ghost (inspiré de Bab Charki : articles + tags internes)

| Type | Tag interne | Titre | Extrait | `meta_title` | `meta_description` | Corps | Tags publics |
|---|---|---|---|---|---|---|---|
| Expérience | `#experience` | entreprise | présentation | période (« 2025 – aujourd'hui (18 mois) ») | rôle | `<ul>` des missions | technos |
| Projet perso | `#projet` | nom | description | année | – | – | technos |

- Tri : date de publication décroissante (mettre l'année de début). « En cours » si la période contient « aujourd'hui », « présent » ou « en cours ».
- `canonical_url` d'un projet = lien affiché.
- Les tags internes ne sont pas renvoyés par la Content API : `tags` ne contient que les technos.

## Commandes

```bash
npm run dev                      # SPA
npm run ghost:up                 # Ghost local : http://localhost:2369/ghost (puis créer l'intégration personnalisée)
cp .env.example .env             # renseigner GHOST_ADMIN_API_KEY
npm run ghost:seed -- --dry-run  # voir les articles qui seraient créés
npm run ghost:seed               # créer / mettre à jour dans Ghost (idempotent, par slug)
npm run ghost:pull               # sauvegarder les articles dans snapshots/ghost/posts/
```

`scripts/*.mjs` importent `src/data.ts` directement (Node ≥ 22.18, type stripping natif).
