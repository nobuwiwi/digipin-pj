import {
  Hono,
  Context,
} from "npm:hono@4.6.14";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

// ============================================
// CORS headers (mandatory for Supabase Edge Functions)
// ============================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, X-Device-Id",
};

// ============================================
// Supabase client (service role for DB operations)
// ============================================
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ============================================
// Types
// ============================================
interface Account {
  device_id: string;
  account_name: string;
  created_at: string;
}

interface Competition {
  id: string;
  device_id: string;
  name: string;
  date: string;
  course_name: string | null;
  status: string;
  created_at: string;
}

interface EvidenceImage {
  id: string;
  competition_id: string;
  device_id: string;
  award_type: "drancon" | "nearpin";
  hole_number: number | null;
  distance: number | null;
  image_url: string;
  memo: string | null;
  created_at: string;
}

// ============================================
// Helpers
// ============================================
function getDeviceId(c: Context): string | null {
  const id = c.req.header("X-Device-Id");
  if (!id) return null;
  const trimmed = id.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
}

function jsonResponse(c: Context, data: unknown, status = 200) {
  return c.json(data, status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Client-Info, Apikey, X-Device-Id",
  });
}

function errorResponse(c: Context, message: string, status = 400) {
  return jsonResponse(c, { error: message }, status);
}

// Generate 3 alternative account name suggestions
function generateNameSuggestions(baseName: string): string[] {
  const suggestions: string[] = [];
  const suffixes = ["_golf", "_player", "_golfer"];
  for (const suffix of suffixes) {
    suggestions.push(`${baseName}${suffix}`);
  }
  // Also add random number variants
  for (let i = 0; i < 2; i++) {
    const num = Math.floor(Math.random() * 1000);
    suggestions.push(`${baseName}${num}`);
  }
  // Return unique 3
  return Array.from(new Set(suggestions)).slice(0, 3);
}

// ============================================
// Hono app
// ============================================
const app = new Hono();

// CORS preflight
app.options("*", (c) => {
  return new Response(null, { status: 200, headers: corsHeaders });
});

// ============================================
// 1. 登録確認API  GET /api/v1/account/check
//    X-Device-Id ヘッダーから端末IDを受け取り、登録状態を返す
// ============================================
app.get("/api/v1/account/check", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) {
    return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);
  }

  const { data, error } = await supabase
    .from("accounts")
    .select("device_id, account_name, created_at")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (error) {
    return errorResponse(c, "データベースエラーが発生しました", 500);
  }

  if (!data) {
    return jsonResponse(c, { registered: false });
  }

  return jsonResponse(c, {
    registered: true,
    account: data as Account,
  });
});

// ============================================
// 2. 重複チェックAPI  POST /api/v1/account/check-name
//    body: { account_name: string }
//    戻り値: { available: boolean, suggestions?: string[] }
// ============================================
app.post("/api/v1/account/check-name", async (c) => {
  let body: { account_name?: string };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, "リクエストボディが不正です", 400);
  }

  const accountName = body.account_name?.trim();
  if (!accountName) {
    return errorResponse(c, "アカウント名が必要です", 400);
  }

  if (accountName.length < 2) {
    return errorResponse(c, "アカウント名は2文字以上で入力してください", 400);
  }

  if (accountName.length > 30) {
    return errorResponse(c, "アカウント名は30文字以内で入力してください", 400);
  }

  const { data, error } = await supabase
    .from("accounts")
    .select("account_name")
    .eq("account_name", accountName)
    .maybeSingle();

  if (error) {
    return errorResponse(c, "データベースエラーが発生しました", 500);
  }

  if (data) {
    // Name already exists - generate suggestions
    const suggestions = generateNameSuggestions(accountName);
    return jsonResponse(c, {
      available: false,
      message: "このアカウント名は既に使用されています",
      suggestions,
    });
  }

  return jsonResponse(c, {
    available: true,
    message: "このアカウント名は使用可能です",
  });
});

// ============================================
// 3. アカウント登録API  POST /api/v1/account/register
//    X-Device-Id ヘッダー + body: { account_name: string }
// ============================================
app.post("/api/v1/account/register", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) {
    return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);
  }

  let body: { account_name?: string };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, "リクエストボディが不正です", 400);
  }

  const accountName = body.account_name?.trim();
  if (!accountName) {
    return errorResponse(c, "アカウント名が必要です", 400);
  }

  if (accountName.length < 2 || accountName.length > 30) {
    return errorResponse(c, "アカウント名は2〜30文字で入力してください", 400);
  }

  // Check if device already registered
  const { data: existing } = await supabase
    .from("accounts")
    .select("device_id, account_name")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (existing) {
    return errorResponse(c, "この端末は既に登録されています", 409);
  }

  // Check name uniqueness again (race condition guard)
  const { data: nameConflict } = await supabase
    .from("accounts")
    .select("account_name")
    .eq("account_name", accountName)
    .maybeSingle();

  if (nameConflict) {
    const suggestions = generateNameSuggestions(accountName);
    return jsonResponse(
      c,
      {
        error: "このアカウント名は既に使用されています",
        suggestions,
      },
      409,
    );
  }

  // Insert new account
  const { data: inserted, error: insertError } = await supabase
    .from("accounts")
    .insert({
      device_id: deviceId,
      account_name: accountName,
    })
    .select("device_id, account_name, created_at")
    .single();

  if (insertError) {
    return errorResponse(c, "アカウント登録に失敗しました", 500);
  }

  return jsonResponse(c, {
    message: "アカウント登録が完了しました",
    account: inserted as Account,
  }, 201);
});

// ============================================
// 4. アカウント情報取得API  GET /api/v1/account
//    X-Device-Id ヘッダーから登録済みアカウント情報を取得
// ============================================
app.get("/api/v1/account", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) {
    return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);
  }

  const { data, error } = await supabase
    .from("accounts")
    .select("device_id, account_name, created_at")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (error) {
    return errorResponse(c, "データベースエラーが発生しました", 500);
  }

  if (!data) {
    return errorResponse(c, "アカウントが見つかりません", 404);
  }

  return jsonResponse(c, { account: data as Account });
});

