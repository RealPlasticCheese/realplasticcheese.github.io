# plasticcheese.com

Static files for GitHub Pages, served from the root of `main` with the custom
domain in `CNAME`. There is no application build or dependency installation.

## Pages

- `/`: the original image landing page. Its image links to `/home/`.
- `/home/`: the project directory with TinyTracker, KMSwitcher, Security Camera
  Viewer, TUNNELBASH, Frank's profile, and GitHub.
- `/kmswitcher/`: the KMSwitcher feature overview, compatibility, and setup introduction.
- `/kmswitcher/flash/`: the quick-start guide with USB flashing, hardware photos, pairing instructions, and Companion downloads.
- `/securitycameraviewer/`: the Security Camera Viewer overview, recording and
  integration features, setup, and compatibility notes.
- `/tinytracker/`: the existing generated TinyTracker documentation.

The home and project pages share `assets/site.css` and reuse the root
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

## KMSwitcher firmware flasher

The flasher uses Web Serial in desktop Chrome and Edge. Firmware and flashing
dependencies are served from this site. An ordinary install checks for the
release’s partition layout or blank flash before writing. The erase action
clears the whole chip after the user confirms the detected board.

To update the firmware, copy the regular firmware ZIP from a public
[KMSwitcher release](https://github.com/RealPlasticCheese/KMSwitcher/releases)
into `kmswitcher/flash/firmware/`. Replace the version, filename, and published
SHA-256 in `firmware.js`, update the release link in `index.html`, and remove
the previous ZIP. The ZIP includes the firmware license and component notices.
Check both board layouts against the new release and run
`node --test tests/kmswitcher-flash.test.mjs` before opening a PR.

The `vendor/` directory contains the upstream browser bundles for esptool-js
0.7.1 (including pako and atob-lite), fflate 0.8.2, and js-md5 0.8.3. Their
licenses are in the same directory.

## Security Camera Viewer content

The project page uses the shared site styles plus `securitycameraviewer/site.css`.
Its camera grid is a static SVG illustration with sample labels, not live footage.
Section links and native expandable compatibility notes work without JavaScript.

Content was checked against the local `SecurityCameraViewer` project's `README.md`
and `docs/live-rewind.md`, `docs/motion-recording.md`, `docs/battery-cameras.md`,
`docs/nvr-recordings.md`, `docs/streaming-service.md`, `docs/integrations.md`, and
`docs/push-to-talk.md`. Keep claims aligned with the maintained Windows/Linux web
server. The native desktop viewers are deprecated; AI models and MediaMTX are
optional separate installs. Setup commands assume an existing project checkout;
no public source repository or release download is currently linked.
