import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'golf_evidence_device_id';

const DEFAULT_PRODUCTION_API_URL = 'https://digipin-pj-production.up.railway.app';
const DEFAULT_PRODUCTION_WEB_URL = 'https://frontend-production-0a2c7.up.railway.app';

export function getApiBaseUrl(): string {
  const manifest =
    Constants.expoConfig ??
    (Constants as any).manifest ??
    (Constants as any).manifest2?.extra?.expoClient;
  const url = manifest?.extra?.apiBaseUrl;

  if (!__DEV__ && (!url || url.includes('localhost') || url.includes('127.0.0.1'))) {
    return DEFAULT_PRODUCTION_API_URL;
  }

  return url ?? DEFAULT_PRODUCTION_API_URL;
}

export function getWebBaseUrl(): string {
  const manifest =
    Constants.expoConfig ??
    (Constants as any).manifest ??
    (Constants as any).manifest2?.extra?.expoClient;
  const url = manifest?.extra?.webBaseUrl;

  if (!__DEV__ && (!url || url.includes('localhost') || url.includes('127.0.0.1'))) {
    return DEFAULT_PRODUCTION_WEB_URL;
  }

  return url ?? DEFAULT_PRODUCTION_WEB_URL;
}

export async function getDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export async function setStoredDeviceId(id: string): Promise<void> {
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
}

export async function resetDeviceId(): Promise<string> {
  const id = generateUUID();
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

function generateUUID(): string {
  // Simple UUID v4 generator (no crypto.randomUUID in older RN)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
