// Seeded random helpers for Twin Lookout: every scene is painted from a fixed
// seed so the left and right panels always agree except for the differences.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(rand, array) {
  return array[Math.floor(rand() * array.length)];
}

export function range(rand, min, max) {
  return min + rand() * (max - min);
}

export function rangeInt(rand, min, max) {
  return min + Math.floor(rand() * (max - min + 1));
}
