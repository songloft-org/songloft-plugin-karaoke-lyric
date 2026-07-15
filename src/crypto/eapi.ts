const EAPI_KEY = 'e82ckenh8dichen8';

export function eapiParamsEncrypt(path: string, params: Record<string, any>): string {
  const apiPath = path.replace('/eapi/', '/api/');
  const paramsStr = JSON.stringify(params);
  const sign = __go_crypto_md5(`nobody${apiPath}use${paramsStr}md5forencrypt`);
  const fullText = `${apiPath}-36cd479b6b5-${paramsStr}-36cd479b6b5-${sign}`;
  const hex = __go_buffer_from(fullText, 'utf-8');
  const keyHex = __go_buffer_from(EAPI_KEY, 'utf-8');
  const encrypted = __go_crypto_aes_encrypt(hex, 'ecb', keyHex, '');
  return encrypted.toLowerCase();
}

export function eapiResponseDecrypt(encHex: string): string {
  const keyHex = __go_buffer_from(EAPI_KEY, 'utf-8');
  const decrypted = __go_crypto_aes_decrypt(encHex, 'ecb', keyHex, '');
  return __go_buffer_to_string(decrypted, 'utf-8');
}
