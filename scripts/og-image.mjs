#!/usr/bin/env node
// Generates the Open Graph images into public/.
//
//   public/og.png        default card — Open Citadel
//   public/oars-og.png   used on /oars/* pages
//
// Run manually (`npm run og`) and commit the output; the site build does not
// regenerate these, so builds stay deterministic and offline. The layout uses
// the same design language as the site — paper, ink, Source Serif 4 over
// Inter — and embeds the citadel-design concept marks unaltered.
//
// Fonts are fetched from Google Fonts as static TTFs at script runtime (satori
// cannot read the woff2 files the site itself uses).

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..');

const INK = '#1f1e1d';
const TEXT = '#45433d';
const MUTED = '#6f6a60';
const PAPER = '#faf9f5';
const HAIRLINE = '#e2ded2';
const NAVY = '#062a63';
const CYAN = '#00a9f4';
const CORAL = '#ff5a36';

async function googleFont(family, weight) {
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`, {
      // An old UA makes the API serve plain TTF instead of woff2.
      headers: { 'User-Agent': 'Mozilla/4.0' },
    })
  ).text();
  const url = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1];
  if (!url) throw new Error(`No TTF URL returned for ${family}@${weight}`);
  return Buffer.from(await (await fetch(url)).arrayBuffer());
}

const [serif600, inter400, inter600] = await Promise.all([
  googleFont('Source+Serif+4', 600),
  googleFont('Inter', 400),
  googleFont('Inter', 600),
]);

const h = (type, style, ...children) => ({
  type,
  props: { style, children: children.length === 1 ? children[0] : children },
});

const markDataUri = (file) =>
  `data:image/png;base64,${readFileSync(join(SITE, 'src', 'assets', file)).toString('base64')}`;

function card({ eyebrow, title, subtitle, tagline, footer, mark, accent }) {
  return h(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: PAPER,
      fontFamily: 'Inter',
    },
    h(
      'div',
      {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 84px',
        gap: 64,
      },
      h(
        'div',
        { display: 'flex', flexDirection: 'column', maxWidth: 680 },
        ...(eyebrow
          ? [
              h('div', {
                display: 'flex',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: 3,
                color: MUTED,
                marginBottom: 18,
              }, eyebrow.toUpperCase()),
            ]
          : []),
        h(
          'div',
          {
            display: 'flex',
            fontFamily: 'Source Serif 4',
            fontWeight: 600,
            fontSize: title.length > 12 ? 88 : 108,
            letterSpacing: -2,
            color: INK,
            lineHeight: 1.05,
          },
          title
        ),
        ...(subtitle
          ? [
              h('div', {
                display: 'flex',
                fontFamily: 'Source Serif 4',
                fontWeight: 600,
                fontSize: 42,
                color: TEXT,
                marginTop: 10,
                letterSpacing: -0.5,
              }, subtitle),
            ]
          : []),
        h('div', {
          display: 'flex',
          fontSize: 30,
          lineHeight: 1.45,
          color: TEXT,
          marginTop: 28,
        }, tagline),
        h('div', {
          display: 'flex',
          fontSize: 26,
          fontWeight: 600,
          color: NAVY,
          marginTop: 34,
        }, footer),
      ),
      h(
        'div',
        {
          display: 'flex',
          border: `3px solid ${HAIRLINE}`,
          borderRadius: 72,
          overflow: 'hidden',
          boxShadow: '0 24px 60px -30px rgba(6, 42, 99, 0.35)',
        },
        {
          type: 'img',
          props: { src: markDataUri(mark), width: 330, height: 330 },
        }
      )
    ),
    // The base bar: project accent segment on the family navy.
    h(
      'div',
      { display: 'flex', height: 20, width: '100%' },
      h('div', { display: 'flex', width: 230, backgroundColor: accent }),
      h('div', { display: 'flex', flex: 1, backgroundColor: NAVY })
    )
  );
}

const CARDS = [
  {
    file: 'og.png',
    spec: {
      title: 'Open Citadel',
      tagline: 'Open standards for Microsoft security decisions. The method, not just the answer.',
      footer: 'open-citadel.org',
      mark: 'citadel-icon.png',
      accent: CYAN,
    },
  },
  {
    file: 'oars-og.png',
    spec: {
      eyebrow: 'An Open Citadel standard',
      title: 'OARS',
      subtitle: 'Open App Risk Standard',
      tagline: 'An open, dual-layer model for rating the risk of apps and the permissions they request.',
      footer: 'open-citadel.org/oars',
      mark: 'oars-icon.png',
      accent: CORAL,
    },
  },
];

for (const { file, spec } of CARDS) {
  const svg = await satori(card(spec), {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Source Serif 4', data: serif600, weight: 600, style: 'normal' },
      { name: 'Inter', data: inter400, weight: 400, style: 'normal' },
      { name: 'Inter', data: inter600, weight: 600, style: 'normal' },
    ],
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  const out = join(SITE, 'public', file);
  writeFileSync(out, png);
  console.log(`  public/${file}  ${(png.length / 1024).toFixed(0)} kB`);
}
