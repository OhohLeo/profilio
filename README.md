# Profilio

CV interactif de Léo Martin, Product Builder Engineer. Le site présente les expériences professionnelles et leurs architectures, avec missions au survol, filtre multitechnologies et modes clair/sombre. Un CV PDF LaTeX d’une page est téléchargeable.

Adresse publique prévue : [me.filou.org](https://me.filou.org/).

Le site est une application statique React / TypeScript construite avec Vite. Ghost peut fournir les expériences via son API publique ; en son absence, les données locales sont utilisées. Les projets personnels sont conservés dans les sources pour une éventuelle réactivation, mais ne sont actuellement ni affichés, ni chargés par le navigateur, ni présents dans le PDF.

## Démarrer

Prérequis : Node.js 22.18 ou plus récent et npm.

```bash
npm ci
npm run dev -- --host 127.0.0.1
```

Ouvrir l’adresse affichée par Vite, généralement `http://127.0.0.1:5173/`.

```bash
npm test                 # Filtrage des technologies
npm run test:security    # Vérification du contrôle de publication
npm run build            # Compilation et contrôle automatique de dist/
npm run preview          # Prévisualisation du build
```

## Modifier le contenu

- `src/data.ts` : identité, accroche, expériences, formation et langues. `resumeHighlights` contient les missions condensées du PDF.
- `src/projects.ts` : objectifs des plateformes, fonctionnalités, icônes, composants et schémas d’architecture. Utiliser des termes génériques et uniquement des informations validées pour publication.
- `src/App.tsx` et `src/styles.css` : page principale, filtre et présentation.
- `src/ProjectZoom.tsx` : navigation entre architecture, fonctionnalité et composant.
- `src/assets/logos/` : logos des entreprises.

Les adresses `#robeau`, `#qos`, `#entech` et `#ijenko` ouvrent les architectures. Par exemple, `#qos-collecte` ouvre directement une fonctionnalité.

### CV PDF

```bash
npm run cv:build
npm run build
```

La génération nécessite [Tectonic](https://tectonic-typesetting.github.io/en-US/install.html) et [Poppler](https://poppler.freedesktop.org/) (`pdfinfo`). `TECTONIC_BIN` permet d’indiquer un chemin de compilateur particulier.

Le modèle est `cv/template.tex`. Les fichiers à jour sont `public/cv/leo-martin-cv.pdf` et sa source autonome `.tex`. Le script refuse les débordements et un résultat de plus d’une page. Vérifier aussi le rendu visuellement. Le déploiement utilise le PDF déjà généré et ne nécessite pas LaTeX. Voir [cv/README.md](cv/README.md).

## Ghost, facultatif

```bash
cp .env.example .env
npm run ghost:up
```

Configurer l’intégration dans Ghost, puis renseigner localement les variables nécessaires :

| Variable | Usage | Peut être publique ? |
| --- | --- | --- |
| `VITE_GHOST_URL` | Adresse du CMS accessible aux visiteurs | Oui |
| `VITE_GHOST_CONTENT_KEY` | Lecture des contenus publics Ghost | Oui |
| `GHOST_ADMIN_URL` | Adresse utilisée par les scripts d’administration | Aucun besoin de l’exposer séparément |
| `GHOST_ADMIN_API_KEY` | Création et modification du contenu | **Non, secret** |

Seules l’URL publique et la clé Content API sont utilisées par le navigateur. La clé Admin reste dans les scripts locaux. La clé Content API donne accès aux contenus publics du CMS ; ne pas publier de contenu confidentiel dans ce Ghost.

```bash
npm run ghost:diff              # Comparer les sources et Ghost
npm run ghost:pull              # Sauvegarder dans snapshots/, ignoré par Git
npm run ghost:seed -- --dry-run  # Examiner les changements prévus
npm run ghost:seed              # Créer ou mettre à jour les articles Ghost
```

Le script `ghost:seed` modifie le CMS. Le profil et le PDF continuent d’utiliser `src/data.ts`, même lorsque les expériences du site proviennent de Ghost.

## Construire et déployer

Publier **uniquement le contenu de `dist/`**, jamais la racine du dépôt. Ce dossier contient les ressources statiques, le CV et sa source LaTeX publique.

Pour un site autonome sans Ghost :

```bash
VITE_GHOST_URL= VITE_GHOST_CONTENT_KEY= npm run build
```

Pour un site connecté à Ghost, définir `VITE_GHOST_URL` et `VITE_GHOST_CONTENT_KEY` avec les valeurs publiques de production avant le build. Une URL `localhost` ne convient pas à un site distant : elle désignerait la machine de chaque visiteur.

Le `Dockerfile` produit une image nginx qui ne copie que `dist/` depuis l’étape de compilation. Le TLS doit être géré par l’hébergeur ou le reverse proxy. Les en-têtes nginx ne s’appliquent pas automatiquement à un hébergement statique différent.

```bash
docker compose --profile web up -d --build web
```

Le site local est alors disponible sur `http://localhost:8080/`. La stack Ghost/MySQL du fichier Compose est prévue pour le développement ; ses mots de passe par défaut ne sont pas adaptés à une mise en ligne.

Le DNS et l’hébergement de `me.filou.org` doivent être configurés séparément.

## Informations publiques et contrôle avant publication

Tout ce qui est dans le code client, dans `public/`, dans le PDF ou dans un article public Ghost est accessible aux visiteurs. Les coordonnées professionnelles affichées et les schémas génériques font donc partie du contenu public. Ne pas y ajouter d’adresse personnelle précise, de téléphone privé, de données clients, de noms internes ou de secrets techniques.

- Les `.env` réels et les sauvegardes `snapshots/` sont ignorés par Git ; seuls les exemples sans valeurs secrètes peuvent être versionnés.
- Les fichiers dotenv, les configurations locales des assistants et les clés privées sont exclus du contexte Docker.
- Ne jamais préfixer une variable secrète par `VITE_` : ces variables sont destinées au code client. Voir la [documentation Vite](https://v6.vite.dev/guide/env-and-mode).
- La [clé Content API Ghost](https://docs.ghost.org/content-api/) est conçue pour les clients publics ; la clé Admin ne doit jamais être embarquée.

`npm run build` exécute automatiquement `npm run security:check`. Ce contrôle bloque les fichiers privés ou sources maps dans `dist/`, les valeurs secrètes connues depuis les fichiers `.env*` locaux ou l’environnement, ainsi que plusieurs signatures de clés privées et tokens. Il n’affiche jamais les valeurs détectées. Les tests vérifient notamment la détection d’une clé Admin Ghost complète et de sa partie secrète seule.

Ce contrôle vise le build local : il ne remplace pas une vérification de l’URL réellement déployée, de la configuration de l’hébergeur et des données métier publiées. Il ne garantit pas la détection de tous les formats de secrets inconnus.
