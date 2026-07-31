"""FastAPI application — Golf Evidence API.

A shared backend for both the web (PWA) and Expo (React Native) apps.
Mirrors all endpoints from the original Supabase Edge Function.
"""
import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Depends, Query, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
import uuid
import random
from datetime import datetime, timedelta

from .db import get_supabase
from .deps import get_device_id, generate_name_suggestions
from .models import (
    CheckNameRequest,
    RegisterAccountRequest,
    UpdateAccountRequest,
    CreateCompetitionRequest,
    UpdateCompetitionRequest,
    RequestRepresentativeRequest,
    UpdateRepresentativeRequest,
    ExecuteTransferRequest,
    HoleInput,
)

load_dotenv()

app = FastAPI(title="Golf Evidence API", version="1.0.0")

raw_origins = os.environ.get("ALLOWED_ORIGINS", "*")
origins = [o.strip().rstrip("/") for o in raw_origins.split(",") if o.strip()]

# RailwayのフロントエンドURLをデフォルトで許可リストに追加
default_frontend = "https://frontend-production-0a2c7.up.railway.app"
if default_frontend not in origins and "*" not in origins:
    origins.append(default_frontend)

allow_credentials = False if "*" in origins else True

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin")
    headers = {}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"

    return JSONResponse(
        status_code=500,
        content={
            "detail": f"サーバーエラー: {str(exc)}",
            "error": str(exc),
            "suggestions": [
                "バックエンドの Variables タブで SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が設定されているか確認してください。"
            ],
        },
        headers=headers
    )


MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


# ============================================
# Account
# ============================================

@app.get("/api/v1/account/check")
async def check_account(device_id: str = Depends(get_device_id)):
    sb = get_supabase()
    res = sb.table("accounts").select("device_id, account_name, created_at").eq("device_id", device_id).maybeSingle().execute()
    if not res.data:
        return {"registered": False}
    return {"registered": True, "account": res.data}


@app.post("/api/v1/account/check-name")
async def check_account_name(body: CheckNameRequest):
    name = body.account_name.strip()
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="アカウント名は2文字以上で入力してください")
    if len(name) > 30:
        raise HTTPException(status_code=400, detail="アカウント名は30文字以内で入力してください")

    sb = get_supabase()
    res = sb.table("accounts").select("account_name").eq("account_name", name).maybeSingle().execute()
    if res.data:
        return {"available": False, "message": "このアカウント名は既に使用されています", "suggestions": generate_name_suggestions(name)}
    return {"available": True, "message": "このアカウント名は使用可能です"}


@app.post("/api/v1/account/register", status_code=201)
async def register_account(body: RegisterAccountRequest, device_id: str = Depends(get_device_id)):
    name = body.account_name.strip()
    if len(name) < 2 or len(name) > 30:
        raise HTTPException(status_code=400, detail="アカウント名は2〜30文字で入力してください")

    sb = get_supabase()
    existing = sb.table("accounts").select("device_id").eq("device_id", device_id).maybeSingle().execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="この端末は既に登録されています")

    conflict = sb.table("accounts").select("account_name").eq("account_name", name).maybeSingle().execute()
    if conflict.data:
        return JSONResponse(status_code=409, content={"error": "このアカウント名は既に使用されています", "suggestions": generate_name_suggestions(name)})

    inserted = sb.table("accounts").insert({"device_id": device_id, "account_name": name}).select("device_id, account_name, created_at").single().execute()
    if not inserted.data:
        raise HTTPException(status_code=500, detail="アカウント登録に失敗しました")
    return {"message": "アカウント登録が完了しました", "account": inserted.data}


@app.get("/api/v1/account")
async def get_account(device_id: str = Depends(get_device_id)):
    sb = get_supabase()
    res = sb.table("accounts").select("device_id, account_name, created_at").eq("device_id", device_id).maybeSingle().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="アカウントが見つかりません")
    return {"account": res.data}


