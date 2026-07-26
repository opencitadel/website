# open-citadel.org

The Open Citadel website. One site for every standard, built with
[Astro Starlight](https://starlight.astro.build/) and served from Cloudflare
Pages.

```
/            what Open Citadel is
/oars/       the Open App Risk Standard
/community/  charter, governance, code of conduct
```

## How it works

**No content is authored here.** Every page is generated at build time from two
submodules, so the site cannot drift from the standards it publishes:

| Submodule | Repository | Provides |
|---|---|---|
| `vendor/oars` | [opencitadel/OARS](https://github.com/opencitadel/OARS) | Specification, ratings dataset, scoring engine |
| `vendor/community` | [opencitadel/community](https://github.com/opencitadel/community) | Charter, governance, communication, code of conduct |

`scripts/sync-content.mjs` reads both, renders them into
`src/content/docs/`, and runs the standard's own release pipeline to produce the
JSON artifacts the site publishes.

Two consequences worth knowing:

- **Scores on this site come from OARS's own scoring engine**, imported from the
  submodule rather than reimplemented. If the site and the standard could
  disagree about a score, the site would be the wrong one — so it is not given
  the chance.
- **The sidebar is generated from `spec.yaml`.** Adding a section to the
  specification adds it to the navigation, with no change here.

To fix a typo in the specification, open a pull request against
[opencitadel/OARS](https://github.com/opencitadel/OARS). Editing this repository
would only be overwritten on the next build.

## Running it

```bash
git clone --recurse-submodules https://github.com/opencitadel/website.git
cd website
npm install
npm run dev
```

| Command | Does |
|---|---|
| `npm run dev` | Sync content, then serve at `localhost:4321` |
| `npm run build` | Sync content, then build to `dist/` |
| `npm run sync` | Regenerate content only |

## Publishing an update to a standard

Submodules are pinned to a commit, so publishing is a deliberate act rather
than a side effect of someone merging a rating change:

```bash
git submodule update --remote vendor/oars
git commit -am "Publish OARS through <short-sha>"
git push
```

A scheduled workflow opens this as a pull request weekly so the bump is
reviewed.

## Design

Brand tokens come from
[opencitadel/citadel-design](https://github.com/opencitadel/citadel-design) —
navy `#062A63`, warm white `#F7F4EE`, Citadel cyan `#00A9F4`. They are marked
**provisional** there and have not been colour-matched or approved.

Risk-tier colours are deliberately *not* from the brand palette: they carry
meaning, and the OARS coral accent sits close enough to the High tier that
reusing it would make a brand colour read as a severity.

`public/favicon.svg` is a plain geometric placeholder following the family
grammar. It is not the approved mark — replace it once citadel-design
productionizes the real vector.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Cloudflare Pages settings, the custom
domain, and the `oars.open-citadel.org` redirect.

## Licence

Site code is [MIT](https://github.com/opencitadel/OARS/blob/main/LICENSE-CODE).
The content it renders carries the licence of its source repository — the OARS
specification and dataset are CC BY 4.0.
