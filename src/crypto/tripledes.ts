const S1 = [
  [14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7],
  [0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8],
  [4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0],
  [15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13],
];
const S2 = [
  [15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10],
  [3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5],
  [0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15],
  [13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9],
];
const S3 = [
  [10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8],
  [13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1],
  [13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7],
  [1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12],
];
const S4 = [
  [7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15],
  [13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9],
  [10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4],
  [3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14],
];
const S5 = [
  [2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9],
  [14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6],
  [4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14],
  [11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3],
];
const S6 = [
  [12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11],
  [10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8],
  [9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6],
  [4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13],
];
const S7 = [
  [4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1],
  [13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6],
  [1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2],
  [6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12],
];
const S8 = [
  [13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7],
  [1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2],
  [7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8],
  [2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11],
];

const S_BOXES = [S1, S2, S3, S4, S5, S6, S7, S8];

const PC1 = [
  57, 49, 41, 33, 25, 17, 9, 1, 58, 50, 42, 34, 26, 18,
  10, 2, 59, 51, 43, 35, 27, 19, 11, 3, 60, 52, 44, 36,
  63, 55, 47, 39, 31, 23, 15, 7, 62, 54, 46, 38, 30, 22,
  14, 6, 61, 53, 45, 37, 29, 21, 13, 5, 28, 20, 12, 4,
];

const PC2 = [
  14, 17, 11, 24, 1, 5, 3, 28, 15, 6, 21, 10,
  23, 19, 12, 4, 26, 8, 16, 7, 27, 20, 13, 2,
  41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48,
  44, 49, 39, 56, 34, 53, 46, 42, 50, 36, 29, 32,
];

const IP = [
  58, 50, 42, 34, 26, 18, 10, 2, 60, 52, 44, 36, 28, 20, 12, 4,
  62, 54, 46, 38, 30, 22, 14, 6, 64, 56, 48, 40, 32, 24, 16, 8,
  57, 49, 41, 33, 25, 17, 9, 1, 59, 51, 43, 35, 27, 19, 11, 3,
  61, 53, 45, 37, 29, 21, 13, 5, 63, 55, 47, 39, 31, 23, 15, 7,
];

const FP = [
  40, 8, 48, 16, 56, 24, 64, 32, 39, 7, 47, 15, 55, 23, 63, 31,
  38, 6, 46, 14, 54, 22, 62, 30, 37, 5, 45, 13, 53, 21, 61, 29,
  36, 4, 44, 12, 52, 20, 60, 28, 35, 3, 43, 11, 51, 19, 59, 27,
  34, 2, 42, 10, 50, 18, 58, 26, 33, 1, 41, 9, 49, 17, 57, 25,
];

const E = [
  32, 1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9,
  8, 9, 10, 11, 12, 13, 12, 13, 14, 15, 16, 17,
  16, 17, 18, 19, 20, 21, 20, 21, 22, 23, 24, 25,
  24, 25, 26, 27, 28, 29, 28, 29, 30, 31, 32, 1,
];

const P = [
  16, 7, 20, 21, 29, 12, 28, 17, 1, 15, 23, 26, 5, 18, 31, 10,
  2, 8, 24, 14, 32, 27, 3, 9, 19, 13, 30, 6, 22, 11, 4, 25,
];

const SHIFT_SCHEDULE = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];

function getBit(block: number[], pos: number): number {
  const byteIdx = Math.floor((pos - 1) / 8);
  const bitIdx = (pos - 1) % 8;
  return (block[byteIdx] >> (7 - bitIdx)) & 1;
}

function setBit(block: number[], pos: number, val: number): void {
  const byteIdx = Math.floor((pos - 1) / 8);
  const bitIdx = (pos - 1) % 8;
  if (val) {
    block[byteIdx] |= (1 << (7 - bitIdx));
  } else {
    block[byteIdx] &= ~(1 << (7 - bitIdx));
  }
}

function permute(input: number[], table: number[], outLen: number): number[] {
  const outLenBytes = Math.ceil(outLen / 8);
  const out: number[] = new Array(outLenBytes).fill(0);
  for (let i = 0; i < outLen; i++) {
    setBit(out, i + 1, getBit(input, table[i]));
  }
  return out;
}

