import type {
  Account,
  AccountCheckResponse,
  CheckNameResponse,
  Competition,
  CompetitionWithCount,
  CompetitionDetail,
  CompetitionHole,
  DashboardData,
  EvidenceImage,
  EvidenceImageWithRelations,
  RepresentativeWithAccount,
  FriendWithAccount,
  RepresentativeStatus,
  PendingRepRequest,
} from "@/types";

let API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || (window as any).__APP_CONFIG__?.API_BASE_URL || "").replace(/\/$/, "");

if (API_BASE_URL && !/^https?:\/\//.test(API_BASE_URL)) {
  API_BASE_URL = `https://${API_BASE_URL}`;
}

if (!API_BASE_URL) {
  console.warn(
    "VITE_API_BASE_URL が未設定です。バックエンドのAPI URLを環境変数 VITE_API_BASE_URL に設定してください。",
  );
}

export class ApiError extends Error {
  status: number;
  suggestions?: string[];

  constructor(message: string, status: number, suggestions?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.suggestions = suggestions;
  }
}

function buildHeaders(deviceId: string, extra?: Record<string, string>): HeadersInit {
  return {
    "X-Device-Id": deviceId,
    ...extra,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    let message = `APIエラー (${res.status})`;
    let suggestions: string[] | undefined;
    if (contentType.includes("application/json")) {
      try {
        const body = await res.json();
        if (body.detail) message = typeof body.detail === "string" ? body.detail : message;
        if (body.error) message = body.error;
        if (body.suggestions) suggestions = body.suggestions;
      } catch {
        // ignore JSON parse error
      }
    } else {
      const rawText = await res.text().catch(() => "");
      message = `APIエラー (${res.status}): ${rawText || res.statusText || "サーバーエラーが発生しました。"}`;
    }
    throw new ApiError(message, res.status, suggestions);
  }

  if (contentType.includes("text/html")) {
    throw new ApiError(
      `API接続エラー (${res.status}): 予想外のHTMLレスポンスを受信しました。バックエンドのURL（${API_BASE_URL}）が正しいか確認してください。`,
      res.status,
    );
  }

  try {
    return (await res.json()) as T;
  } catch {
    const rawText = await res.text().catch(() => "");
    throw new ApiError(
      `APIレスポンス解析エラー (${res.status}): ${rawText || "JSON以外のデータが返却されました。"}`,
      res.status,
    );
  }
}

async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(url, options);
    return res;
  } catch (error) {
    console.error(`Fetch failed for URL: ${url}`, error);
    const details = error instanceof Error ? error.message : String(error);
    throw new ApiError(
      `サーバーに接続できませんでした。ネットワーク環境または CORS 設定を確認してください。(詳細: ${details})`,
      0,
    );
  }
}

// ============================================
// Account APIs
// ============================================

export async function checkAccount(deviceId: string): Promise<AccountCheckResponse> {
  const res = await safeFetch(`${API_BASE_URL}/api/v1/account/check`, {
    headers: buildHeaders(deviceId),
  });
  return handleResponse<AccountCheckResponse>(res);
}

export async function checkAccountName(
  deviceId: string,
  accountName: string,
): Promise<CheckNameResponse> {
  const res = await safeFetch(`${API_BASE_URL}/api/v1/account/check-name`, {
    method: "POST",
    headers: buildHeaders(deviceId, { "Content-Type": "application/json" }),
    body: JSON.stringify({ account_name: accountName }),
  });
  return handleResponse<CheckNameResponse>(res);
}

export async function registerAccount(
  deviceId: string,
  accountName: string,
): Promise<{ message: string; account: Account }> {
  const res = await safeFetch(`${API_BASE_URL}/api/v1/account/register`, {
    method: "POST",
    headers: buildHeaders(deviceId, { "Content-Type": "application/json" }),
    body: JSON.stringify({ account_name: accountName }),
  });
  return handleResponse(res);
}