@app.put("/api/v1/account")
async def update_account(body: UpdateAccountRequest, device_id: str = Depends(get_device_id)):
    name = body.account_name.strip()
    if len(name) < 2 or len(name) > 30:
        raise HTTPException(status_code=400, detail="アカウント名は2〜30文字で入力してください")

    sb = get_supabase()
    conflict = sb.table("accounts").select("account_name").eq("account_name", name).neq("device_id", device_id).maybeSingle().execute()
    if conflict.data:
        return JSONResponse(status_code=409, content={"error": "このアカウント名は既に使用されています", "suggestions": generate_name_suggestions(name)})

    updated = sb.table("accounts").update({"account_name": name}).eq("device_id", device_id).select("device_id, account_name, created_at").single().execute()
    if not updated.data:
        raise HTTPException(status_code=500, detail="アカウント更新に失敗しました")
    return {"message": "アカウント名を更新しました", "account": updated.data}


# ============================================
# Dashboard
# ============================================

@app.get("/api/v1/dashboard")
async def get_dashboard(device_id: str = Depends(get_device_id)):
    sb = get_supabase()

    account = sb.table("accounts").select("device_id, account_name, created_at").eq("device_id", device_id).maybeSingle().execute()
    if not account.data:
        raise HTTPException(status_code=404, detail="アカウントが見つかりません")

    comp_count = sb.table("competitions").select("*", count="exact", head=True).eq("device_id", device_id).execute()

    owned_active = sb.table("competitions").select("id, name, date, course_name, status").eq("device_id", device_id).eq("status", "active").order("created_at", desc=True).limit(5).execute()

    rep_links = sb.table("competition_representatives").select("competition_id").eq("representative_id", device_id).eq("status", "approved").execute()

    rep_active = []
    if rep_links.data:
        rep_ids = [r["competition_id"] for r in rep_links.data]
        rep_comps = sb.table("competitions").select("id, name, date, course_name, status").in_("id", rep_ids).eq("status", "active").order("created_at", desc=True).limit(5).execute()
        rep_active = rep_comps.data or []

    owned = [{"**role**": "owner", **c} for c in (owned_active.data or [])]
    reps = [{"role": "representative", **c} for c in rep_active]
    seen = set()
    active_comps = []
    for c in owned + reps:
        if c["id"] not in seen:
            seen.add(c["id"])
            active_comps.append(c)
    active_comps = active_comps[:5]

    img_count = sb.table("evidence_images").select("*", count="exact", head=True).eq("device_id", device_id).execute()
    drancon_count = sb.table("evidence_images").select("*", count="exact", head=True).eq("device_id", device_id).eq("award_type", "drancon").execute()
    nearpin_count = sb.table("evidence_images").select("*", count="exact", head=True).eq("device_id", device_id).eq("award_type", "nearpin").execute()

    recent = sb.table("evidence_images").select("id, competition_id, award_type, hole_number, distance, image_url, memo, created_at, competitions:competition_id ( name, date )").eq("device_id", device_id).order("created_at", desc=True).limit(6).execute()

    pending_reps = sb.table("competition_representatives").select("id, competition_id, representative_id, status, created_at, competitions:competition_id ( name, device_id )").eq("representative_id", device_id).eq("status", "pending").order("created_at", desc=True).execute()

    pending_requests = []
    if pending_reps.data:
        comp_ids = [r["competition_id"] for r in pending_reps.data]
        comp_owners = sb.table("competitions").select("id, name, device_id").in_("id", comp_ids).execute()
        comp_map = {co["id"]: co["name"] for co in (comp_owners.data or [])}
        owner_ids = list({co["device_id"] for co in (comp_owners.data or [])})
        owner_accounts = sb.table("accounts").select("device_id, account_name").in_("device_id", owner_ids).execute()
        owner_map = {a["device_id"]: a["account_name"] for a in (owner_accounts.data or [])}

        for r in pending_reps.data:
            comp = r.get("competitions") or {}
            pending_requests.append({
                "id": r["id"],
                "competition_id": r["competition_id"],
                "competition_name": comp_map.get(r["competition_id"], ""),
                "requester_id": comp.get("device_id", ""),
                "requester_name": owner_map.get(comp.get("device_id", ""), "不明"),
                "status": r["status"],
                "created_at": r["created_at"],
            })

    return {
        "account": account.data,
        "stats": {
            "totalCompetitions": comp_count.count or 0,
            "activeCompetitions": active_comps,
            "totalEvidenceImages": img_count.count or 0,
            "dranconCount": drancon_count.count or 0,
            "nearpinCount": nearpin_count.count or 0,
        },
        "recentImages": recent.data or [],
        "pendingRequests": pending_requests,
    }