// ============================================
// 5. アカウント名更新API  PUT /api/v1/account
//    X-Device-Id + body: { account_name: string }
// ============================================
app.put("/api/v1/account", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) {
    return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);
  }

  let body: { account_name?: string };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, "リクエストボディが不正です", 400);
  }

  const accountName = body.account_name?.trim();
  if (!accountName) {
    return errorResponse(c, "アカウント名が必要です", 400);
  }

  if (accountName.length < 2 || accountName.length > 30) {
    return errorResponse(c, "アカウント名は2〜30文字で入力してください", 400);
  }

  // Check name uniqueness (exclude self)
  const { data: nameConflict } = await supabase
    .from("accounts")
    .select("account_name")
    .eq("account_name", accountName)
    .neq("device_id", deviceId)
    .maybeSingle();

  if (nameConflict) {
    const suggestions = generateNameSuggestions(accountName);
    return jsonResponse(
      c,
      {
        error: "このアカウント名は既に使用されています",
        suggestions,
      },
      409,
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("accounts")
    .update({ account_name: accountName })
    .eq("device_id", deviceId)
    .select("device_id, account_name, created_at")
    .single();

  if (updateError) {
    return errorResponse(c, "アカウント更新に失敗しました", 500);
  }

  return jsonResponse(c, {
    message: "アカウント名を更新しました",
    account: updated as Account,
  });
});

// ============================================
// 8. コンペ詳細取得API  GET /api/v1/competitions/:id
// ============================================
app.get("/api/v1/competitions/:id", async (c) => {
  const compId = c.req.param("id");

  const { data: comp, error: compError } = await supabase
    .from("competitions")
    .select("id, device_id, name, date, course_name, status, created_at")
    .eq("id", compId)
    .maybeSingle();

  if (compError || !comp) {
    return errorResponse(c, "コンペが見つかりません", 404);
  }

  // Get evidence images for this competition
  const { data: images, error: imgError } = await supabase
    .from("evidence_images")
    .select(`
      id, competition_id, device_id, award_type, hole_number, distance, image_url, memo, created_at,
      accounts:device_id ( account_name )
    `)
    .eq("competition_id", compId)
    .order("created_at", { ascending: false });

  if (imgError) {
    return errorResponse(c, "データベースエラーが発生しました", 500);
  }

  return jsonResponse(c, {
    competition: comp as Competition,
    evidenceImages: images ?? [],
  });
});

// ============================================
// 11. コンペ削除API  DELETE /api/v1/competitions/:id
// ============================================
app.delete("/api/v1/competitions/:id", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) {
    return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);
  }

  const compId = c.req.param("id");

  // Verify ownership
  const { data: comp } = await supabase
    .from("competitions")
    .select("device_id")
    .eq("id", compId)
    .maybeSingle();

  if (!comp) {
    return errorResponse(c, "コンペが見つかりません", 404);
  }

  if (comp.device_id !== deviceId) {
    return errorResponse(c, "このコンペを削除する権限がありません", 403);
  }

  // Get evidence images to delete from storage
  const { data: images } = await supabase
    .from("evidence_images")
    .select("image_url")
    .eq("competition_id", compId);

  // Delete image files from storage
  if (images && images.length > 0) {
    const paths = images
      .map((img: { image_url: string }) => {
        try {
          const url = new URL(img.image_url);
          const parts = url.pathname.split("/");
          const idx = parts.indexOf("evidence-images");
          if (idx >= 0 && idx + 1 < parts.length) {
            return parts.slice(idx + 1).join("/");
          }
          return null;
        } catch {
          return null;
        }
      })
      .filter((p): p is string => p !== null);

    if (paths.length > 0) {
      await supabase.storage.from("evidence-images").remove(paths);
    }
  }

  const { error: deleteError } = await supabase
    .from("competitions")
    .delete()
    .eq("id", compId);

  if (deleteError) {
    return errorResponse(c, "コンペの削除に失敗しました", 500);
  }

  return jsonResponse(c, { message: "コンペを削除しました" });
});

// ============================================
// 12. 証拠画像一覧取得API  GET /api/v1/evidence
//     query: competition_id?, award_type?
// ============================================
app.get("/api/v1/evidence", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) {
    return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);
  }

  const competitionId = c.req.query("competition_id");
  const awardType = c.req.query("award_type");

  let query = supabase
    .from("evidence_images")
    .select(`
      id, competition_id, device_id, award_type, hole_number, distance, image_url, memo, created_at,
      competitions:competition_id ( name, date, course_name ),
      accounts:device_id ( account_name )
    `)
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });

  if (competitionId) {
    query = query.eq("competition_id", competitionId);
  }
  if (awardType) {
    query = query.eq("award_type", awardType);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(c, "データベースエラーが発生しました", 500);
  }

  return jsonResponse(c, { evidenceImages: data ?? [] });
});

