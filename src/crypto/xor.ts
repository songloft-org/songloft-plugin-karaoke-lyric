const KRC_KEY = [0x40, 0x47, 0x61, 0x77, 0x5e, 0x32, 0x74, 0x47, 0x51, 0x36, 0x31, 0x2d, 0xce, 0xd2, 0x6e, 0x69];

export function krcDecrypt(encrypted: Uint8Array): Uint8Array {
  const result = new Uint8Array(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    result[i] = encrypted[i] ^ KRC_KEY[i % KRC_KEY.length];
  }
  return result;
}