# ============================================
# Competitions
# ============================================

@app.get("/api/v1/competitions")
async def get_competitions(device_id: str = Depends(get_device_id), status: Optional[str] = Query(None)):
    sb = get_supabase()

    q = sb.table("competitions").select("id, device_id, name, date, course_name, status, created_at, evidence_images ( count )").eq("device_id", device_id).order("date", desc=True)
    if status:
        q = q.eq("status", status)
    owned = q.execute()

    rep_links = sb.table("competition_representatives").select("competition_id").eq("representative_id", device_id).eq("status", "approved").order("created_at", desc=True).execute()

    represented = []
    if rep_links.data:
        rep_ids = [r["competition_id"] for r in rep_links.data]
        rep_comps = sb.table("competitions").select("id, device_id, name, date, course_name, status, created_at, evidence_images ( count )").in_("id", rep_ids).order("date", desc=True).execute()
        represented = rep_comps.data or []

    return {"competitions": owned.data or [], "represented": represented}


@app.post("/api/v1/competitions", status_code=201)
async def create_competition(body: CreateCompetitionRequest, device_id: str = Depends(get_device_id)):
    sb = get_supabase()

    account = sb.table("accounts").select("device_id").eq("device_id", device_id).maybeSingle().execute()
    if not account.data:
        raise HTTPException(status_code=403, detail="アカウントが登録されていません")

    inserted = sb.table("competitions").insert({"device_id": device_id, "name": body.name, "date": body.date, "course_name": body.course_name, "status": "active"}).select("id, device_id, name, date, course_name, status, created_at").single().execute()
    if not inserted.data:
        raise HTTPException(status_code=500, detail="コンペの作成に失敗しました")

    if body.holes:
        hole_rows = [{"competition_id": inserted.data["id"], "hole_number": h.hole_number, "award_type": h.award_type} for h in body.holes if 1 <= h.hole_number <= 18 and h.award_type in ("none", "drancon", "nearpin")]
        if hole_rows:
            sb.table("competition_holes").insert(hole_rows).execute()

    return {"message": "コンペを作成しました", "competition": inserted.data}


@app.get("/api/v1/competitions/{comp_id}")
async def get_competition_detail(comp_id: str):
    sb = get_supabase()
    comp = sb.table("competitions").select("id, device_id, name, date, course_name, status, created_at").eq("id", comp_id).maybeSingle().execute()
    if not comp.data:
        raise HTTPException(status_code=404, detail="コンペが見つかりません")

    images = sb.table("evidence_images").select("id, competition_id, device_id, award_type, hole_number, distance, image_url, memo, created_at, accounts:device_id ( account_name )").eq("competition_id", comp_id).order("created_at", desc=True).execute()
    return {"competition": comp.data, "evidenceImages": images.data or []}


@app.get("/api/v1/competitions/{comp_id}/full")
async def get_competition_full(comp_id: str):
    sb = get_supabase()
    comp = sb.table("competitions").select("id, device_id, name, date, course_name, status, created_at").eq("id", comp_id).maybeSingle().execute()
    if not comp.data:
        raise HTTPException(status_code=404, detail="コンペが見つかりません")

    holes = sb.table("competition_holes").select("id, competition_id, hole_number, award_type").eq("competition_id", comp_id).order("hole_number", ascending=True).execute()
    return {"competition": comp.data, "holes": holes.data or []}


