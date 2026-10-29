# plasticcheese.com

Static files for GitHub Pages, served from the root of `main` with the custom
domain in `CNAME`. There is no application build or dependency installation.

## Pages

- `/`: the original image landing page. Its image links to `/home/`.
- `/home/`: the project directory with TinyTracker, KMSwitcher, and Frank's profile.
- `/kmswitcher/`: the starter KMSwitcher project page.
- `/tinytracker/`: the existing generated TinyTracker documentation.

The home and KMSwitcher pages share `assets/site.css` and reuse the root
`plasticcheese.jpg` and favicon. The landing page keeps its separate `styles.css`.
Add future KMSwitcher pages under `kmswitcher/`; do not edit the generated
TinyTracker documentation as part of website layout changes.

## Preview

From the repository root, run:

```sh
python -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080/` and follow the image to the home page. Serve the
repository root so absolute links and assets resolve as they do on GitHub Pages.

Changes go through a feature branch and pull request to `main`. GitHub Pages
publishes the files after the pull request is merged.
