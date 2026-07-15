export function zlibInflate(hexData: string): string {
  return __go_zlib_inflate(hexData);
}

export function rawInflate(hexData: string): string {
  return __go_raw_inflate(hexData);
}

export function hexFromBytes(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function utf8FromHex(hex: string): string {
  return __go_buffer_to_string(hex, 'utf-8');
}

export function hexFromString(str: string): string {
  return __go_buffer_from(str, 'utf-8');
}

export function bytesFromHex(hex: string): Uint8Array {
  const result = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    result[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return result;
}