@app.put("/api/v1/competitions/{comp_id}")
async def update_competition(comp_id: str, body: UpdateCompetitionRequest, device_id: str = Depends(get_device_id)):
    sb = get_supabase()
    comp = sb.table("competitions").select("device_id").eq("id", comp_id).maybeSingle().execute()
    if not comp.data:
        raise HTTPException(status_code=404, detail="コンペが見つかりません")
    if comp.data["device_id"] != device_id:
        raise HTTPException(status_code=403, detail="このコンペを編集する権限がありません")

    updates = {}
    if body.name is not None:
        updates["name"] = body.name.strip()
    if body.date is not None:
        updates["date"] = body.date
    if body.course_name is not None:
        updates["course_name"] = body.course_name.strip() or None
    if body.status is not None:
        if body.status not in ("active", "completed"):
            raise HTTPException(status_code=400, detail="status は active または completed で指定してください")
        updates["status"] = body.status

    if updates:
        sb.table("competitions").update(updates).eq("id", comp_id).execute()

    if body.holes is not None:
        sb.table("competition_holes").delete().eq("competition_id", comp_id).execute()
        hole_rows = [{"competition_id": comp_id, "hole_number": h.hole_number, "award_type": h.award_type} for h in body.holes if 1 <= h.hole_number <= 18 and h.award_type in ("none", "drancon", "nearpin")]
        if hole_rows:
            sb.table("competition_holes").insert(hole_rows).execute()

    return {"message": "コンペを更新しました"}


@app.delete("/api/v1/competitions/{comp_id}")
async def delete_competition(comp_id: str, device_id: str = Depends(get_device_id)):
    sb = get_supabase()
    comp = sb.table("competitions").select("device_id").eq("id", comp_id).maybeSingle().execute()
    if not comp.data:
        raise HTTPException(status_code=404, detail="コンペが見つかりません")
    if comp.data["device_id"] != device_id:
        raise HTTPException(status_code=403, detail="このコンペを削除する権限がありません")

    images = sb.table("evidence_images").select("image_url").eq("competition_id", comp_id).execute()
    if images.data:
        from urllib.parse import urlparse
        paths = []
        for img in images.data:
            try:
                parts = urlparse(img["image_url"]).path.split("/")
                idx = parts.index("evidence-images")
                if idx >= 0 and idx + 1 < len(parts):
                    paths.append("/".join(parts[idx + 1:]))
            except Exception:
                pass
        if paths:
            sb.storage.from_("evidence-images").remove(paths)

    sb.table("competitions").delete().eq("id", comp_id).execute()
    return {"message": "コンペを削除しました"}


@app.get("/api/v1/competitions/{comp_id}/qr-data")
async def get_qr_data(comp_id: str, device_id: str = Depends(get_device_id)):
    sb = get_supabase()
    comp = sb.table("competitions").select("id, device_id, name, date, course_name, status, created_at").eq("id", comp_id).maybeSingle().execute()
    if not comp.data:
        raise HTTPException(status_code=404, detail="コンペが見つかりません")
    if comp.data["device_id"] != device_id:
        raise HTTPException(status_code=403, detail="このコンペのQRコードを発行する権限がありません")

    holes = sb.table("competition_holes").select("id, competition_id, hole_number, award_type").eq("competition_id", comp_id).order("hole_number", ascending=True).execute()
    reps = sb.table("competition_representatives").select("id, competition_id, representative_id, status, created_at, updated_at, accounts:representative_id ( account_name )").eq("competition_id", comp_id).eq("status", "approved").order("created_at", desc=True).execute()
    return {"competition": comp.data, "holes": holes.data or [], "representatives": reps.data or []}


