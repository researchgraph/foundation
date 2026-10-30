# researchgraph.org

The website of the Research Graph Foundation, as GitHub Pages serves it.

This repository holds the built site and nothing else. A publishing script writes it from the Foundation's sources and replaces the whole repository with a single commit for each release, so the history shows the current version only. Please do not edit the files here: a change made in this repository is lost at the next release.

| Path | Holds |
|---|---|
| `site/` | The built pages, styles, scripts, fonts and images |
| `.github/workflows/pages.yml` | The workflow that deploys `site/` to GitHub Pages on each push to `main` |

The site's address is set in the repository's Pages settings. A site deployed by GitHub Actions ignores the `CNAME` file in `site/`.
