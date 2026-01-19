export function getStoredToken(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn('localStorage blocked, running without saved credentials');
    return null;
  }
}

export function storeToken(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('localStorage blocked, cannot save credentials');
  }
}