@app.get("/api/v1/competitions/{comp_id}/evidence")
async def get_evidence_by_competition(comp_id: str, device_id: str = Depends(get_device_id)):
    sb = get_supabase()
    comp = sb.table("competitions").select("device_id").eq("id", comp_id).maybeSingle().execute()
    if not comp.data:
        raise HTTPException(status_code=404, detail="コンペが見つかりません")

    is_owner = comp.data["device_id"] == device_id
    is_rep = False
    if not is_owner:
        rep = sb.table("competition_representatives").select("id").eq("competition_id", comp_id).eq("representative_id", device_id).eq("status", "approved").maybeSingle().execute()
        is_rep = bool(rep.data)

    if not is_owner and not is_rep:
        raise HTTPException(status_code=403, detail="このコンペの証拠画像を閲覧する権限がありません")

    images = sb.table("evidence_images").select("id, competition_id, device_id, award_type, hole_number, distance, image_url, memo, created_at, competitions:competition_id ( name, date, course_name ), accounts:device_id ( account_name )").eq("competition_id", comp_id).order("created_at", desc=True).execute()
    return {"evidenceImages": images.data or []}


@app.get("/api/v1/competitions/{comp_id}/rep-check")
async def check_representative(comp_id: str, device_id: str = Depends(get_device_id)):
    sb = get_supabase()
    comp = sb.table("competitions").select("device_id").eq("id", comp_id).maybeSingle().execute()
    if not comp.data:
        raise HTTPException(status_code=404, detail="コンペが見つかりません")

    is_owner = comp.data["device_id"] == device_id
    is_rep = False
    if not is_owner:
        rep = sb.table("competition_representatives").select("id").eq("competition_id", comp_id).eq("representative_id", device_id).eq("status", "approved").maybeSingle().execute()
        is_rep = bool(rep.data)
    return {"isRepresentative": is_rep, "isOwner": is_owner}


# ============================================
# Representatives
# ============================================

@app.get("/api/v1/competitions/{comp_id}/representatives")
async def get_representatives(comp_id: str):
    sb = get_supabase()
    reps = sb.table("competition_representatives").select("id, competition_id, representative_id, status, created_at, updated_at, accounts:representative_id ( account_name )").eq("competition_id", comp_id).order("created_at", desc=True).execute()
    return {"representatives": reps.data or []}


@app.post("/api/v1/competitions/{comp_id}/representatives/request", status_code=201)
async def request_representative(comp_id: str, body: RequestRepresentativeRequest, device_id: str = Depends(get_device_id)):
    sb = get_supabase()
    rep_device_id = (body.target_device_id or "").strip() or device_id

    comp = sb.table("competitions").select("id, device_id").eq("id", comp_id).maybeSingle().execute()
    if not comp.data:
        raise HTTPException(status_code=404, detail="コンペが見つかりません")
    if comp.data["device_id"] == rep_device_id:
        raise HTTPException(status_code=400, detail="自分のコンペには代表者申請できません")

    target = sb.table("accounts").select("device_id").eq("device_id", rep_device_id).maybeSingle().execute()
    if not target.data:
        raise HTTPException(status_code=404, detail="指定されたアカウントが見つかりません")

    existing = sb.table("competition_representatives").select("id, status").eq("competition_id", comp_id).eq("representative_id", rep_device_id).maybeSingle().execute()
    if existing.data:
        st = existing.data["status"]
        if st == "approved":
            raise HTTPException(status_code=409, detail="既に代表者として承認されています")
        if st == "pending":
            raise HTTPException(status_code=409, detail="既に代表者申請中です")
        if st == "rejected":
            sb.table("competition_representatives").update({"status": "pending", "updated_at": datetime.utcnow().isoformat()}).eq("id", existing.data["id"]).execute()
            return {"message": "代表者申請を再送信しました"}

    sb.table("competition_representatives").insert({"competition_id": comp_id, "representative_id": rep_device_id, "status": "pending"}).execute()
    return {"message": "代表者申請を送信しました"}


