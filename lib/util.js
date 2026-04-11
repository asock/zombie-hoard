// lib/util.js — Tiny shared helpers.

/**
 * parseInt with fallback (guards against NaN / undefined / null).
 * @param {unknown} val
 * @param {number} fallback
 * @returns {number}
 */
export function safeInt(val, fallback) {
  if (val === undefined || val === null || val === '') return fallback;
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * Clamp a number between min and max, NaN-safe.
 */
export function clamp(n, min, max) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

/**
 * Normalize a string for comparison (lowercase, collapse whitespace, strip punctuation).
 * Used by the claim differ to detect "same claim, different wording".
 */
export function normalizeText(s) {
  if (typeof s !== 'string') return '';
  return s.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Tiny English stopword list. Filtered out before set comparison so that
// "the/is/of/are" don't inflate the Jaccard union and falsely separate
// rephrasings of the same claim. We don't need linguistic completeness —
// just enough to make rewordings of the same idea actually match.
const STOPWORDS = new Set([
  'the','and','for','are','but','not','you','all','any','can','had','her','was','one',
  'our','out','day','get','has','him','his','how','man','new','now','old','see','two',
  'way','who','its','this','that','from','they','with','have','will','your','what',
  'when','make','like','time','just','know','take','into','year','some','them','than',
  'then','look','only','come','over','also','back','after','use','her','than','these',
  'those','their','there','where','which','while','about','because','been','being','were'
]);

/**
 * Jaccard similarity over content-word sets. Cheap, no embeddings required.
 * Good enough for "is this claim basically the same as that claim".
 *
 * Uses normalizeText + length filter + a small stopword list to avoid having
 * filler words drown out the actual content. With a 0.6 threshold this
 * matches obvious rephrasings while keeping unrelated claims well below.
 */
export function jaccard(a, b) {
  const tokenize = (s) =>
    new Set(
      normalizeText(s)
        .split(' ')
        .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    );
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const w of setA) if (setB.has(w)) intersection++;
  const union = setA.size + setB.size - intersection;
  return intersection / union;
}
