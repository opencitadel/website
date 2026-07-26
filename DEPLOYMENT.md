# Deploying open-citadel.org

A static Astro build served from Cloudflare Pages. No server, no database, no
runtime — a standards site should outlive the infrastructure it launched on.

## Cloudflare Pages settings

**Workers & Pages → Create → Pages → Connect to Git → `opencitadel/website`**

| Setting | Value |
|---|---|
| Production branch | `main` |
| Framework preset | **None** |
| Build command | `npm ci && npm run build` |
| Build output directory | `dist` |
| Root directory | *(empty)* |

Add an environment variable `NODE_VERSION` = `22` under **Settings →
Environment variables**, for both Production and Preview.

### Submodules

Content comes from two submodules, which Cloudflare clones automatically:

| Submodule | Repository | Provides |
|---|---|---|
| `vendor/oars` | [opencitadel/OARS](https://github.com/opencitadel/OARS) | The specification, the ratings dataset, and the scoring engine |
| `vendor/community` | [opencitadel/community](https://github.com/opencitadel/community) | Charter, governance, communication, code of conduct |

Both are public, so no credentials are needed to fetch them.

**Submodules are pinned to a commit.** The site shows whatever commit this
repository points at, not whatever is on the standard's `main`. That is
deliberate — publishing should be a decision, not a side effect of someone
merging a rating change. To publish updates:

```bash
git submodule update --remote vendor/oars
git commit -am "Publish OARS through <short-sha>"
git push
```

The `Update submodules` GitHub Action opens a pull request for this
automatically each week, so the bump is reviewed rather than silent.

### Why not the Astro preset

The preset assumes a plain Astro project. This build first generates content
from the submodules and runs the standard's own release pipeline to produce the
JSON artifacts, then builds the site. `npm run build` does both in order.

## Custom domain

**Pages project → Custom domains → Set up a custom domain**

Add `open-citadel.org` and `www.open-citadel.org`. Under **Rules → Redirect
Rules**, redirect `www.open-citadel.org/*` to `https://open-citadel.org/$1`
(301) so there is one canonical hostname.

### Per-standard subdomains

Standards live at paths — `open-citadel.org/oars/` — so that there is one
search index, one navigation, and one deployment. The friendly subdomain is
kept alive as a redirect rather than a second site:

| Rule | Target | Type |
|---|---|---|
| `oars.open-citadel.org/*` | `https://open-citadel.org/oars/$1` | 301 |

Add it under **Rules → Redirect Rules**, with a DNS `CNAME` for
`oars` pointing at the Pages project (proxied).

This costs nothing and keeps the option open: if a standard ever outgrows the
shared site, the subdomain already exists and can become canonical without
breaking links people have already shared.

`_redirects` cannot match on hostname, which is why this lives in Cloudflare
rather than in the repository.

## Headers and redirects

Checked in and applied automatically:

- [`public/_headers`](./public/_headers) — security headers, plus permissive
  CORS on `/*.json` so tooling can fetch the dataset from any origin
- [`public/_redirects`](./public/_redirects) — the `/discord` vanity path and
  short paths for the artifacts

> **Before launch:** `_redirects` still contains a placeholder for the Discord
> invite. Until it is replaced, `/discord` 404s and the Discord icon in the site
> header is a dead link. See
> [community/docs/discord.md](https://github.com/opencitadel/community/blob/main/docs/discord.md).

## Published artifacts

The build copies the release JSON into the site, so open-citadel.org is the
distribution point as well as the documentation:

| URL | Contents |
|---|---|
| `/oars-model.json` | Factors, values, scores, weights, thresholds |
| `/oars-permissions.json` | Rated permissions with scores and rationale |
| `/oars-combos.json` | Risky permission combinations |
| `/permission-rating.schema.json` | Schema with allowed values enumerated |

These track the pinned submodule commit. Implementations needing stability
should pin to a [tagged release](https://github.com/opencitadel/OARS/releases)
instead.

## Local development

```bash
git clone --recurse-submodules https://github.com/opencitadel/website.git
cd website
npm install
npm run dev
```

If you cloned without `--recurse-submodules`:

```bash
git submodule update --init --recursive
```

Content under `src/content/docs/` is generated on every build and is not checked
in. Edit the source repository, not the output.
