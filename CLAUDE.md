# Profilio – CV en ligne interactif de Léo Martin

- Stack : Vite + React + TypeScript (site statique, GitHub Pages) + Ghost en CMS headless (optionnel).
- Utiliser le MCP Context7 (`use context7`) pour la doc à jour de React / Vite / Ghost avant d'utiliser une API.
- Ne jamais publier adresse, téléphone, âge ou situation familiale (présents sur le CV PDF, volontairement exclus du site).
- Les chiffres/infos du projet Robeau issus du back-office sont confidentiels : ne publier que ce que l'utilisateur a validé.
- Ne jamais committer `.env` (clé Admin API Ghost). La clé Content API (`VITE_GHOST_CONTENT_KEY`) est publique par conception.

## Contenu : deux sources

`src/ghost.ts` (`useCvContent`) lit Ghost si `VITE_GHOST_URL` + `VITE_GHOST_CONTENT_KEY` sont définis et que Ghost contient des `#experience`. Sinon, ou si Ghost est injoignable, le site utilise `src/data.ts` (repli, et source du seed). Le profil reste dans `src/data.ts`.

## Zoom projets

- `src/projects.ts` : pour chaque expérience (même `id` que dans `data.ts`, ou slug Ghost `cv-experience-<id>`), le pitch, les blocs d'architecture (posés sur une grille colonne/ligne), les fonctionnalités (étapes `de → vers`) et les personas. Termes génériques uniquement : pas de nom de service interne, de client ni de fournisseur.
- `src/ProjectZoom.tsx` : vue projet (fonctionnalités à gauche, schéma SVG zoomable à droite). Quatre niveaux : parcours › projet › fonctionnalité › composant.
- URL : `#<projet>` ou `#<projet>-<fonctionnalité>` ; tout autre hash reste une ancre du CV.
- Logos : `src/assets/logos/<id>.png` (fond blanc, chargés par `import.meta.glob`). Une expérience sans entrée dans `projects.ts` s'affiche sans zoom.

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
npm run ghost:diff               # écart data.ts ↔ Ghost (code 1 s'il y en a)
npm run ghost:seed               # créer / mettre à jour dans Ghost (idempotent, par slug)
npm run ghost:pull               # sauvegarder les articles dans snapshots/ghost/posts/
```

## Docker et déploiement

- `Dockerfile` : build Vite (Node 22) puis nginx (`deploy/nginx.conf.template`, en-têtes de sécurité + CSP dont `connect-src` = origine Ghost, substituée via `GHOST_ORIGIN`). Args : `VITE_GHOST_URL`, `VITE_GHOST_CONTENT_KEY`. Ghost utilise l'image officielle (pas de Dockerfile Ghost).
- `docker-compose.yml` : `ghost` + `mysql` ; le service `web` (SPA, port 8080) est dans le profil `web`.
- `./deploy.sh {local|home} {diff|pull|update}` (même schéma que Fel-Hypnose / Bab Charki) :
  - `local` lit `.env` ; `update` = seed Ghost + `docker compose --profile web up -d --build web`.
  - `home` lit `.env.home` (`.env.home.example`) ; `update` = seed Ghost via l'API Admin + `dist/` (+ rsync si `DEPLOY_RSYNC_TARGET`).
  - Les `.env` sont lus ligne à ligne, jamais `source`.

`scripts/*.mjs` importent `src/data.ts` directement (Node ≥ 22.18, type stripping natif).
