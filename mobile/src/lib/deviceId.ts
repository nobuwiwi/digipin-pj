import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'golf_evidence_device_id';

export function getApiBaseUrl(): string {
  return Constants.expoConfig?.extra?.apiBaseUrl ?? 'http://localhost:8000';
}

export async function getDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
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
