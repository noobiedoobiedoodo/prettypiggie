#!/usr/bin/env node
/**
 * Syncs the exact required @mediapipe/tasks-vision WASM runtime files into
 * public/pretty-piggie/wasm/, validates binary headers (.wasm \0asm & .task PK\x03\x04),
 * and writes SHA-256 integrity hashes to src/pretty-piggie/assetManifest.json.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const pkgJson = JSON.parse(
  fs.readFileSync(
    path.join(rootDir, 'node_modules/@mediapipe/tasks-vision/package.json'),
    'utf8'
  )
);

const wasmSrcDir = path.join(
  rootDir,
  'node_modules/@mediapipe/tasks-vision/wasm'
);
const wasmDestDir = path.join(rootDir, 'public/pretty-piggie/wasm');
const modelPath = path.join(
  rootDir,
  'public/pretty-piggie/models/face_landmarker.task'
);
const manifestOutPath = path.join(
  rootDir,
  'src/pretty-piggie/assetManifest.json'
);

fs.mkdirSync(wasmDestDir, { recursive: true });
fs.mkdirSync(path.dirname(manifestOutPath), { recursive: true });

const REQUIRED_WASM_FILES = [
  {
    name: 'vision_wasm_internal.js',
    expectedMime: 'application/javascript',
  },
  {
    name: 'vision_wasm_internal.wasm',
    expectedMime: 'application/wasm',
    magicHex: '0061736d', // \0asm
  },
];

function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return {
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
    bytes: buf.length,
    magicHex: buf.subarray(0, 4).toString('hex'),
  };
}

const assets = [];

for (const item of REQUIRED_WASM_FILES) {
  const src = path.join(wasmSrcDir, item.name);
  const dst = path.join(wasmDestDir, item.name);
  if (!fs.existsSync(src)) {
    throw new Error(`Missing MediaPipe source file: ${src}`);
  }
  fs.copyFileSync(src, dst);
  const info = sha256File(dst);
  if (item.magicHex && info.magicHex !== item.magicHex) {
    throw new Error(
      `Invalid WASM magic header on ${item.name}: expected ${item.magicHex}, got ${info.magicHex}`
    );
  }
  assets.push({
    publicPath: `/pretty-piggie/wasm/${item.name}`,
    diskPath: `public/pretty-piggie/wasm/${item.name}`,
    expectedMime: item.expectedMime,
    bytes: info.bytes,
    sha256: info.sha256,
  });
}

if (!fs.existsSync(modelPath)) {
  throw new Error(
    `Missing self-hosted Face Landmarker model: ${modelPath}`
  );
}
const modelInfo = sha256File(modelPath);
// MediaPipe .task bundles are ZIP/TFLite archives starting with PK\x03\x04 (504b0304) or 2-byte zero-prefixed \0\0PK (0000504b)
if (
  (modelInfo.magicHex !== '504b0304' && modelInfo.magicHex !== '0000504b') ||
  modelInfo.bytes < 1_000_000
) {
  throw new Error(
    `Invalid face_landmarker.task bundle (magic=${modelInfo.magicHex}, bytes=${modelInfo.bytes})`
  );
}

assets.push({
  publicPath: '/pretty-piggie/models/face_landmarker.task',
  diskPath: 'public/pretty-piggie/models/face_landmarker.task',
  expectedMime: 'application/octet-stream',
  bytes: modelInfo.bytes,
  sha256: modelInfo.sha256,
});

const manifest = {
  mediapipePackage: '@mediapipe/tasks-vision',
  mediapipeVersion: pkgJson.version,
  license: pkgJson.license || 'Apache-2.0',
  wasmBasePath: '/pretty-piggie/wasm',
  faceLandmarkerModelPath: '/pretty-piggie/models/face_landmarker.task',
  generatedAtUtc: new Date().toISOString(),
  assets,
};

fs.writeFileSync(manifestOutPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(
  `Synced ${assets.length} self-hosted MediaPipe assets (@mediapipe/tasks-vision@${pkgJson.version}) -> src/pretty-piggie/assetManifest.json`
);