export async function getAccount(deviceId: string): Promise<{ account: Account }> {
  const res = await safeFetch(`${API_BASE_URL}/api/v1/account`, {
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

export async function updateAccount(
  deviceId: string,
  accountName: string,
): Promise<{ message: string; account: Account }> {
  const res = await safeFetch(`${API_BASE_URL}/api/v1/account`, {
    method: "PUT",
    headers: buildHeaders(deviceId, { "Content-Type": "application/json" }),
    body: JSON.stringify({ account_name: accountName }),
  });
  return handleResponse(res);
}

// ============================================
// Dashboard API
// ============================================

export async function getDashboard(deviceId: string): Promise<DashboardData> {
  const res = await safeFetch(`${API_BASE_URL}/api/v1/dashboard`, {
    headers: buildHeaders(deviceId),
  });
  return handleResponse<DashboardData>(res);
}

// ============================================
// Competition APIs
// ============================================

export async function getCompetitions(
  deviceId: string,
  status?: string,
): Promise<{ competitions: CompetitionWithCount[]; represented: CompetitionWithCount[] }> {
  const url = new URL(`${API_BASE_URL}/api/v1/competitions`);
  if (status) url.searchParams.set("status", status);
  const res = await safeFetch(url.toString(), {
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

export async function getCompetitionDetail(
  deviceId: string,
  id: string,
): Promise<{ competition: Competition; evidenceImages: EvidenceImageWithRelations[] }> {
  const res = await safeFetch(`${API_BASE_URL}/api/v1/competitions/${id}`, {
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

export async function getCompetitionFull(
  deviceId: string,
  id: string,
): Promise<{ competition: Competition; holes: CompetitionHole[] }> {
  const res = await safeFetch(`${API_BASE_URL}/api/v1/competitions/${id}/full`, {
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

export async function createCompetition(
  deviceId: string,
  data: { name: string; date: string; course_name?: string; holes?: { hole_number: number; award_type: string }[] },
): Promise<{ message: string; competition: Competition }> {
  const res = await safeFetch(`${API_BASE_URL}/api/v1/competitions`, {
    method: "POST",
    headers: buildHeaders(deviceId, { "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateCompetition(
  deviceId: string,
  id: string,
  data: { name?: string; date?: string; course_name?: string; status?: string; holes?: { hole_number: number; award_type: string }[] },
): Promise<{ message: string; competition: Competition }> {
  const res = await safeFetch(`${API_BASE_URL}/api/v1/competitions/${id}`, {
    method: "PUT",
    headers: buildHeaders(deviceId, { "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteCompetition(
  deviceId: string,
  id: string,
): Promise<{ message: string }> {
  const res = await safeFetch(`${API_BASE_URL}/api/v1/competitions/${id}`, {
    method: "DELETE",
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

// ============================================
// Representative APIs
// ============================================

export async function getRepresentatives(
  deviceId: string,
  competitionId: string,
): Promise<{ representatives: RepresentativeWithAccount[] }> {
  const res = await safeFetch(
    `${API_BASE_URL}/api/v1/competitions/${competitionId}/representatives`,
    { headers: buildHeaders(deviceId) },
  );
  return handleResponse(res);
}

export async function requestRepresentative(
  deviceId: string,
  competitionId: string,
  targetDeviceId: string,
): Promise<{ message: string }> {
  const res = await safeFetch(
    `${API_BASE_URL}/api/v1/competitions/${competitionId}/representatives/request`,
    {
      method: "POST",
      headers: buildHeaders(deviceId, { "Content-Type": "application/json" }),
      body: JSON.stringify({ target_device_id: targetDeviceId }),
    },
  );
  return handleResponse(res);
}

export async function updateRepresentativeStatus(
  deviceId: string,
  repId: string,
  status: RepresentativeStatus,
): Promise<{ message: string }> {
  const res = await safeFetch(`${API_BASE_URL}/api/v1/representatives/${repId}`, {
    method: "PUT",
    headers: buildHeaders(deviceId, { "Content-Type": "application/json" }),
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}

export async function getPendingRequests(
  deviceId: string,
): Promise<{ requests: PendingRepRequest[] }> {
  const res = await safeFetch(`${API_BASE_URL}/api/v1/representatives/pending`, {
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

// ============================================
// Friend APIs
// ============================================

export async function getFriends(
  deviceId: string,
): Promise<{ friends: FriendWithAccount[] }> {
  const res = await safeFetch(`${API_BASE_URL}/api/v1/friends`, {
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

export async function searchAccounts(
  deviceId: string,
  query: string,
): Promise<{ accounts: { device_id: string; account_name: string }[] }> {
  const url = new URL(`${API_BASE_URL}/api/v1/accounts/search`);
  url.searchParams.set("q", query);
  const res = await safeFetch(url.toString(), {
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

// ============================================
// Evidence Image APIs
// ============================================

export async function getEvidenceImages(
  deviceId: string,
  filters?: { competition_id?: string; award_type?: string },
): Promise<{ evidenceImages: EvidenceImageWithRelations[] }> {
  const url = new URL(`${API_BASE_URL}/api/v1/evidence`);
  if (filters?.competition_id) url.searchParams.set("competition_id", filters.competition_id);
  if (filters?.award_type) url.searchParams.set("award_type", filters.award_type);
  const res = await safeFetch(url.toString(), {
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

export async function getEvidenceDetail(
  deviceId: string,
  id: string,
): Promise<{ evidenceImage: EvidenceImageWithRelations }> {
  const res = await safeFetch(`${API_BASE_URL}/api/v1/evidence/${id}`, {
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
    image: File;
  },
): Promise<{ message: string; evidenceImage: EvidenceImage }> {
  const formData = new FormData();
  formData.append("competition_id", data.competition_id);
  formData.append("award_type", data.award_type);
  if (data.hole_number !== undefined) formData.append("hole_number", String(data.hole_number));
  if (data.distance !== undefined) formData.append("distance", String(data.distance));
  if (data.memo) formData.append("memo", data.memo);
  formData.append("image", data.image);

  const res = await safeFetch(`${API_BASE_URL}/api/v1/evidence`, {
    method: "POST",
    headers: buildHeaders(deviceId),
    body: formData,
  });
  return handleResponse(res);
}

export async function deleteEvidence(
  deviceId: string,
  id: string,
): Promise<{ message: string }> {
  const res = await safeFetch(`${API_BASE_URL}/api/v1/evidence/${id}`, {
    method: "DELETE",
    headers: buildHeaders(deviceId),
  });
  return handleResponse(res);
}

// ============================================
// QR Code Data API
// ============================================

export interface QRCodeData {
  competition: Competition;
  holes: CompetitionHole[];
  representatives: RepresentativeWithAccount[];
}

export async function getQRCodeData(
  deviceId: string,
  competitionId: string,
): Promise<QRCodeData> {
  const res = await safeFetch(
    `${API_BASE_URL}/api/v1/competitions/${competitionId}/qr-data`,
    { headers: buildHeaders(deviceId) },
  );
  return handleResponse<QRCodeData>(res);
}

// ============================================
// Device Transfer APIs
// ============================================

export async function issueTransferCode(
  deviceId: string,
): Promise<{ code: string; expiresAt: string }> {
  const res = await safeFetch(`${API_BASE_URL}/api/v1/device-transfer/issue`, {
    method: "POST",
    headers: buildHeaders(deviceId, { "Content-Type": "application/json" }),
  });
  const data = await handleResponse<{ code: string; expiresAt: string }>(res);
  return { code: data.code, expiresAt: data.expiresAt };
}

export async function executeTransfer(
  deviceId: string,
  code: string,
): Promise<{ message: string }> {
  const res = await safeFetch(`${API_BASE_URL}/api/v1/device-transfer/execute`, {
    method: "POST",
    headers: buildHeaders(deviceId, { "Content-Type": "application/json" }),
    body: JSON.stringify({ code }),
  });
  return handleResponse<{ message: string }>(res);
}

// ============================================
// Evidence Images by Competition (all users)
// ============================================

export async function getEvidenceByCompetition(
  deviceId: string,
  competitionId: string,
): Promise<{ evidenceImages: EvidenceImageWithRelations[] }> {
  const res = await safeFetch(
    `${API_BASE_URL}/api/v1/competitions/${competitionId}/evidence`,
    { headers: buildHeaders(deviceId) },
  );
  return handleResponse(res);
}

// ============================================
// Representative Check API
// ============================================

export async function checkRepresentative(
  deviceId: string,
  competitionId: string,
): Promise<{ isRepresentative: boolean; isOwner: boolean }> {
  const res = await safeFetch(
    `${API_BASE_URL}/api/v1/competitions/${competitionId}/rep-check`,
    { headers: buildHeaders(deviceId) },
  );
  return handleResponse(res);
}
