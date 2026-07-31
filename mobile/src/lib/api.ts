import { getApiBaseUrl } from './deviceId';
import type {
  Account,
  AccountCheckResponse,
  CheckNameResponse,
  Competition,
  CompetitionWithCount,
  CompetitionHole,
  DashboardData,
  EvidenceImage,
  EvidenceImageWithRelations,
  RepresentativeWithAccount,
  FriendWithAccount,
  RepresentativeStatus,
  PendingRepRequest,
  QRCodeData,
} from '@/types';

const BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
  status: number;
  suggestions?: string[];

  constructor(message: string, status: number, suggestions?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.suggestions = suggestions;
  }
}

function buildHeaders(deviceId: string, extra?: Record<string, string>): Record<string, string> {
  return {
    'X-Device-Id': deviceId,
    ...extra,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `APIエラー (${res.status})`;
    let suggestions: string[] | undefined;
    try {
      const body = await res.json();
      if (body.detail) message = body.detail;
      else if (body.error) message = body.error;
      if (body.suggestions) suggestions = body.suggestions;
    } catch {
      // ignore
    }
    throw new ApiError(message, res.status, suggestions);
  }
  return (await res.json()) as T;
}

async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch {
    throw new ApiError('サーバーに接続できませんでした。ネットワーク環境を確認してください。', 0);
  }
}

// Account APIs

export async function checkAccount(deviceId: string): Promise<AccountCheckResponse> {
  const res = await safeFetch(`${BASE_URL}/api/v1/account/check`, {
    headers: buildHeaders(deviceId),
  });
  return handleResponse<AccountCheckResponse>(res);
}

export async function checkAccountName(deviceId: string, accountName: string): Promise<CheckNameResponse> {
  const res = await safeFetch(`${BASE_URL}/api/v1/account/check-name`, {
    method: 'POST',
    headers: buildHeaders(deviceId, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ account_name: accountName }),
  });
  return handleResponse<CheckNameResponse>(res);
}

export async function registerAccount(deviceId: string, accountName: string): Promise<{ message: string; account: Account }> {
  const res = await safeFetch(`${BASE_URL}/api/v1/account/register`, {
    method: 'POST',
    headers: buildHeaders(deviceId, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ account_name: accountName }),
  });
  return handleResponse(res);
}