@app.put("/api/v1/representatives/{rep_id}")
async def update_representative(rep_id: str, body: UpdateRepresentativeRequest, device_id: str = Depends(get_device_id)):
    sb = get_supabase()
    if body.status not in ("approved", "rejected", "pending"):
        raise HTTPException(status_code=400, detail="status は approved, rejected, または pending で指定してください")

    rep = sb.table("competition_representatives").select("id, competition_id, representative_id, status, competitions:competition_id ( device_id )").eq("id", rep_id).maybeSingle().execute()
    if not rep.data:
        raise HTTPException(status_code=404, detail="代表者申請が見つかりません")

    comp = rep.data.get("competitions") or {}
    is_owner = comp.get("device_id") == device_id
    is_self = rep.data["representative_id"] == device_id
    if not is_owner and not is_self:
        raise HTTPException(status_code=403, detail="この操作を行う権限がありません")
    if body.status in ("approved", "rejected") and not is_self:
        raise HTTPException(status_code=403, detail="代表者本人のみ承認/拒否できます")

    sb.table("competition_representatives").update({"status": body.status, "updated_at": datetime.utcnow().isoformat()}).eq("id", rep_id).execute()

    if body.status == "approved":
        owner_id = comp.get("device_id")
        rep_dev = rep.data["representative_id"]
        existing_friend = sb.table("friendships").select("id").or_(f"and(eq.account_id,{owner_id},eq.friend_id,{rep_dev}),and(eq.account_id,{rep_dev},eq.friend_id,{owner_id})").maybeSingle().execute()
        if not existing_friend.data:
            sb.table("friendships").insert([{"account_id": owner_id, "friend_id": rep_dev}, {"account_id": rep_dev, "friend_id": owner_id}]).execute()

    return {"message": "ステータスを更新しました"}


@app.get("/api/v1/representatives/pending")
async def get_pending_requests(device_id: str = Depends(get_device_id)):
    sb = get_supabase()
    pending = sb.table("competition_representatives").select("id, competition_id, representative_id, status, created_at, competitions:competition_id ( name, device_id )").eq("representative_id", device_id).eq("status", "pending").order("created_at", desc=True).execute()

    if not pending.data:
        return {"requests": []}

    comp_ids = [r["competition_id"] for r in pending.data]
    comp_owners = sb.table("competitions").select("id, name, device_id").in_("id", comp_ids).execute()
    comp_map = {co["id"]: co["name"] for co in (comp_owners.data or [])}
    owner_ids = list({co["device_id"] for co in (comp_owners.data or [])})
    owner_accounts = sb.table("accounts").select("device_id, account_name").in_("device_id", owner_ids).execute()
    owner_map = {a["device_id"]: a["account_name"] for a in (owner_accounts.data or [])}

    requests = []
    for r in pending.data:
        comp = r.get("competitions") or {}
        requests.append({
            "id": r["id"],
            "competition_id": r["competition_id"],
            "competition_name": comp_map.get(r["competition_id"], ""),
            "requester_id": comp.get("device_id", ""),
            "requester_name": owner_map.get(comp.get("device_id", ""), "不明"),
            "status": r["status"],
            "created_at": r["created_at"],
        })
    return {"requests": requests}


# ============================================
# Friends
# ============================================

@app.get("/api/v1/friends")
async def get_friends(device_id: str = Depends(get_device_id)):
    sb = get_supabase()
    data = sb.table("friendships").select("friend_id, accounts:friend_id ( account_name )").eq("account_id", device_id).order("created_at", desc=True).execute()
    friends = [{"device_id": f["friend_id"], "account_name": (f.get("accounts") or {}).get("account_name", "不明")} for f in (data.data or [])]
    return {"friends": friends}


@app.get("/api/v1/accounts/search")
async def search_accounts(q: str = Query(""), device_id: str = Depends(get_device_id)):
    sb = get_supabase()
    q = q.strip()
    if not q:
        return {"accounts": []}

    all_accounts = sb.table("accounts").select("device_id, account_name").limit(1000).execute()
    lower_q = q.lower()
    results = [a for a in (all_accounts.data or []) if lower_q in a["account_name"].lower() and a["device_id"] != device_id]
    return {"accounts": results}


# ============================================
# Evidence
# ============================================

@app.get("/api/v1/evidence")
async def get_evidence(device_id: str = Depends(get_device_id), competition_id: Optional[str] = Query(None), award_type: Optional[str] = Query(None)):
    sb = get_supabase()
    q = sb.table("evidence_images").select("id, competition_id, device_id, award_type, hole_number, distance, image_url, memo, created_at, competitions:competition_id ( name, date, course_name ), accounts:device_id ( account_name )").eq("device_id", device_id).order("created_at", desc=True)
    if competition_id:
        q = q.eq("competition_id", competition_id)
    if award_type:
        q = q.eq("award_type", award_type)
    res = q.execute()
    return {"evidenceImages": res.data or []}


