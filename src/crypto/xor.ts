function extendKey(base: number[]): number[] {
  const full = [...base];
  const extra = [0x2d, 0xce, 0xd2, 0x6e, 0x69];
  for (let i = 0; i < 10; i++) {
    full.push(extra[i % extra.length]);
  }
  return full;
}

export function krcDecrypt(encrypted: Uint8Array): Uint8Array {
  const KRC_KEY = [0x6b, 0x40, 0x47, 0x77, 0x5e, 0x32, 0x74, 0x47, 0x32, 0x6c];
  const fullKey = extendKey(KRC_KEY);
  const result = new Uint8Array(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    result[i] = encrypted[i] ^ fullKey[i % fullKey.length];
  }
  return result;
}
