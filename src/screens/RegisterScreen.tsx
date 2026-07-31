import { useState } from "react";
import { User, CheckCircle, AlertCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { checkAccountName, registerAccount, ApiError } from "@/lib/api";

interface RegisterScreenProps {
  deviceId: string;
  onRegistered: () => void;
}

export function RegisterScreen({ deviceId, onRegistered }: RegisterScreenProps) {
  const [accountName, setAccountName] = useState("");
  const [checkStatus, setCheckStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const handleCheck = async () => {
    const name = accountName.trim();
    if (name.length < 2) {
      setCheckStatus("idle");
      setMessage("アカウント名は2文字以上で入力してください");
      setSuggestions([]);
      return;
    }

    setCheckStatus("checking");
    setMessage("");
    setSuggestions([]);
    setRegisterError("");

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

  const handleRegister = async () => {
    const name = accountName.trim();
    if (name.length < 2) {
      setRegisterError("アカウント名は2文字以上で入力してください");
      return;
    }

    setRegistering(true);
    setRegisterError("");

    try {
      await registerAccount(deviceId, name);
      onRegistered();
    } catch (err) {
      const apiErr = err as ApiError;
      setRegisterError(apiErr.message);
      if (apiErr.suggestions) {
        setSuggestions(apiErr.suggestions);
        setCheckStatus("taken");
      }
    } finally {
      setRegistering(false);
    }
  };

  const useSuggestion = (suggestion: string) => {
    setAccountName(suggestion);
    setCheckStatus("idle");
    setMessage("");
    setSuggestions([]);
    setRegisterError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-forest-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-forest-600 rounded-3xl shadow-lg mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-forest-800 mb-2">
            ゴルフ証拠画像管理
          </h1>
          <p className="text-sm text-forest-600">
            ドラコン賞・ニアピン賞の記録を残そう
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-forest-100">
          <h2 className="text-lg font-bold text-forest-800 mb-1">
            アカウント登録
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            あなたのアカウント名を設定してください
          </p>

          {/* Name input + check button */}
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="アカウント名"
                value={accountName}
                onChange={(e) => {
                  setAccountName(e.target.value);
                  setCheckStatus("idle");
                  setMessage("");
                  setSuggestions([]);
                  setRegisterError("");
                }}
                maxLength={30}
              />
            </div>
            <Button
              variant="outline"
              onClick={handleCheck}
              loading={checkStatus === "checking"}
              disabled={!accountName.trim() || checkStatus === "checking"}
              className="shrink-0"
            >
              重複確認
            </Button>
          </div>

          {/* Status message */}
          {message && (
            <div
              className={`flex items-start gap-2 p-3 rounded-xl text-sm mb-4 ${
                checkStatus === "available"
                  ? "bg-forest-50 text-forest-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {checkStatus === "available" ? (
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <span>{message}</span>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">
                こちらの候補名はいかがですか？
              </p>
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
            </div>
          )}

          {/* Register error */}
          {registerError && (
            <div className="flex items-start gap-2 p-3 rounded-xl text-sm mb-4 bg-red-50 text-red-600">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{registerError}</span>
            </div>
          )}

          {/* Register button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleRegister}
            loading={registering}
            disabled={
              !accountName.trim() ||
              registering ||
              checkStatus === "taken"
            }
          >
            <User className="w-5 h-5 mr-2" />
            アカウント名を登録
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          端末IDで自動識別されます。パスワードは不要です。
        </p>
      </div>
    </div>
  );
}