@app.get("/api/v1/evidence/{evidence_id}")
async def get_evidence_detail(evidence_id: str):
    sb = get_supabase()
    res = sb.table("evidence_images").select("id, competition_id, device_id, award_type, hole_number, distance, image_url, memo, created_at, competitions:competition_id ( name, date, course_name ), accounts:device_id ( account_name )").eq("id", evidence_id).maybeSingle().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="証拠画像が見つかりません")
    return {"evidenceImage": res.data}


@app.post("/api/v1/evidence", status_code=201)
async def create_evidence(
    device_id: str = Depends(get_device_id),
    competition_id: str = Form(...),
    award_type: str = Form(...),
    hole_number: Optional[str] = Form(None),
    distance: Optional[str] = Form(None),
    memo: Optional[str] = Form(None),
    image: UploadFile = File(...),
):
    sb = get_supabase()

    if award_type not in ("drancon", "nearpin"):
        raise HTTPException(status_code=400, detail="賞の種類は drancon または nearpin で指定してください")

    contents = await image.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="画像ファイルサイズが大きすぎます（10MB以下にしてください）")

    account = sb.table("accounts").select("device_id").eq("device_id", device_id).maybeSingle().execute()
    if not account.data:
        raise HTTPException(status_code=403, detail="アカウントが登録されていません")

    comp = sb.table("competitions").select("id").eq("id", competition_id).maybeSingle().execute()
    if not comp.data:
        raise HTTPException(status_code=404, detail="コンペが見つかりません")

    file_ext = (image.filename or "photo.jpg").split(".")[-1] or "jpg"
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = f"{device_id}/{file_name}"

    upload = sb.storage.from_("evidence-images").upload(file_path, contents, {"content-type": image.content_type or "image/jpeg", "upsert": False})
    if hasattr(upload, "error") and upload.error:
        raise HTTPException(status_code=500, detail="画像のアップロードに失敗しました")

    public_url = sb.storage.from_("evidence-images").get_public_url(file_path)

    insert_data = {
        "competition_id": competition_id,
        "device_id": device_id,
        "award_type": award_type,
        "image_url": public_url,
        "memo": memo or None,
    }
    if hole_number:
        hn = int(hole_number)
        if 1 <= hn <= 36:
            insert_data["hole_number"] = hn
    if distance:
        dist = float(distance)
        if dist >= 0:
            insert_data["distance"] = dist

    inserted = sb.table("evidence_images").insert(insert_data).select("id, competition_id, device_id, award_type, hole_number, distance, image_url, memo, created_at").single().execute()
    if not inserted.data:
        sb.storage.from_("evidence-images").remove([file_path])
        raise HTTPException(status_code=500, detail="証拠画像の保存に失敗しました")

    return {"message": "証拠画像を登録しました", "evidenceImage": inserted.data}


@app.delete("/api/v1/evidence/{evidence_id}")
async def delete_evidence(evidence_id: str, device_id: str = Depends(get_device_id)):
    sb = get_supabase()
    evidence = sb.table("evidence_images").select("id, device_id, image_url").eq("id", evidence_id).maybeSingle().execute()
    if not evidence.data:
        raise HTTPException(status_code=404, detail="証拠画像が見つかりません")
    if evidence.data["device_id"] != device_id:
        raise HTTPException(status_code=403, detail="この証拠画像を削除する権限がありません")

    from urllib.parse import urlparse
    storage_path = None
    try:
        parts = urlparse(evidence.data["image_url"]).path.split("/")
        idx = parts.index("evidence-images")
        if idx >= 0 and idx + 1 < len(parts):
            storage_path = "/".join(parts[idx + 1:])
    except Exception:
        pass

    sb.table("evidence_images").delete().eq("id", evidence_id).execute()
    if storage_path:
        sb.storage.from_("evidence-images").remove([storage_path])
    return {"message": "証拠画像を削除しました"}


