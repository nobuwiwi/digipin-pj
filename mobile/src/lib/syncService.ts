import { createEvidence, ApiError } from './api';
import { getOfflineEvidenceQueue, removeOfflineEvidence, type OfflineEvidenceItem } from './offlineStore';

export interface SyncResult {
  total: number;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

export async function syncOfflineEvidenceQueue(deviceId: string): Promise<SyncResult> {
  const queue = await getOfflineEvidenceQueue();
  if (queue.length === 0) {
    return { total: 0, syncedCount: 0, failedCount: 0, errors: [] };
  }

  let syncedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const item of queue) {
    try {
      await createEvidence(deviceId, {
        competition_id: item.competition_id,
        award_type: item.award_type,
        hole_number: item.hole_number,
        distance: item.distance,
        memo: item.memo,
        imageUri: item.imageUri,
      });

      // Successful sync -> remove from local storage queue
      await removeOfflineEvidence(item.id);
      syncedCount++;
    } catch (err) {
      failedCount++;
      const msg = err instanceof ApiError ? err.message : String(err);
      errors.push(`件名(${item.hole_number ? item.hole_number + 'H' : '未指定'}): ${msg}`);
    }
  }

  return {
    total: queue.length,
    syncedCount,
    failedCount,
    errors,
  };
}
