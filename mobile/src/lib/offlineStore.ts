import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OfflineEvidenceItem {
  id: string;
  competition_id: string;
  award_type: string;
  hole_number?: number;
  distance?: number;
  memo?: string;
  imageUri: string;
  created_at: string;
  reps?: string[];
}

const OFFLINE_EVIDENCE_QUEUE_KEY = 'golf_evidence_offline_queue_v1';

export async function getOfflineEvidenceQueue(): Promise<OfflineEvidenceItem[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_EVIDENCE_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OfflineEvidenceItem[];
  } catch (err) {
    console.error('Failed to load offline queue:', err);
    return [];
  }
}

export async function addOfflineEvidence(
  item: Omit<OfflineEvidenceItem, 'id' | 'created_at'>,
): Promise<OfflineEvidenceItem> {
  const queue = await getOfflineEvidenceQueue();
  const newItem: OfflineEvidenceItem = {
    ...item,
    id: 'off_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
    created_at: new Date().toISOString(),
  };
  const updatedQueue = [newItem, ...queue];
  await AsyncStorage.setItem(OFFLINE_EVIDENCE_QUEUE_KEY, JSON.stringify(updatedQueue));
  return newItem;
}

export async function removeOfflineEvidence(id: string): Promise<void> {
  const queue = await getOfflineEvidenceQueue();
  const updatedQueue = queue.filter((i) => i.id !== id);
  await AsyncStorage.setItem(OFFLINE_EVIDENCE_QUEUE_KEY, JSON.stringify(updatedQueue));
}

export async function clearOfflineEvidenceQueue(): Promise<void> {
  await AsyncStorage.removeItem(OFFLINE_EVIDENCE_QUEUE_KEY);
}