export async function getAccount(deviceId: string): Promise<{ account: Account }> {
  const res = await safeFetch(`${BASE_URL}/api/v1/account`, {
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

export async function updateAccount(deviceId: string, accountName: string): Promise<{ message: string; account: Account }> {
  const res = await safeFetch(`${BASE_URL}/api/v1/account`, {
    method: 'PUT',
    headers: buildHeaders(deviceId, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ account_name: accountName }),
  });
  return handleResponse(res);
}

// Dashboard API

export async function getDashboard(deviceId: string): Promise<DashboardData> {
  const res = await safeFetch(`${BASE_URL}/api/v1/dashboard`, {
    headers: buildHeaders(deviceId),
  });
  return handleResponse<DashboardData>(res);
}

// Competition APIs

export async function getCompetitions(
  deviceId: string,
  status?: string,
): Promise<{ competitions: CompetitionWithCount[]; represented: CompetitionWithCount[] }> {
  const url = new URL(`${BASE_URL}/api/v1/competitions`);
  if (status) url.searchParams.set('status', status);
  const res = await safeFetch(url.toString(), {
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

export async function getCompetitionDetail(
  deviceId: string,
  id: string,
): Promise<{ competition: Competition; evidenceImages: EvidenceImageWithRelations[] }> {
  const res = await safeFetch(`${BASE_URL}/api/v1/competitions/${id}`, {
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

export async function getCompetitionFull(
  deviceId: string,
  id: string,
): Promise<{ competition: Competition; holes: CompetitionHole[] }> {
  const res = await safeFetch(`${BASE_URL}/api/v1/competitions/${id}/full`, {
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

export async function createCompetition(
  deviceId: string,
  data: { name: string; date: string; course_name?: string; holes?: { hole_number: number; award_type: string }[] },
): Promise<{ message: string; competition: Competition }> {
  const res = await safeFetch(`${BASE_URL}/api/v1/competitions`, {
    method: 'POST',
    headers: buildHeaders(deviceId, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateCompetition(
  deviceId: string,
  id: string,
  data: { name?: string; date?: string; course_name?: string; status?: string; holes?: { hole_number: number; award_type: string }[] },
): Promise<{ message: string }> {
  const res = await safeFetch(`${BASE_URL}/api/v1/competitions/${id}`, {
    method: 'PUT',
    headers: buildHeaders(deviceId, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteCompetition(deviceId: string, id: string): Promise<{ message: string }> {
  const res = await safeFetch(`${BASE_URL}/api/v1/competitions/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

// Representative APIs

export async function getRepresentatives(
  deviceId: string,
  competitionId: string,
): Promise<{ representatives: RepresentativeWithAccount[] }> {
  const res = await safeFetch(`${BASE_URL}/api/v1/competitions/${competitionId}/representatives`, {
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

export async function requestRepresentative(
  deviceId: string,
  competitionId: string,
  targetDeviceId: string,
): Promise<{ message: string }> {
  const res = await safeFetch(`${BASE_URL}/api/v1/competitions/${competitionId}/representatives/request`, {
    method: 'POST',
    headers: buildHeaders(deviceId, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ target_device_id: targetDeviceId }),
  });
  return handleResponse(res);
}

export async function updateRepresentativeStatus(
  deviceId: string,
  repId: string,
  status: RepresentativeStatus,
): Promise<{ message: string }> {
  const res = await safeFetch(`${BASE_URL}/api/v1/representatives/${repId}`, {
    method: 'PUT',
    headers: buildHeaders(deviceId, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}

export async function getPendingRequests(deviceId: string): Promise<{ requests: PendingRepRequest[] }> {
  const res = await safeFetch(`${BASE_URL}/api/v1/representatives/pending`, {
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

// Friend APIs

export async function getFriends(deviceId: string): Promise<{ friends: FriendWithAccount[] }> {
  const res = await safeFetch(`${BASE_URL}/api/v1/friends`, {
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

export async function searchAccounts(
  deviceId: string,
  query: string,
): Promise<{ accounts: { device_id: string; account_name: string }[] }> {
  const url = new URL(`${BASE_URL}/api/v1/accounts/search`);
  url.searchParams.set('q', query);
  const res = await safeFetch(url.toString(), {
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

// Evidence APIs

export async function getEvidenceImages(
  deviceId: string,
  filters?: { competition_id?: string; award_type?: string },
): Promise<{ evidenceImages: EvidenceImageWithRelations[] }> {
  const url = new URL(`${BASE_URL}/api/v1/evidence`);
  if (filters?.competition_id) url.searchParams.set('competition_id', filters.competition_id);
  if (filters?.award_type) url.searchParams.set('award_type', filters.award_type);
  const res = await safeFetch(url.toString(), {
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

export async function getEvidenceDetail(
  deviceId: string,
  id: string,
): Promise<{ evidenceImage: EvidenceImageWithRelations }> {
  const res = await safeFetch(`${BASE_URL}/api/v1/evidence/${id}`, {
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

export async function createEvidence(
  deviceId: string,
  data: {
    competition_id: string;
    award_type: string;
    hole_number?: number;
    distance?: number;
    memo?: string;
    imageUri: string;
    imageType?: string;
    imageFileName?: string;
  },
): Promise<{ message: string; evidenceImage: EvidenceImage }> {
  const formData = new FormData();
  formData.append('competition_id', data.competition_id);
  formData.append('award_type', data.award_type);
  if (data.hole_number !== undefined) formData.append('hole_number', String(data.hole_number));
  if (data.distance !== undefined) formData.append('distance', String(data.distance));
  if (data.memo) formData.append('memo', data.memo);

  const imageFile: any = {
    uri: data.imageUri,
    type: data.imageType || 'image/jpeg',
    name: data.imageFileName || 'photo.jpg',
  };
  formData.append('image', imageFile as any);

  const res = await safeFetch(`${BASE_URL}/api/v1/evidence`, {
    method: 'POST',
    headers: buildHeaders(deviceId),
    body: formData,
  });
  return handleResponse(res);
}

export async function deleteEvidence(deviceId: string, id: string): Promise<{ message: string }> {
  const res = await safeFetch(`${BASE_URL}/api/v1/evidence/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

// QR Code Data API

export async function getQRCodeData(deviceId: string, competitionId: string): Promise<QRCodeData> {
  const res = await safeFetch(`${BASE_URL}/api/v1/competitions/${competitionId}/qr-data`, {
    headers: buildHeaders(deviceId),
  });
  return handleResponse<QRCodeData>(res);
}

// Device Transfer APIs

export async function issueTransferCode(deviceId: string): Promise<{ code: string; expiresAt: string }> {
  const res = await safeFetch(`${BASE_URL}/api/v1/device-transfer/issue`, {
    method: 'POST',
    headers: buildHeaders(deviceId, { 'Content-Type': 'application/json' }),
  });
  return handleResponse(res);
}

export async function executeTransfer(deviceId: string, code: string): Promise<{ message: string }> {
  const res = await safeFetch(`${BASE_URL}/api/v1/device-transfer/execute`, {
    method: 'POST',
    headers: buildHeaders(deviceId, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ code }),
  });
  return handleResponse(res);
}

// Evidence by Competition (all users)

export async function getEvidenceByCompetition(
  deviceId: string,
  competitionId: string,
): Promise<{ evidenceImages: EvidenceImageWithRelations[] }> {
  const res = await safeFetch(`${BASE_URL}/api/v1/competitions/${competitionId}/evidence`, {
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

// Representative Check

export async function checkRepresentative(
  deviceId: string,
  competitionId: string,
): Promise<{ isRepresentative: boolean; isOwner: boolean }> {
  const res = await safeFetch(`${BASE_URL}/api/v1/competitions/${competitionId}/rep-check`, {
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}
