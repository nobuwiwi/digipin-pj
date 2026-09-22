import { useEffect, useState, useCallback } from "react";
import {
  Settings as SettingsIcon,
  User,
  Smartphone,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Edit3,
  Save,
} from "lucide-react";
import { getAccount, updateAccount, checkAccountName, linkEmail, executeEmailTransfer, ApiError } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { Account } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface SettingsScreenProps {
  deviceId: string;
}

export function SettingsScreen({ deviceId }: SettingsScreenProps) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [checkStatus, setCheckStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Email transfer state
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [transferSuccess, setTransferSuccess] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSentFor, setOtpSentFor] = useState<"link" | "transfer" | null>(null);

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAccount(deviceId);
      setAccount(res.account);
      setEditName(res.account.account_name);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  const handleCheck = async () => {
    const name = editName.trim();
    if (name.length < 2) {
      setCheckStatus("idle");
      setMessage("アカウント名は2文字以上で入力してください");
      return;
    }

    // If unchanged, skip
    if (name === account?.account_name) {
      setCheckStatus("available");
      setMessage("現在のアカウント名と同じです");
      return;
    }

    setCheckStatus("checking");
    setMessage("");
    setSuggestions([]);

    try {
      const res = await checkAccountName(deviceId, name);
      if (res.available) {
        setCheckStatus("available");
        setMessage(res.message);
      } else {
        setCheckStatus("taken");
        setMessage(res.message);
        setSuggestions(res.suggestions ?? []);
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setCheckStatus("taken");
      setMessage(apiErr.message);
      setSuggestions(apiErr.suggestions ?? []);
    }
  };

  const handleSave = async () => {
    const name = editName.trim();
    if (name.length < 2) {
      setSaveError("アカウント名は2文字以上で入力してください");
      return;
    }

    if (name === account?.account_name) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setSaveError("");
    try {
      const res = await updateAccount(deviceId, name);
      setAccount(res.account);
      setEditing(false);
      setCheckStatus("idle");
      setMessage("");
      setSuggestions([]);
    } catch (err) {
      const apiErr = err as ApiError;
      setSaveError(apiErr.message);
      if (apiErr.suggestions) {
        setSuggestions(apiErr.suggestions);
        setCheckStatus("taken");
      }
    } finally {
      setSaving(false);
    }
  };

  const useSuggestion = (s: string) => {
    setEditName(s);
    setCheckStatus("idle");
    setMessage("");
    setSuggestions([]);
    setSaveError("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-forest-500 animate-spin" />
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-red-500 text-sm mb-4">{error || "アカウント情報の取得に失敗しました"}</p>
        <Button variant="outline" onClick={fetchAccount}>
          再読み込み
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <h1 className="text-xl font-bold text-forest-800 flex items-center gap-2">
        <SettingsIcon className="w-5 h-5" />
        設定
      </h1>

      {/* Account name card */}
      <div className="bg-white rounded-2xl shadow-sm border border-forest-50 overflow-hidden">
        <div className="bg-forest-50 px-5 py-3 border-b border-forest-100">
          <h2 className="text-sm font-bold text-forest-700 flex items-center gap-2">
            <User className="w-4 h-4" />
            アカウント情報
          </h2>
        </div>
        <div className="p-5">
          {!editing ? (
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                アカウント名
              </label>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-forest-800">
                  {account.account_name}
                </p>
                <button type="button"
                  onClick={() => {
                    setEditing(true);
                    setEditName(account.account_name);
                    setCheckStatus("idle");
                    setMessage("");
                    setSuggestions([]);
                    setSaveError("");
                  }}
                  className="p-2 text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={editName}
                    onChange={(e) => {
                      setEditName(e.target.value);
                      setCheckStatus("idle");
                      setMessage("");
                      setSuggestions([]);
                      setSaveError("");
                    }}
                    maxLength={30}
                    placeholder="アカウント名"
                  />
                </div>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleCheck}
                  loading={checkStatus === "checking"}
                  disabled={!editName.trim() || checkStatus === "checking"}
                  className="shrink-0"
                >
                  重複確認
                </Button>
              </div>

              {message && (
                <div
                  className={`flex items-start gap-2 p-2.5 rounded-xl text-sm ${
                    checkStatus === "available"
                      ? "bg-forest-50 text-forest-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {checkStatus === "available" ? (
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{message}</span>
                </div>
              )}

              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button type="button"
                      key={s}
                      onClick={() => useSuggestion(s)}
                      className="px-3 py-1.5 bg-forest-50 text-forest-700 rounded-lg text-sm font-medium hover:bg-forest-100 transition-colors border border-forest-200"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {saveError && (
                <p className="text-sm text-red-500">{saveError}</p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setEditing(false);
                    setEditName(account.account_name);
                    setCheckStatus("idle");
                    setMessage("");
                    setSuggestions([]);
                    setSaveError("");
                  }}
                  disabled={saving}
                >
                  キャンセル
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleSave}
                  loading={saving}
                  disabled={
                    !editName.trim() ||
                    saving ||
                    checkStatus === "taken"
                  }
                >
                  <Save className="w-4 h-4 mr-1" />
                  保存
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Device ID card (debug) */}
      <div className="bg-white rounded-2xl shadow-sm border border-forest-50 overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-600 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            デバッグ情報
          </h2>
        </div>
        <div className="p-5">
          <label className="block text-xs text-gray-400 mb-1">
            端末ID（UUID）
          </label>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-sm font-mono text-gray-600 break-all">
              {deviceId}
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            このIDはブラウザのlocalStorageに保存されており、端末を識別するために使用されます。
          </p>
        </div>
      </div>

      {/* Email Linkage & Transfer card */}
      <div className="bg-white rounded-2xl shadow-sm border border-forest-50 overflow-hidden">
        <div className="bg-forest-50 px-5 py-3 border-b border-forest-100">
          <h2 className="text-sm font-bold text-forest-700 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            メールアドレス連携・引き継ぎ
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            メールアドレスを連携すると、別の端末へアカウントを引き継ぐことができます。
          </p>

          {!otpSentFor ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-forest-700 font-bold">メールアドレス</label>
                <Input
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setTransferError("");
                  }}
                  placeholder="example@example.com"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!emailInput) return setTransferError("メールアドレスを入力してください");
                    setTransferLoading(true);
                    setTransferError("");
                    try {
                      const { error } = await supabase.auth.signInWithOtp({ email: emailInput });
                      if (error) throw error;
                      setOtpSentFor("link");
                      setTransferSuccess("認証コードを送信しました。メールをご確認ください。");
                    } catch (err: any) {
                      setTransferError(err.message || "メールの送信に失敗しました");
                    } finally {
                      setTransferLoading(false);
                    }
                  }}
                  loading={transferLoading && !otpSentFor}
                  disabled={transferLoading || !emailInput}
                  className="flex-1"
                >
                  連携する (旧端末)
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    if (!emailInput) return setTransferError("メールアドレスを入力してください");
                    setTransferLoading(true);
                    setTransferError("");
                    try {
                      const { error } = await supabase.auth.signInWithOtp({ email: emailInput });
                      if (error) throw error;
                      setOtpSentFor("transfer");
                      setTransferSuccess("認証コードを送信しました。メールをご確認ください。");
                    } catch (err: any) {
                      setTransferError(err.message || "メールの送信に失敗しました");
                    } finally {
                      setTransferLoading(false);
                    }
                  }}
                  loading={transferLoading && !otpSentFor}
                  disabled={transferLoading || !emailInput}
                  className="flex-1"
                >
                  引き継ぐ (新端末)
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-forest-700 font-bold">認証コード (6桁)</label>
                <Input
                  type="text"
                  value={otpInput}
                  onChange={(e) => {
                    setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setTransferError("");
                  }}
                  placeholder="123456"
                  maxLength={6}
                  className="text-center tracking-[0.3em] font-mono"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOtpSentFor(null);
                    setOtpInput("");
                    setTransferSuccess("");
                    setTransferError("");
                  }}
                  disabled={transferLoading}
                >
                  戻る
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={async () => {
                    if (otpInput.length !== 6) return setTransferError("6桁のコードを入力してください");
                    setTransferLoading(true);
                    setTransferError("");
                    setTransferSuccess("");
                    try {
                      const { data, error } = await supabase.auth.verifyOtp({
                        email: emailInput,
                        token: otpInput,
                        type: "email",
                      });
                      if (error) throw error;
                      if (!data.session) throw new Error("セッションの取得に失敗しました");

                      const token = data.session.access_token;
                      if (otpSentFor === "link") {
                        await linkEmail(deviceId, token);
                        setTransferSuccess("メールアドレスの連携が完了しました。");
                        setOtpSentFor(null);
                        setOtpInput("");
                      } else {
                        await executeEmailTransfer(deviceId, token);
                        setTransferSuccess("引き継ぎが完了しました。再読み込みします...");
                        setTimeout(() => window.location.reload(), 2000);
                      }
                    } catch (err: any) {
                      setTransferError(err.message || "認証または処理に失敗しました");
                    } finally {
                      setTransferLoading(false);
                    }
                  }}
                  loading={transferLoading}
                  disabled={transferLoading || otpInput.length !== 6}
                >
                  {otpSentFor === "link" ? "連携を完了する" : "引き継ぎを実行する"}
                </Button>
              </div>
            </div>
          )}

          {transferError && (
            <div className="mt-2 flex items-start gap-2 p-2.5 rounded-xl text-sm bg-red-50 text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{transferError}</span>
            </div>
          )}
          {transferSuccess && (
            <div className="mt-2 flex items-start gap-2 p-2.5 rounded-xl text-sm bg-forest-50 text-forest-700">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{transferSuccess}</span>
            </div>
          )}
        </div>
      </div>

      {/* Legal & Support */}
      <div className="bg-white rounded-2xl shadow-sm border border-forest-50 overflow-hidden">
        <div className="bg-forest-50 px-5 py-3 border-b border-forest-100">
          <h2 className="text-sm font-bold text-forest-700 flex items-center gap-2">
            法的情報・サポート
          </h2>
        </div>
        <div className="flex flex-col">
          <a href="/terms" className="px-5 py-4 border-b border-forest-50 text-sm text-forest-800 hover:bg-forest-50 transition-colors flex justify-between items-center">
            <span>利用規約</span>
            <span className="text-gray-400">›</span>
          </a>
          <a href="/privacy" className="px-5 py-4 border-b border-forest-50 text-sm text-forest-800 hover:bg-forest-50 transition-colors flex justify-between items-center">
            <span>プライバシーポリシー</span>
            <span className="text-gray-400">›</span>
          </a>
          <a href="/contact" className="px-5 py-4 border-b border-forest-50 text-sm text-forest-800 hover:bg-forest-50 transition-colors flex justify-between items-center">
            <span>お問い合わせ</span>
            <span className="text-gray-400">›</span>
          </a>
          <a href="/legal" className="px-5 py-4 text-sm text-forest-800 hover:bg-forest-50 transition-colors flex justify-between items-center">
            <span>特定商取引法に基づく表記</span>
            <span className="text-gray-400">›</span>
          </a>
        </div>
      </div>

      {/* App info */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-400">
          デジピン v1.0.0
        </p>
      </div>
    </div>
  );
}
