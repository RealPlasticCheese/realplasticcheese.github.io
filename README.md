# plasticcheese.com

Static files for GitHub Pages, served from the root of `main` with the custom
domain in `CNAME`. There is no application build or dependency installation.

## Pages

- `/`: the original image landing page. Its image links to `/home/`.
- `/home/`: the project directory with TinyTracker, KMSwitcher, and Frank's profile.
- `/kmswitcher/`: the KMSwitcher feature overview, compatibility, and setup introduction.
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

## KMSwitcher feature content

The project page uses the shared site styles plus `kmswitcher/site.css`.
`kmswitcher/edge-demo.js` enhances the hero handoff illustration. The additional
`usage-demos.js` and `usage-demos.css` provide a four-direction desk layout, a
keyboard-shortcut sequence, and text/image/file clipboard walkthroughs. Playback
is visitor-initiated and animations follow the shared reduced-motion preference.
These illustrations use sample content and never access devices or the system
clipboard. Static content, diagrams, navigation, and expandable lists also work
without JavaScript.

Feature copy was checked against KMSwitcher source commit `8ea9337`, particularly
`docs/screen-edge-switching.md`, `docs/clipboard-sharing.md`, `docs/configuration.md`,
`docs/installing.md`, `docs/web-console.md`, `docs/usb-input-selection.md`,
`docs/radio-channels.md`, `docs/slave-management.md`, `docs/master-updates.md`,
`docs/recovery-and-diagnostics.md`, and `docs/stress-testing.md`. Monitor-edge and
readiness behaviour was also checked in the companion implementation. Keep the
platform table and development-status note aligned with the source when updating
capability claims. Integrity checks are not a claim of signed firmware, and no
handoff-latency or transfer-throughput claims are made.
