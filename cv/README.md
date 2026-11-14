# CV PDF et source LaTeX

Le téléchargement du site pointe vers `public/cv/leo-martin-cv.pdf`, un véritable PDF LaTeX d'une page A4. Sa source autonome est conservée à côté dans `public/cv/leo-martin-cv.tex`.

Le profil, les expériences et les compétences viennent de `src/data.ts`. Les projets personnels ne sont actuellement pas publiés, sur le site comme dans le PDF. `resumeHighlights` contient les missions synthétisées pour la version d'une page ; les missions détaillées du site sont conservées. Le PDF utilise le contenu statique validé, indépendamment du CMS Ghost.

Pour régénérer les deux fichiers après une modification du contenu ou de la mise en page :

1. Installer [Tectonic](https://tectonic-typesetting.github.io/en-US/install.html), [Poppler](https://poppler.freedesktop.org/) (`pdfinfo`) et Node.js 22.6 ou supérieur.
2. Lancer `npm run cv:build` à la racine du projet. La variable facultative `TECTONIC_BIN` permet de préciser le chemin du compilateur.
3. Vérifier visuellement le PDF, puis lancer `npm run build` : Vite copie les fichiers publics dans `dist/cv/`.

Le script refuse de remplacer les fichiers publiables si la compilation échoue, si du texte déborde ou si le PDF dépasse une page. Le modèle de mise en page est `cv/template.tex`. Le PDF compilé est versionné : le déploiement du site ne nécessite pas d'installer LaTeX.