function generateRoundKeys(key: number[]): number[][] {
  const permKey = permute(key, PC1, 56);
  const c = new Array(28);
  const d = new Array(28);
  for (let i = 0; i < 28; i++) {
    c[i] = getBit(permKey, i + 1);
    d[i] = getBit(permKey, i + 29);
  }

  const roundKeys: number[][] = [];
  for (let r = 0; r < 16; r++) {
    const shift = SHIFT_SCHEDULE[r];
    const cTemp = [...c];
    const dTemp = [...d];
    for (let i = 0; i < 28; i++) {
      c[i] = cTemp[(i + shift) % 28];
      d[i] = dTemp[(i + shift) % 28];
    }
    const combined = new Array(7).fill(0);
    for (let i = 0; i < 28; i++) {
      if (c[i]) {
        const byteIdx = Math.floor(i / 8);
        const bitIdx = i % 8;
        combined[byteIdx] |= (1 << (7 - bitIdx));
      }
    }
    for (let i = 0; i < 28; i++) {
      if (d[i]) {
        const byteIdx = Math.floor((i + 28) / 8);
        const bitIdx = (i + 28) % 8;
        combined[byteIdx] |= (1 << (7 - bitIdx));
      }
    }
    roundKeys.push(permute(combined, PC2, 48));
  }
  return roundKeys;
}

function desCryptBlock(block: number[], roundKeys: number[][]): number[] {
  let data = permute(block, IP, 64);
  let left = data.slice(0, 4);
  let right = data.slice(4, 8);

  for (let round = 0; round < 16; round++) {
    const expanded = permute(right, E, 48);
    const xored: number[] = new Array(6).fill(0);
    for (let i = 0; i < 48; i++) {
      if (getBit(expanded, i + 1) !== getBit(roundKeys[round], i + 1)) {
        const byteIdx = Math.floor(i / 8);
        const bitIdx = i % 8;
        xored[byteIdx] |= (1 << (7 - bitIdx));
      }
    }

    const sOut: number[] = new Array(4).fill(0);
    for (let s = 0; s < 8; s++) {
      const chunk: number[] = [];
      for (let b = 0; b < 6; b++) {
        const byteIdx = Math.floor((s * 6 + b) / 8);
        const bitIdx = (s * 6 + b) % 8;
        chunk.push((xored[byteIdx] >> (7 - bitIdx)) & 1);
      }
      const row = (chunk[0] << 1) | chunk[5];
      const col = (chunk[1] << 3) | (chunk[2] << 2) | (chunk[3] << 1) | chunk[4];
      const sVal = S_BOXES[s][row][col];
      for (let b = 0; b < 4; b++) {
        if ((sVal >> (3 - b)) & 1) {
          const byteIdx = Math.floor((s * 4 + b) / 8);
          const bitIdx = (s * 4 + b) % 8;
          sOut[byteIdx] |= (1 << (7 - bitIdx));
        }
      }
    }

    const pOut = permute(sOut, P, 32);
    const newRight: number[] = new Array(4).fill(0);
    for (let i = 0; i < 32; i++) {
      if (getBit(left, i + 1) !== getBit(pOut, i + 1)) {
        const byteIdx = Math.floor(i / 8);
        const bitIdx = i % 8;
        newRight[byteIdx] |= (1 << (7 - bitIdx));
      }
    }

    [left, right] = [right, newRight];
  }

  const combined = [...right, ...left];
  return permute(combined, FP, 64);
}

export function tripledesDecrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
  const key1 = generateRoundKeys(Array.from(key.slice(0, 8)));
  const key2 = generateRoundKeys(Array.from(key.slice(8, 16)));
  const key3 = generateRoundKeys(Array.from(key.slice(16, 24)));

  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 8) {
    const block = Array.from(data.slice(i, i + 8));
    if (block.length < 8) break;
    const d1 = desCryptBlock(block, key1.slice().reverse());
    const e2 = desCryptBlock(d1, key2);
    const d3 = desCryptBlock(e2, key3.slice().reverse());
    result.set(d3, i);
  }
  return result;
}