# ============================================
# Device Transfer
# ============================================

@app.post("/api/v1/device-transfer/issue")
async def issue_transfer_code(device_id: str = Depends(get_device_id)):
    sb = get_supabase()
    account = sb.table("accounts").select("device_id").eq("device_id", device_id).maybeSingle().execute()
    if not account.data:
        raise HTTPException(status_code=403, detail="アカウントが登録されていません")

    sb.table("device_transfer_codes").update({"status": "expired"}).eq("old_device_id", device_id).eq("status", "pending").execute()

    code = str(random.randint(100000, 999999))
    expires_at = (datetime.utcnow() + timedelta(minutes=10)).isoformat()
    sb.table("device_transfer_codes").insert({"old_device_id": device_id, "code": code, "status": "pending", "expires_at": expires_at}).execute()
    return {"code": code, "expiresAt": expires_at}


@app.post("/api/v1/device-transfer/execute")
async def execute_transfer(body: ExecuteTransferRequest, device_id: str = Depends(get_device_id)):
    sb = get_supabase()
    code = body.code.strip()
    if not code or not code.isdigit() or len(code) != 6:
        raise HTTPException(status_code=400, detail="6桁のコードを入力してください")

    record = sb.table("device_transfer_codes").select("id, old_device_id, status, expires_at").eq("code", code).eq("status", "pending").maybeSingle().execute()
    if not record.data:
        raise HTTPException(status_code=404, detail="引き継ぎコードが見つかりません。コードを確認してください")

    if datetime.fromisoformat(record.data["expires_at"].replace("Z", "+00:00")) < datetime.utcnow().astimezone():
        sb.table("device_transfer_codes").update({"status": "expired"}).eq("id", record.data["id"]).execute()
        raise HTTPException(status_code=410, detail="引き継ぎコードの有効期限が切れています。再度発行してください")

    old_device_id = record.data["old_device_id"]
    if old_device_id == device_id:
        raise HTTPException(status_code=400, detail="同じ端末では引き継ぎできません")

    existing = sb.table("accounts").select("device_id").eq("device_id", device_id).maybeSingle().execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="この端末には既にアカウントが登録されています")

    sb.table("accounts").update({"device_id": device_id}).eq("device_id", old_device_id).execute()
    sb.table("competitions").update({"device_id": device_id}).eq("device_id", old_device_id).execute()
    sb.table("evidence_images").update({"device_id": device_id}).eq("device_id", old_device_id).execute()
    sb.table("competition_representatives").update({"representative_id": device_id}).eq("representative_id", old_device_id).execute()
    sb.table("friendships").update({"account_id": device_id}).eq("account_id", old_device_id).execute()
    sb.table("friendships").update({"friend_id": device_id}).eq("friend_id", old_device_id).execute()

    sb.table("device_transfer_codes").update({"status": "used", "new_device_id": device_id, "used_at": datetime.utcnow().isoformat()}).eq("id", record.data["id"]).execute()
    return {"message": "端末の引き継ぎが完了しました"}


# ============================================
# Health
# ============================================

@app.get("/api/v1/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@app.get("/")
async def root():
    return {
        "service": "Golf Evidence API",
        "version": "1.0.0",
        "endpoints": [
            "GET  /api/v1/health",
            "GET  /api/v1/account/check",
            "POST /api/v1/account/check-name",
            "POST /api/v1/account/register",
            "GET  /api/v1/account",
            "PUT  /api/v1/account",
            "GET  /api/v1/dashboard",
            "GET  /api/v1/competitions",
            "POST /api/v1/competitions",
            "GET  /api/v1/competitions/{id}",
            "PUT  /api/v1/competitions/{id}",
            "DELETE /api/v1/competitions/{id}",
            "GET  /api/v1/evidence",
            "POST /api/v1/evidence",
            "GET  /api/v1/evidence/{id}",
            "DELETE /api/v1/evidence/{id}",
        ],
    }
