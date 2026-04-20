#!/usr/bin/env node
/**
 * One-shot generator for Companion asset placeholders.
 *
 * Produces:
 *   public/companion-assets/final/{G}_{FACE}_{HAIR}_{BODY}.svg      (54 combos)
 *   public/companion-assets/thumbnails/face/{female|male}/{id}.svg  (6)
 *   public/companion-assets/thumbnails/hair/{female|male}/{id}.svg  (6)
 *   public/companion-assets/thumbnails/body/{id}.svg                (3)
 *
 * Run:  node scripts/generatePlaceholders.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_ROOT = path.resolve(__dirname, "..", "public", "companion-assets");

const FACES = ["face01", "face02", "face03"];
const HAIRS = ["hair01", "hair02", "hair03"];
const BODIES = ["body01", "body02", "body03"];
const GENDERS = [
  { code: "F", key: "female" },
  { code: "M", key: "male" },
];

const FACE_LABEL = {
  female: { face01: "Oval", face02: "Heart", face03: "Diamond" },
  male: { face01: "Square", face02: "Oval", face03: "Angular" },
};
const HAIR_LABEL = {
  female: { hair01: "Long Wavy", hair02: "Short Bob", hair03: "Pixie Cut" },
  male: { hair01: "Short Cut", hair02: "Medium Swept", hair03: "Long Tied" },
};
const BODY_LABEL = { body01: "Athletic", body02: "Slim", body03: "Heavy Build" };

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeSvg(filepath, svg) {
  ensureDir(path.dirname(filepath));
  fs.writeFileSync(filepath, svg, "utf8");
}

// ------------------------------------------------------------------
// FINAL composite portrait (400×600)
// ------------------------------------------------------------------
function finalSvg({ gender, face, hair, body }) {
  const gKey = gender.key;
  const faceLabel = FACE_LABEL[gKey][face];
  const hairLabel = HAIR_LABEL[gKey][hair];
  const bodyLabel = BODY_LABEL[body];
  const isFemale = gKey === "female";

  // Body proportions driven by body build
  const shoulderW = body === "body01" ? 150 : body === "body02" ? 120 : 180;
  const torsoW = body === "body01" ? 130 : body === "body02" ? 100 : 170;

  // Hair silhouette
  const hairPath = (() => {
    if (gKey === "female") {
      if (hair === "hair01")
        return "M140,150 Q120,260 130,430 L270,430 Q280,260 260,150 Q230,105 200,105 Q170,105 140,150 Z"; // long wavy
      if (hair === "hair02")
        return "M145,155 Q135,210 140,260 L260,260 Q265,210 255,155 Q230,115 200,115 Q170,115 145,155 Z"; // bob
      return "M155,160 Q150,190 160,220 L240,220 Q250,190 245,160 Q230,125 200,125 Q170,125 155,160 Z"; // pixie
    }
    if (hair === "hair01") return "M160,155 Q155,185 165,210 L235,210 Q245,185 240,155 Q228,130 200,130 Q172,130 160,155 Z"; // short
    if (hair === "hair02") return "M148,150 Q135,200 150,240 L250,240 Q265,200 252,150 Q228,115 200,115 Q172,115 148,150 Z"; // medium swept
    return "M145,150 Q130,310 150,390 L250,390 Q270,310 255,150 Q230,110 200,110 Q170,110 145,150 Z"; // long tied
  })();

  // Face shape oval approximation
  const faceRX = face === "face01" ? 50 : face === "face02" ? 52 : 46;
  const faceRY = face === "face01" ? 62 : face === "face02" ? 60 : 68;
  const jawW = face === "face01" ? 62 : face === "face02" ? 52 : 70;

  const title = `${gender.code}_${face}_${hair}_${body}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0A0A0A"/>
      <stop offset="1" stop-color="#141827"/>
    </linearGradient>
    <radialGradient id="skin" cx="0.5" cy="0.4" r="0.7">
      <stop offset="0" stop-color="#D7A67A"/>
      <stop offset="1" stop-color="#8D6442"/>
    </radialGradient>
    <linearGradient id="torso" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1A1F2E"/>
      <stop offset="1" stop-color="#0E1320"/>
    </linearGradient>
    <linearGradient id="grid" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#00F0FF" stop-opacity="0.05"/>
      <stop offset="0.5" stop-color="#00F0FF" stop-opacity="0.2"/>
      <stop offset="1" stop-color="#00F0FF" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <rect width="400" height="600" fill="url(#bg)"/>
  <g stroke="#1E3444" stroke-width="0.4" opacity="0.6">
    ${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="${i * 50}" x2="400" y2="${i * 50}"/>`).join("")}
    ${Array.from({ length: 9 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="600"/>`).join("")}
  </g>
  <!-- torso -->
  <path d="M${200 - shoulderW / 2},320 Q${200 - torsoW / 2},420 ${200 - torsoW / 2 + 10},560 L${200 + torsoW / 2 - 10},560 Q${200 + torsoW / 2},420 ${200 + shoulderW / 2},320 Z" fill="url(#torso)" stroke="#2A3A55" stroke-width="1"/>
  <!-- neck -->
  <rect x="${200 - 18}" y="270" width="36" height="50" fill="url(#skin)" opacity="0.85"/>
  <!-- head -->
  <ellipse cx="200" cy="200" rx="${faceRX}" ry="${faceRY}" fill="url(#skin)" stroke="#3A2A1C" stroke-width="1"/>
  <!-- jaw accent -->
  <path d="M${200 - jawW / 2},${200 + faceRY - 10} Q200,${200 + faceRY + 20} ${200 + jawW / 2},${200 + faceRY - 10}" fill="none" stroke="#3A2A1C" stroke-width="1" opacity="0.8"/>
  <!-- eyes -->
  <ellipse cx="${isFemale ? 183 : 185}" cy="195" rx="4" ry="2" fill="#1A1A1A"/>
  <ellipse cx="${isFemale ? 217 : 215}" cy="195" rx="4" ry="2" fill="#1A1A1A"/>
  <!-- lips -->
  <path d="M190,225 Q200,${isFemale ? 232 : 228} 210,225" stroke="#6B2E2E" stroke-width="${isFemale ? 2.2 : 1.4}" fill="none"/>
  <!-- hair silhouette -->
  <path d="${hairPath}" fill="#201613" opacity="0.9"/>
  <!-- watermark label -->
  <rect x="0" y="560" width="400" height="40" fill="#0A0A0A" opacity="0.9"/>
  <text x="200" y="582" font-family="monospace" font-size="14" fill="#00F0FF" text-anchor="middle" letter-spacing="2">${title}</text>
  <text x="200" y="40" font-family="sans-serif" font-size="12" fill="#00F0FF" text-anchor="middle" letter-spacing="3" opacity="0.7">SOVEREIGN COMPANION // PLACEHOLDER</text>
  <text x="200" y="60" font-family="sans-serif" font-size="10" fill="#888" text-anchor="middle">${gKey.toUpperCase()} · ${faceLabel} · ${hairLabel} · ${bodyLabel}</text>
</svg>`;
}

// ------------------------------------------------------------------
// Category thumbnails (200×200)
// ------------------------------------------------------------------
function thumbSvg({ category, id, label, sublabel }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="tb" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0F1420"/>
      <stop offset="1" stop-color="#1A2440"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" fill="url(#tb)" rx="8"/>
  <g stroke="#00F0FF" stroke-opacity="0.15" stroke-width="0.5">
    <line x1="0" y1="40" x2="200" y2="40"/>
    <line x1="0" y1="160" x2="200" y2="160"/>
    <line x1="40" y1="0" x2="40" y2="200"/>
    <line x1="160" y1="0" x2="160" y2="200"/>
  </g>
  <circle cx="100" cy="90" r="42" fill="#D7A67A" opacity="0.65"/>
  <rect x="60" y="130" width="80" height="50" fill="#2A3550" rx="6"/>
  <text x="100" y="28" font-family="monospace" font-size="10" fill="#00F0FF" text-anchor="middle" letter-spacing="2">${category.toUpperCase()}</text>
  <text x="100" y="186" font-family="sans-serif" font-size="14" font-weight="600" fill="#E8EEFF" text-anchor="middle">${label}</text>
  ${sublabel ? `<text x="100" y="195" font-family="monospace" font-size="7" fill="#6C7A95" text-anchor="middle" letter-spacing="1">${sublabel}</text>` : ""}
</svg>`;
}

// ------------------------------------------------------------------
// Generate everything
// ------------------------------------------------------------------
let finalCount = 0;
for (const gender of GENDERS) {
  for (const face of FACES) {
    for (const hair of HAIRS) {
      for (const body of BODIES) {
        const filename = `${gender.code}_${face}_${hair}_${body}.svg`;
        writeSvg(path.join(PUBLIC_ROOT, "final", filename), finalSvg({ gender, face, hair, body }));
        finalCount++;
      }
    }
  }
}

let thumbCount = 0;
// Face thumbnails
for (const gender of GENDERS) {
  for (const face of FACES) {
    const label = FACE_LABEL[gender.key][face];
    writeSvg(
      path.join(PUBLIC_ROOT, "thumbnails", "face", gender.key, `${face}.svg`),
      thumbSvg({ category: `FACE · ${gender.key}`, id: face, label, sublabel: face.toUpperCase() }),
    );
    thumbCount++;
  }
}
// Hair thumbnails
for (const gender of GENDERS) {
  for (const hair of HAIRS) {
    const label = HAIR_LABEL[gender.key][hair];
    writeSvg(
      path.join(PUBLIC_ROOT, "thumbnails", "hair", gender.key, `${hair}.svg`),
      thumbSvg({ category: `HAIR · ${gender.key}`, id: hair, label, sublabel: hair.toUpperCase() }),
    );
    thumbCount++;
  }
}
// Body thumbnails
for (const body of BODIES) {
  writeSvg(
    path.join(PUBLIC_ROOT, "thumbnails", "body", `${body}.svg`),
    thumbSvg({ category: "BODY", id: body, label: BODY_LABEL[body], sublabel: body.toUpperCase() }),
  );
  thumbCount++;
}

console.log(`Generated ${finalCount} final composite placeholders.`);
console.log(`Generated ${thumbCount} category thumbnail placeholders.`);
console.log(`Output root: ${PUBLIC_ROOT}`);
