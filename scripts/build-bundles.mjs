/* eslint-disable no-console */
/* eslint-disable import/extensions */
/* eslint-disable no-restricted-imports */
import { execSync } from 'node:child_process';
import { bundles, commonStyles, bundlesWithoutCommonStyles } from '../bundles.config.js';

function splitBundleEntries(allBundles, chunkIndex = 0, chunkCount = 1) {
  const names = Object.keys(allBundles).sort();
  const withoutCommon = new Set(bundlesWithoutCommonStyles || []);
  const safeChunkCount = Math.max(1, Number(chunkCount) || 1);
  const safeChunkIndex = Math.min(Math.max(0, Number(chunkIndex) || 0), safeChunkCount - 1);
  const chunks = Array.from({ length: safeChunkCount }, () => ({}));
  const signatureCount = new Map();

  names.forEach((bundleName) => {
    const bundleSpecificStyles = allBundles[bundleName] || [];
    const baseStyles = withoutCommon.has(bundleName) ? [] : commonStyles;
    const signature = [...new Set([...baseStyles, ...bundleSpecificStyles])].join('|');

    const seen = signatureCount.get(signature) || 0;
    const preferredChunk = seen % safeChunkCount;
    signatureCount.set(signature, seen + 1);

    let targetChunk = preferredChunk;
    for (let idx = 0; idx < safeChunkCount; idx += 1) {
      const candidate = (preferredChunk + idx) % safeChunkCount;
      if (Object.keys(chunks[candidate]).length < Object.keys(chunks[targetChunk]).length) {
        targetChunk = candidate;
      }
    }

    chunks[targetChunk][bundleName] = allBundles[bundleName];
  });

  return chunks[safeChunkIndex];
}

function getCssBundlesChunkNames(options = {}) {
  const { chunkIndex = 0, chunkCount = 1 } = options;
  const chunkBundles = splitBundleEntries(bundles, chunkIndex, chunkCount);
  return Object.keys(chunkBundles).sort();
}

const MAX_BUNDLES_PER_BUILD = Number(process.env.MAX_BUNDLES_PER_BUILD || 20);
const totalBundles = Object.keys(bundles).length;
const chunkCount = Math.max(1, Math.ceil(totalBundles / MAX_BUNDLES_PER_BUILD));

console.log(
  `[bundles] total=${totalBundles}, maxPerBuild=${MAX_BUNDLES_PER_BUILD}, chunks=${chunkCount}`
);

for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
  const emptyOutDir = chunkIndex === 0 ? 'true' : 'false';
  const chunkNames = getCssBundlesChunkNames({
    chunkIndex,
    chunkCount,
  });

  console.log(`[bundles] building chunk ${chunkIndex + 1}/${chunkCount}`);
  console.log(`[bundles] chunk ${chunkIndex + 1} bundles (${chunkNames.length}):`);
  console.log(`  ${chunkNames.join(', ')}`);

  execSync('pnpm vite build --mode bundles', {
    stdio: 'inherit',
    env: {
      ...process.env,
      BUNDLE_CHUNK_INDEX: String(chunkIndex),
      BUNDLE_CHUNK_COUNT: String(chunkCount),
      BUNDLE_EMPTY_OUT_DIR: emptyOutDir,
    },
  });
}