// ============================================
// 13. 証拠画像登録API  POST /api/v1/evidence
//     X-Device-Id + body: { competition_id, award_type, hole_number?, distance?, memo? }
//     multipart/form-data: image file (field name "image")
// ============================================
app.post("/api/v1/evidence", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) {
    return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);
  }

  const contentType = c.req.header("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return errorResponse(c, "multipart/form-data で送信してください", 400);
  }

  const formData = await c.req.formData();

  const competitionId = formData.get("competition_id") as string | null;
  const awardType = formData.get("award_type") as string | null;
  const holeNumberStr = formData.get("hole_number") as string | null;
  const distanceStr = formData.get("distance") as string | null;
  const memo = (formData.get("memo") as string | null) || null;
  const imageFile = formData.get("image") as File | null;

  if (!competitionId) {
    return errorResponse(c, "コンペIDが必要です", 400);
  }
  if (!awardType || !["drancon", "nearpin"].includes(awardType)) {
    return errorResponse(c, "賞の種類は drancon または nearpin で指定してください", 400);
  }
  if (!imageFile) {
    return errorResponse(c, "画像ファイルが必要です", 400);
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (imageFile.size > MAX_FILE_SIZE) {
    return errorResponse(c, "画像ファイルサイズが大きすぎます（10MB以下にしてください）", 400);
  }

  // Verify account
  const { data: account } = await supabase
    .from("accounts")
    .select("device_id")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (!account) {
    return errorResponse(c, "アカウントが登録されていません", 403);
  }

  // Verify competition exists
  const { data: comp } = await supabase
    .from("competitions")
    .select("id")
    .eq("id", competitionId)
    .maybeSingle();

  if (!comp) {
    return errorResponse(c, "コンペが見つかりません", 404);
  }

  // Upload image to storage
  const fileExt = imageFile.name.split(".").pop() || "jpg";
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${deviceId}/${fileName}`;

  const arrayBuffer = await imageFile.arrayBuffer();
  const fileBytes = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("evidence-images")
    .upload(filePath, fileBytes, {
      contentType: imageFile.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    return errorResponse(c, "画像のアップロードに失敗しました", 500);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from("evidence-images")
    .getPublicUrl(filePath);

  const imageUrl = publicUrlData.publicUrl;

  // Insert evidence record
  const insertData: Record<string, unknown> = {
    competition_id: competitionId,
    device_id: deviceId,
    award_type: awardType,
    image_url: imageUrl,
    memo,
  };

  if (holeNumberStr) {
    const hn = parseInt(holeNumberStr, 10);
    if (!isNaN(hn) && hn >= 1 && hn <= 36) {
      insertData.hole_number = hn;
    }
  }

  if (distanceStr) {
    const dist = parseFloat(distanceStr);
    if (!isNaN(dist) && dist >= 0) {
      insertData.distance = dist;
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("evidence_images")
    .insert(insertData)
    .select(`
      id, competition_id, device_id, award_type, hole_number, distance, image_url, memo, created_at
    `)
    .single();

  if (insertError) {
    // Rollback: delete uploaded image
    await supabase.storage.from("evidence-images").remove([filePath]);
    return errorResponse(c, "証拠画像の保存に失敗しました", 500);
  }

  return jsonResponse(c, {
    message: "証拠画像を登録しました",
    evidenceImage: inserted as EvidenceImage,
  }, 201);
});

// ============================================
// 14. 証拠画像削除API  DELETE /api/v1/evidence/:id
// ============================================
app.delete("/api/v1/evidence/:id", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) {
    return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);
  }

  const evidenceId = c.req.param("id");

  // Get evidence and verify ownership
  const { data: evidence } = await supabase
    .from("evidence_images")
    .select("id, device_id, image_url")
    .eq("id", evidenceId)
    .maybeSingle();

  if (!evidence) {
    return errorResponse(c, "証拠画像が見つかりません", 404);
  }

  if (evidence.device_id !== deviceId) {
    return errorResponse(c, "この証拠画像を削除する権限がありません", 403);
  }

  // Extract storage path from URL
  let storagePath: string | null = null;
  try {
    const url = new URL(evidence.image_url);
    const parts = url.pathname.split("/");
    const idx = parts.indexOf("evidence-images");
    if (idx >= 0 && idx + 1 < parts.length) {
      storagePath = parts.slice(idx + 1).join("/");
    }
  } catch {
    // ignore
  }

  // Delete from DB
  const { error: deleteError } = await supabase
    .from("evidence_images")
    .delete()
    .eq("id", evidenceId);

  if (deleteError) {
    return errorResponse(c, "証拠画像の削除に失敗しました", 500);
  }

  // Delete from storage
  if (storagePath) {
    await supabase.storage.from("evidence-images").remove([storagePath]);
  }

  return jsonResponse(c, { message: "証拠画像を削除しました" });
});

// ============================================
// 15. 証拠画像詳細取得API  GET /api/v1/evidence/:id
// ============================================
app.get("/api/v1/evidence/:id", async (c) => {
  const evidenceId = c.req.param("id");

  const { data, error } = await supabase
    .from("evidence_images")
    .select(`
      id, competition_id, device_id, award_type, hole_number, distance, image_url, memo, created_at,
      competitions:competition_id ( name, date, course_name ),
      accounts:device_id ( account_name )
    `)
    .eq("id", evidenceId)
    .maybeSingle();

  if (error || !data) {
    return errorResponse(c, "証拠画像が見つかりません", 404);
  }

  return jsonResponse(c, { evidenceImage: data });
});

// ============================================
// 16. コンペ作成API（拡張）  POST /api/v1/competitions
//     X-Device-Id + body: { name, date, course_name?, holes?: [{hole_number, award_type}] }
//     holes配列で18ホール分の賞設定を同時保存
// ============================================
app.post("/api/v1/competitions", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) {
    return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);
  }

  let body: { name?: string; date?: string; course_name?: string; holes?: { hole_number: number; award_type: string }[] };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, "リクエストボディが不正です", 400);
  }

  const name = body.name?.trim();
  const date = body.date?.trim();
  const courseName = body.course_name?.trim() || null;

  if (!name) return errorResponse(c, "コンペ名が必要です", 400);
  if (!date) return errorResponse(c, "開催日が必要です", 400);

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return errorResponse(c, "開催日の形式が不正です", 400);

  const { data: account } = await supabase
    .from("accounts")
    .select("device_id")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (!account) return errorResponse(c, "アカウントが登録されていません", 403);

  const { data: inserted, error: insertError } = await supabase
    .from("competitions")
    .insert({ device_id: deviceId, name, date, course_name: courseName, status: "active" })
    .select("id, device_id, name, date, course_name, status, created_at")
    .single();

  if (insertError) return errorResponse(c, "コンペの作成に失敗しました", 500);

  // Save hole settings if provided
  if (body.holes && Array.isArray(body.holes) && body.holes.length > 0) {
    const holeRows = body.holes
      .filter((h) => h.hole_number >= 1 && h.hole_number <= 18 && ["none", "drancon", "nearpin"].includes(h.award_type))
      .map((h) => ({
        competition_id: inserted.id,
        hole_number: h.hole_number,
        award_type: h.award_type,
      }));

    if (holeRows.length > 0) {
      const { error: holeError } = await supabase.from("competition_holes").insert(holeRows);
      if (holeError) {
        // Non-fatal: competition is created, holes failed
        console.error("Failed to save holes:", holeError.message);
      }
    }
  }

  return jsonResponse(c, { message: "コンペを作成しました", competition: inserted as Competition }, 201);
});

// ============================================
// 17. コンペ更新API（拡張）  PUT /api/v1/competitions/:id
//     body: { name?, date?, course_name?, status?, holes? }
//     holes配列でホール賞設定を更新（既存を削除→新規挿入）
// ============================================
app.put("/api/v1/competitions/:id", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);

  const compId = c.req.param("id");

  let body: { name?: string; date?: string; course_name?: string; status?: string; holes?: { hole_number: number; award_type: string }[] };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, "リクエストボディが不正です", 400);
  }

  const { data: comp } = await supabase
    .from("competitions")
    .select("device_id")
    .eq("id", compId)
    .maybeSingle();

  if (!comp) return errorResponse(c, "コンペが見つかりません", 404);
  if (comp.device_id !== deviceId) return errorResponse(c, "このコンペを編集する権限がありません", 403);

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.date !== undefined) updates.date = body.date;
  if (body.course_name !== undefined) updates.course_name = body.course_name.trim() || null;
  if (body.status !== undefined) {
    if (!["active", "completed"].includes(body.status)) return errorResponse(c, "status は active または completed で指定してください", 400);
    updates.status = body.status;
  }

  if (Object.keys(updates).length > 0) {
    const { data: updated, error: updateError } = await supabase
      .from("competitions")
      .update(updates)
      .eq("id", compId)
      .select("id, device_id, name, date, course_name, status, created_at")
      .single();
    if (updateError) return errorResponse(c, "コンペの更新に失敗しました", 500);
  }

  // Update holes if provided
  if (body.holes && Array.isArray(body.holes)) {
    // Delete existing holes
    await supabase.from("competition_holes").delete().eq("competition_id", compId);

    // Insert new holes (only non-none or all, depending on design — we save all 18)
    const holeRows = body.holes
      .filter((h) => h.hole_number >= 1 && h.hole_number <= 18 && ["none", "drancon", "nearpin"].includes(h.award_type))
      .map((h) => ({ competition_id: compId, hole_number: h.hole_number, award_type: h.award_type }));

    if (holeRows.length > 0) {
      const { error: holeError } = await supabase.from("competition_holes").insert(holeRows);
      if (holeError) console.error("Failed to update holes:", holeError.message);
    }
  }

  return jsonResponse(c, { message: "コンペを更新しました" });
});

// ============================================
// 18. コンペ詳細（ホール設定含む）  GET /api/v1/competitions/:id/full
// ============================================
app.get("/api/v1/competitions/:id/full", async (c) => {
  const compId = c.req.param("id");

  const { data: comp, error: compError } = await supabase
    .from("competitions")
    .select("id, device_id, name, date, course_name, status, created_at")
    .eq("id", compId)
    .maybeSingle();

  if (compError || !comp) return errorResponse(c, "コンペが見つかりません", 404);

  const { data: holes } = await supabase
    .from("competition_holes")
    .select("id, competition_id, hole_number, award_type")
    .eq("competition_id", compId)
    .order("hole_number", { ascending: true });

  return jsonResponse(c, { competition: comp as Competition, holes: holes ?? [] });
});

// ============================================
// 19. 代表者一覧取得  GET /api/v1/competitions/:id/representatives
// ============================================
app.get("/api/v1/competitions/:id/representatives", async (c) => {
  const compId = c.req.param("id");

  const { data, error } = await supabase
    .from("competition_representatives")
    .select(`
      id, competition_id, representative_id, status, created_at, updated_at,
      accounts:representative_id ( account_name )
    `)
    .eq("competition_id", compId)
    .order("created_at", { ascending: false });

  if (error) return errorResponse(c, "データベースエラーが発生しました", 500);

  return jsonResponse(c, { representatives: data ?? [] });
});

// ============================================
// 20. 代表者申請  POST /api/v1/competitions/:id/representatives/request
//     X-Device-Id が代表者として申請
// ============================================
app.post("/api/v1/competitions/:id/representatives/request", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);

  const compId = c.req.param("id");

  let body: { target_device_id?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    // body is optional
  }

  // The representative is the target device (the searched account),
  // not the requester's own device.
  const repDeviceId = body.target_device_id?.trim() || deviceId;

  // Verify competition exists
  const { data: comp } = await supabase
    .from("competitions")
    .select("id, device_id")
    .eq("id", compId)
    .maybeSingle();
  if (!comp) return errorResponse(c, "コンペが見つかりません", 404);

  // Can't request own competition as representative
  if (comp.device_id === repDeviceId) return errorResponse(c, "自分のコンペには代表者申請できません", 400);

  // Verify the target account exists
  const { data: targetAccount } = await supabase
    .from("accounts")
    .select("device_id")
    .eq("device_id", repDeviceId)
    .maybeSingle();
  if (!targetAccount) return errorResponse(c, "指定されたアカウントが見つかりません", 404);

  // Check existing request
  const { data: existing } = await supabase
    .from("competition_representatives")
    .select("id, status")
    .eq("competition_id", compId)
    .eq("representative_id", repDeviceId)
    .maybeSingle();

  if (existing) {
    if (existing.status === "approved") return errorResponse(c, "既に代表者として承認されています", 409);
    if (existing.status === "pending") return errorResponse(c, "既に代表者申請中です", 409);
    if (existing.status === "rejected") {
      // Update to pending
      const { error: updateErr } = await supabase
        .from("competition_representatives")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (updateErr) return errorResponse(c, "申請の更新に失敗しました", 500);
      return jsonResponse(c, { message: "代表者申請を再送信しました" });
    }
  }

  const { error: insertError } = await supabase
    .from("competition_representatives")
    .insert({ competition_id: compId, representative_id: repDeviceId, status: "pending" });

  if (insertError) return errorResponse(c, "代表者申請に失敗しました", 500);

  return jsonResponse(c, { message: "代表者申請を送信しました" }, 201);
});

// ============================================
// 21. 代表者ステータス更新  PUT /api/v1/representatives/:repId
//     body: { status: 'approved' | 'rejected' }
//     X-Device-Id はコンペ主催者（承認/拒否）または代表者（自己キャンセル）
// ============================================
app.put("/api/v1/representatives/:repId", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);

  const repId = c.req.param("repId");

  let body: { status: string };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, "リクエストボディが不正です", 400);
  }

  if (!["approved", "rejected", "pending"].includes(body.status)) {
    return errorResponse(c, "status は approved, rejected, または pending で指定してください", 400);
  }

  // Get the representative record with competition
  const { data: rep, error: repError } = await supabase
    .from("competition_representatives")
    .select(`
      id, competition_id, representative_id, status,
      competitions:competition_id ( device_id )
    `)
    .eq("id", repId)
    .maybeSingle();

  if (repError || !rep) return errorResponse(c, "代表者申請が見つかりません", 404);

  // Check authorization: the invited representative can approve/reject
  const comp = rep.competitions as unknown as { device_id: string };
  const isOwner = comp?.device_id === deviceId;
  const isSelf = rep.representative_id === deviceId;

  if (!isOwner && !isSelf) return errorResponse(c, "この操作を行う権限がありません", 403);

  // Only the invited representative can approve/reject
  if (body.status === "approved" || body.status === "rejected") {
    if (!isSelf) return errorResponse(c, "代表者本人のみ承認/拒否できます", 403);
  }

  const { error: updateError } = await supabase
    .from("competition_representatives")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("id", repId);

  if (updateError) return errorResponse(c, "ステータスの更新に失敗しました", 500);

  // If approved, create friendship between owner and representative
  if (body.status === "approved") {
    const ownerId = comp.device_id;
    const repId2 = rep.representative_id;

    // Check if friendship already exists (either direction)
    const { data: existingFriend } = await supabase
      .from("friendships")
      .select("id")
      .or(`and(eq.account_id,${ownerId},eq.friend_id,${repId2}),and(eq.account_id,${repId2},eq.friend_id,${ownerId})`)
      .maybeSingle();

    if (!existingFriend) {
      // Create bidirectional friendship
      await supabase.from("friendships").insert([
        { account_id: ownerId, friend_id: repId2 },
        { account_id: repId2, friend_id: ownerId },
      ]);
    }
  }

  return jsonResponse(c, { message: "ステータスを更新しました" });
});

// ============================================
// 22. 保留中の代表者申請取得  GET /api/v1/representatives/pending
//     X-Device-Id（代表者として招待された人）宛の保留中申請一覧
// ============================================
app.get("/api/v1/representatives/pending", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);

  // Get pending requests where this user is the invited representative
  const { data: pendingReps, error: repError } = await supabase
    .from("competition_representatives")
    .select(`
      id, competition_id, representative_id, status, created_at,
      competitions:competition_id ( name, device_id )
    `)
    .eq("representative_id", deviceId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (repError) return errorResponse(c, "データベースエラーが発生しました", 500);

  if (!pendingReps || pendingReps.length === 0) return jsonResponse(c, { requests: [] });

  // Fetch competition owner names
  const compIds = pendingReps.map((r: { competition_id: string }) => r.competition_id);
  const { data: compOwners } = await supabase
    .from("competitions")
    .select("id, name, device_id")
    .in("id", compIds);

  const compMap = new Map((compOwners ?? []).map((co: { id: string; name: string }) => [co.id, co.name]));
  const ownerIds = [...new Set((compOwners ?? []).map((co: { device_id: string }) => co.device_id))];

  const { data: ownerAccounts } = await supabase
    .from("accounts")
    .select("device_id, account_name")
    .in("device_id", ownerIds);

  const ownerNameMap = new Map((ownerAccounts ?? []).map((a: { device_id: string; account_name: string }) => [a.device_id, a.account_name]));

  const requests = pendingReps.map((r: {
    id: string;
    competition_id: string;
    representative_id: string;
    status: string;
    created_at: string;
    competitions: { name: string; device_id: string } | null;
  }) => ({
    id: r.id,
    competition_id: r.competition_id,
    competition_name: compMap.get(r.competition_id) ?? "",
    requester_id: r.competitions?.device_id ?? "",
    requester_name: ownerNameMap.get(r.competitions?.device_id ?? "") ?? "不明",
    status: r.status,
    created_at: r.created_at,
  }));

  return jsonResponse(c, { requests });
});

// ============================================
// 23. フレンド一覧取得  GET /api/v1/friends
// ============================================
app.get("/api/v1/friends", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);

  const { data, error } = await supabase
    .from("friendships")
    .select("friend_id, accounts:friend_id ( account_name )")
    .eq("account_id", deviceId)
    .order("created_at", { ascending: false });

  if (error) return errorResponse(c, "データベースエラーが発生しました", 500);

  const friends = (data ?? []).map((f: { friend_id: string; accounts: { account_name: string } | null }) => ({
    device_id: f.friend_id,
    account_name: f.accounts?.account_name ?? "不明",
  }));

  return jsonResponse(c, { friends });
});

// ============================================
// 24. アカウント検索  GET /api/v1/accounts/search?q=...
//     フレンド候補検索用（自分を除外）
// ============================================
app.get("/api/v1/accounts/search", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);

  const q = c.req.query("q")?.trim();
  console.log("search q:", JSON.stringify(q), "deviceId:", deviceId);
  if (!q || q.length < 1) return jsonResponse(c, { accounts: [] });

  const { data: allAccounts, error: fetchError } = await supabase
    .from("accounts")
    .select("device_id, account_name")
    .limit(1000);

  if (fetchError) return errorResponse(c, "データベースエラーが発生しました", 500);

  const lowerQ = q.toLowerCase();
  const data = (allAccounts ?? []).filter(
    (a: { device_id: string; account_name: string }) =>
      a.account_name.toLowerCase().includes(lowerQ) && a.device_id !== deviceId,
  );

  return jsonResponse(c, { accounts: data });
});

// ============================================
// 25. コンペ一覧取得（拡張）  GET /api/v1/competitions
//     主催コンペ + 代表コンペを分けて返す
// ============================================
app.get("/api/v1/competitions", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);

  const status = c.req.query("status");

  // Owned competitions
  let ownedQuery = supabase
    .from("competitions")
    .select(`
      id, device_id, name, date, course_name, status, created_at,
      evidence_images ( count )
    `)
    .eq("device_id", deviceId)
    .order("date", { ascending: false });
  if (status) ownedQuery = ownedQuery.eq("status", status);

  const { data: owned, error: ownedError } = await ownedQuery;
  if (ownedError) return errorResponse(c, "データベースエラーが発生しました", 500);

  // Representative competitions (approved) — fetch in two steps to avoid nested FK alias issues
  const { data: repLinks, error: repError } = await supabase
    .from("competition_representatives")
    .select("competition_id")
    .eq("representative_id", deviceId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (repError) return errorResponse(c, "データベースエラーが発生しました", 500);

  let represented: Record<string, unknown>[] = [];
  if (repLinks && repLinks.length > 0) {
    const repCompIds = repLinks.map((r: { competition_id: string }) => r.competition_id);
    const { data: repCompsData, error: repCompError } = await supabase
      .from("competitions")
      .select(`
        id, device_id, name, date, course_name, status, created_at,
        evidence_images ( count )
      `)
      .in("id", repCompIds)
      .order("date", { ascending: false });
    if (repCompError) return errorResponse(c, "データベースエラーが発生しました", 500);
    represented = (repCompsData ?? []) as Record<string, unknown>[];
  }

  return jsonResponse(c, {
    competitions: owned ?? [],
    represented: represented,
  });
});

// ============================================
// 26. ダッシュボード（拡張）  GET /api/v1/dashboard
//     保留中の代表者申請も含む
// ============================================
app.get("/api/v1/dashboard", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);

  const { data: account, error: accError } = await supabase
    .from("accounts")
    .select("device_id, account_name, created_at")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (accError || !account) return errorResponse(c, "アカウントが見つかりません", 404);

  const { count: compCount } = await supabase
    .from("competitions")
    .select("*", { count: "exact", head: true })
    .eq("device_id", deviceId);

  const { data: ownedActiveComps } = await supabase
    .from("competitions")
    .select("id, name, date, course_name, status")
    .eq("device_id", deviceId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5);

  // Also fetch active competitions where this user is an approved representative
  const { data: repLinks } = await supabase
    .from("competition_representatives")
    .select("competition_id")
    .eq("representative_id", deviceId)
    .eq("status", "approved");

  let repActiveComps: { id: string; name: string; date: string; course_name: string; status: string }[] = [];
  if (repLinks && repLinks.length > 0) {
    const repCompIds = repLinks.map((r: { competition_id: string }) => r.competition_id);
    const { data: repComps } = await supabase
      .from("competitions")
      .select("id, name, date, course_name, status")
      .in("id", repCompIds)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5);
    repActiveComps = (repComps ?? []) as { id: string; name: string; date: string; course_name: string; status: string }[];
  }

  const ownedComps = (ownedActiveComps ?? []).map((c: { id: string; name: string; date: string; course_name: string; status: string }) => ({ ...c, role: "owner" as const }));
  const repComps = repActiveComps.map((c) => ({ ...c, role: "representative" as const }));

  // Merge, deduplicate (in case owner is also a rep somehow), and limit to 5
  const seenIds = new Set<string>();
  const activeComps = [...ownedComps, ...repComps]
    .filter((c) => {
      if (seenIds.has(c.id)) return false;
      seenIds.add(c.id);
      return true;
    })
    .slice(0, 5);

  const { count: imgCount } = await supabase
    .from("evidence_images")
    .select("*", { count: "exact", head: true })
    .eq("device_id", deviceId);

  const { count: dranconCount } = await supabase
    .from("evidence_images")
    .select("*", { count: "exact", head: true })
    .eq("device_id", deviceId)
    .eq("award_type", "drancon");

  const { count: nearpinCount } = await supabase
    .from("evidence_images")
    .select("*", { count: "exact", head: true })
    .eq("device_id", deviceId)
    .eq("award_type", "nearpin");

  const { data: recentImages } = await supabase
    .from("evidence_images")
    .select(`
      id, competition_id, award_type, hole_number, distance, image_url, memo, created_at,
      competitions:competition_id ( name, date )
    `)
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false })
    .limit(6);

  // Pending representative requests WHERE this user is the invited representative
  const { data: pendingReps } = await supabase
    .from("competition_representatives")
    .select(`
      id, competition_id, representative_id, status, created_at,
      competitions:competition_id ( name, device_id )
    `)
    .eq("representative_id", deviceId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  let pendingRequests: {
    id: string;
    competition_id: string;
    competition_name: string;
    requester_id: string;
    requester_name: string;
    status: string;
    created_at: string;
  }[] = [];

  if (pendingReps && pendingReps.length > 0) {
    // Fetch owner account names for these competitions
    const compIds = pendingReps.map((r: { competition_id: string }) => r.competition_id);
    const { data: compOwners } = await supabase
      .from("competitions")
      .select("id, name, device_id")
      .in("id", compIds);

    const compMap = new Map((compOwners ?? []).map((co: { id: string; name: string }) => [co.id, co.name]));
    const ownerIds = [...new Set((compOwners ?? []).map((co: { device_id: string }) => co.device_id))];

    const { data: ownerAccounts } = await supabase
      .from("accounts")
      .select("device_id, account_name")
      .in("device_id", ownerIds);

    const ownerNameMap = new Map((ownerAccounts ?? []).map((a: { device_id: string; account_name: string }) => [a.device_id, a.account_name]));

    pendingRequests = pendingReps.map((r: {
      id: string;
      competition_id: string;
      representative_id: string;
      status: string;
      created_at: string;
      competitions: { name: string; device_id: string } | null;
    }) => ({
      id: r.id,
      competition_id: r.competition_id,
      competition_name: compMap.get(r.competition_id) ?? "",
      requester_id: r.competitions?.device_id ?? "",
      requester_name: ownerNameMap.get(r.competitions?.device_id ?? "") ?? "不明",
      status: r.status,
      created_at: r.created_at,
    }));
  }

  return jsonResponse(c, {
    account: account as Account,
    stats: {
      totalCompetitions: compCount ?? 0,
      activeCompetitions: activeComps,
      totalEvidenceImages: imgCount ?? 0,
      dranconCount: dranconCount ?? 0,
      nearpinCount: nearpinCount ?? 0,
    },
    recentImages: recentImages ?? [],
    pendingRequests,
  });
});

// ============================================
// 27. QR Code Data API  GET /api/v1/competitions/:id/qr-data
//     Returns competition, holes with awards, and approved representatives
// ============================================
app.get("/api/v1/competitions/:id/qr-data", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);

  const compId = c.req.param("id");

  const { data: comp, error: compError } = await supabase
    .from("competitions")
    .select("id, device_id, name, date, course_name, status, created_at")
    .eq("id", compId)
    .maybeSingle();

  if (compError || !comp) return errorResponse(c, "コンペが見つかりません", 404);

  if (comp.device_id !== deviceId) return errorResponse(c, "このコンペのQRコードを発行する権限がありません", 403);

  const { data: holes } = await supabase
    .from("competition_holes")
    .select("id, competition_id, hole_number, award_type")
    .eq("competition_id", compId)
    .order("hole_number", { ascending: true });

  const { data: reps } = await supabase
    .from("competition_representatives")
    .select(`
      id, competition_id, representative_id, status, created_at, updated_at,
      accounts:representative_id ( account_name )
    `)
    .eq("competition_id", compId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  return jsonResponse(c, {
    competition: comp as Competition,
    holes: holes ?? [],
    representatives: reps ?? [],
  });
});

// ============================================
// 28. Evidence by Competition (all users)  GET /api/v1/competitions/:id/evidence
// ============================================
app.get("/api/v1/competitions/:id/evidence", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);

  const compId = c.req.param("id");

  // Verify the user is either the owner or an approved representative
  const { data: comp } = await supabase
    .from("competitions")
    .select("device_id")
    .eq("id", compId)
    .maybeSingle();

  if (!comp) return errorResponse(c, "コンペが見つかりません", 404);

  const isOwner = comp.device_id === deviceId;

  let isRep = false;
  if (!isOwner) {
    const { data: rep } = await supabase
      .from("competition_representatives")
      .select("id")
      .eq("competition_id", compId)
      .eq("representative_id", deviceId)
      .eq("status", "approved")
      .maybeSingle();
    isRep = !!rep;
  }

  if (!isOwner && !isRep) return errorResponse(c, "このコンペの証拠画像を閲覧する権限がありません", 403);

  const { data: images, error: imgError } = await supabase
    .from("evidence_images")
    .select(`
      id, competition_id, device_id, award_type, hole_number, distance, image_url, memo, created_at,
      competitions:competition_id ( name, date, course_name ),
      accounts:device_id ( account_name )
    `)
    .eq("competition_id", compId)
    .order("created_at", { ascending: false });

  if (imgError) return errorResponse(c, "データベースエラーが発生しました", 500);

  return jsonResponse(c, { evidenceImages: images ?? [] });
});

// ============================================
// 29. Representative Check  GET /api/v1/competitions/:id/rep-check
//     Returns whether the user is an approved representative or owner
// ============================================
app.get("/api/v1/competitions/:id/rep-check", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);

  const compId = c.req.param("id");

  const { data: comp } = await supabase
    .from("competitions")
    .select("device_id")
    .eq("id", compId)
    .maybeSingle();

  if (!comp) return errorResponse(c, "コンペが見つかりません", 404);

  const isOwner = comp.device_id === deviceId;

  let isRepresentative = false;
  if (!isOwner) {
    const { data: rep } = await supabase
      .from("competition_representatives")
      .select("id")
      .eq("competition_id", compId)
      .eq("representative_id", deviceId)
      .eq("status", "approved")
      .maybeSingle();
    isRepresentative = !!rep;
  }

  return jsonResponse(c, { isRepresentative, isOwner });
});

// ============================================
// 30. 端末引き継ぎコード発行  POST /api/v1/device-transfer/issue
//     X-Device-Id（旧端末）→ 6桁コードを発行（10分有効）
// ============================================
app.post("/api/v1/device-transfer/issue", async (c) => {
  const deviceId = getDeviceId(c);
  if (!deviceId) return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);

  // Verify account exists
  const { data: account } = await supabase
    .from("accounts")
    .select("device_id")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (!account) return errorResponse(c, "アカウントが登録されていません", 403);

  // Invalidate previous pending codes for this device
  await supabase
    .from("device_transfer_codes")
    .update({ status: "expired" })
    .eq("old_device_id", deviceId)
    .eq("status", "pending");

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: insertError } = await supabase
    .from("device_transfer_codes")
    .insert({
      old_device_id: deviceId,
      code,
      status: "pending",
      expires_at: expiresAt,
    });

  if (insertError) return errorResponse(c, "引き継ぎコードの発行に失敗しました", 500);

  return jsonResponse(c, { code, expiresAt });
});

// ============================================
// 31. 端末引き継ぎ実行  POST /api/v1/device-transfer/execute
//     X-Device-Id（新端末）+ body: { code: string }
//     旧端末の全データを新端末のdevice_idに付け替え
// ============================================
app.post("/api/v1/device-transfer/execute", async (c) => {
  const newDeviceId = getDeviceId(c);
  if (!newDeviceId) return errorResponse(c, "X-Device-Id ヘッダーが必要です", 400);

  let body: { code?: string };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, "リクエストボディが不正です", 400);
  }

  const code = body.code?.trim();
  if (!code || !/^\d{6}$/.test(code)) {
    return errorResponse(c, "6桁のコードを入力してください", 400);
  }

  // Find the code
  const { data: transferRecord, error: findError } = await supabase
    .from("device_transfer_codes")
    .select("id, old_device_id, status, expires_at")
    .eq("code", code)
    .eq("status", "pending")
    .maybeSingle();

  if (findError || !transferRecord) {
    return errorResponse(c, "引き継ぎコードが見つかりません。コードを確認してください", 404);
  }

  // Check expiry
  if (new Date(transferRecord.expires_at) < new Date()) {
    await supabase
      .from("device_transfer_codes")
      .update({ status: "expired" })
      .eq("id", transferRecord.id);
    return errorResponse(c, "引き継ぎコードの有効期限が切れています。再度発行してください", 410);
  }

  const oldDeviceId = transferRecord.old_device_id;

  // Prevent self-transfer
  if (oldDeviceId === newDeviceId) {
    return errorResponse(c, "同じ端末では引き継ぎできません", 400);
  }

  // Check if new device already has an account
  const { data: existingAccount } = await supabase
    .from("accounts")
    .select("device_id")
    .eq("device_id", newDeviceId)
    .maybeSingle();
  if (existingAccount) {
    return errorResponse(c, "この端末には既にアカウントが登録されています", 409);
  }

  // Transfer all data from old_device_id to new_device_id
  // 1. accounts
  const { error: accErr } = await supabase
    .from("accounts")
    .update({ device_id: newDeviceId })
    .eq("device_id", oldDeviceId);
  if (accErr) return errorResponse(c, "アカウントの引き継ぎに失敗しました", 500);

  // 2. competitions
  await supabase
    .from("competitions")
    .update({ device_id: newDeviceId })
    .eq("device_id", oldDeviceId);

  // 3. evidence_images
  await supabase
    .from("evidence_images")
    .update({ device_id: newDeviceId })
    .eq("device_id", oldDeviceId);

  // 4. competition_representatives (representative_id)
  await supabase
    .from("competition_representatives")
    .update({ representative_id: newDeviceId })
    .eq("representative_id", oldDeviceId);

  // 5. friendships (both account_id and friend_id)
  await supabase
    .from("friendships")
    .update({ account_id: newDeviceId })
    .eq("account_id", oldDeviceId);
  await supabase
    .from("friendships")
    .update({ friend_id: newDeviceId })
    .eq("friend_id", oldDeviceId);

  // Mark code as used
  await supabase
    .from("device_transfer_codes")
    .update({ status: "used", new_device_id: newDeviceId, used_at: new Date().toISOString() })
    .eq("id", transferRecord.id);

  return jsonResponse(c, { message: "端末の引き継ぎが完了しました" });
});

// ============================================
// 32. ヘルスチェック  GET /api/v1/health
// ============================================
app.get("/api/v1/health", (c) => {
  return jsonResponse(c, { status: "ok", timestamp: new Date().toISOString() });
});

// ============================================
// Root
// ============================================
app.all("/", (c) => {
  return jsonResponse(c, {
    service: "Golf Evidence API",
    version: "1.0.0",
    endpoints: [
      "GET  /api/v1/health",
      "GET  /api/v1/account/check",
      "POST /api/v1/account/check-name",
      "POST /api/v1/account/register",
      "GET  /api/v1/account",
      "PUT  /api/v1/account",
      "GET  /api/v1/dashboard",
      "GET  /api/v1/competitions",
      "POST /api/v1/competitions",
      "GET  /api/v1/competitions/:id",
      "PUT  /api/v1/competitions/:id",
      "DELETE /api/v1/competitions/:id",
      "GET  /api/v1/evidence",
      "POST /api/v1/evidence",
      "GET  /api/v1/evidence/:id",
      "DELETE /api/v1/evidence/:id",
    ],
  });
});

// ============================================
// Global error handler - ensures CORS headers on ALL responses
// ============================================
Deno.serve(async (req: Request) => {
  // Handle CORS preflight for ALL requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Strip the Edge Function path prefix so Hono routes match correctly.
    // Supabase forwards the path as /golf-api/api/v1/health but our routes
    // are defined as /api/v1/health.
    const url = new URL(req.url);
    const prefix = "/golf-api";
    let pathname = url.pathname;
    if (pathname.startsWith(prefix)) {
      pathname = pathname.slice(prefix.length) || "/";
    }
    const strippedUrl = new URL(pathname, url.origin);
    strippedUrl.search = url.search;
    const strippedReq = new Request(strippedUrl, req);
    const res = await app.fetch(strippedReq);

    // Ensure CORS headers on every response
    const respHeaders = new Headers(res.headers);
    respHeaders.set("Access-Control-Allow-Origin", "*");
    respHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    respHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Client-Info, Apikey, X-Device-Id");

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: respHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "サーバー内部エラーが発生しました";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
