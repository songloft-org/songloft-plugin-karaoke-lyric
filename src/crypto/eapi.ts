const EAPI_KEY = 'e82ckenh8dichen8';

export function eapiParamsEncrypt(path: string, params: Record<string, any>): string {
  const text = `${path}-1-1-${JSON.stringify(params)}`;
  const md5 = __go_crypto_md5(text);
  const sign = md5.slice(0, 16);
  const fullPath = `${path}-1-1-${sign}-${JSON.stringify(params)}`;
  const hex = __go_buffer_from(fullPath, 'utf-8');
  const keyHex = __go_buffer_from(EAPI_KEY, 'utf-8');
  const encrypted = __go_crypto_aes_encrypt(hex, 'ecb', keyHex, '');
  return encrypted.toLowerCase();
}

export function eapiResponseDecrypt(encHex: string): string {
  const keyHex = __go_buffer_from(EAPI_KEY, 'utf-8');
  const decrypted = __go_crypto_aes_encrypt(encHex, 'ecb', keyHex, '');
  const raw = __go_buffer_to_string(decrypted, 'utf-8');
  const padLen = raw.charCodeAt(raw.length - 1);
  return raw.slice(0, raw.length - padLen);
}
