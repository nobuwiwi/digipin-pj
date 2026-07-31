import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Search, UserCheck, UserPlus, Clock, Check, X, RefreshCw } from "lucide-react";
import {
  getRepresentatives,
  getFriends,
  searchAccounts,
  requestRepresentative,
  updateRepresentativeStatus,
  ApiError,
} from "@/lib/api";
import type { RepresentativeWithAccount, FriendWithAccount, RepresentativeStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface RepresentativeManageScreenProps {
  deviceId: string;
  competitionId: string;
  onBack: () => void;
}

export function RepresentativeManageScreen({
  deviceId,
  competitionId,
  onBack,
}: RepresentativeManageScreenProps) {
  const [representatives, setRepresentatives] = useState<RepresentativeWithAccount[]>([]);
  const [friends, setFriends] = useState<FriendWithAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ device_id: string; account_name: string }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [repRes, friendRes] = await Promise.all([
        getRepresentatives(deviceId, competitionId),
        getFriends(deviceId),
      ]);
      setRepresentatives(repRes.representatives ?? []);
      setFriends(friendRes.friends ?? []);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
    } finally {
      setLoading(false);
    }
  }, [deviceId, competitionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    setSearchLoading(true);
    setHasSearched(true);
    setError("");
    try {
      const res = await searchAccounts(deviceId, searchQuery.trim());
      setSearchResults(res.accounts ?? []);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRequest = async (targetDeviceId: string) => {
    setActionLoading(targetDeviceId);
    try {
      await requestRepresentative(deviceId, competitionId, targetDeviceId);
      await fetchData();
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (repId: string, status: RepresentativeStatus) => {
    setActionLoading(repId);
    try {
      await updateRepresentativeStatus(deviceId, repId, status);
      await fetchData();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
    } finally {
      setActionLoading(null);
    }
  };

  const approvedReps = representatives.filter((r) => r.status === "approved");
  const pendingReps = representatives.filter((r) => r.status === "pending");
  const rejectedReps = representatives.filter((r) => r.status === "rejected");

  // Representative candidates: friends who haven't requested yet
  const repDeviceIds = new Set(representatives.map((r) => r.representative_id));
  const candidates = friends.filter((f) => !repDeviceIds.has(f.device_id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-forest-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-forest-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-forest-100">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
          <button type="button"
            onClick={onBack}
            className="p-2 -ml-2 text-forest-700 hover:bg-forest-50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-forest-800">代表者招待</h1>
          <button type="button"
            onClick={fetchData}
            className="ml-auto p-2 text-forest-600 hover:bg-forest-50 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-forest-50">
          <h2 className="text-sm font-bold text-forest-800 mb-3">アカウント名検索</h2>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="アカウント名で検索"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              variant="outline"
              onClick={handleSearch}
              disabled={!searchQuery.trim()}
              className="shrink-0"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* Search Results */}
          {searchLoading && (
            <div className="mt-3 flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-forest-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-sm text-forest-600">検索中...</span>
            </div>
          )}
          {!searchLoading && hasSearched && searchResults.length === 0 && (
            <div className="mt-3 text-center py-4">
              <p className="text-sm text-gray-400">
                「{searchQuery}」に一致するアカウントが見つかりませんでした
              </p>
            </div>
          )}
          {!searchLoading && searchResults.length > 0 && (
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {searchResults.map((account) => {
                const alreadyRep = representatives.find((r) => r.representative_id === account.device_id);
                return (
                  <div
                    key={account.device_id}
                    className="flex items-center justify-between p-3 bg-forest-50 rounded-xl"
                  >
                    <span className="text-sm font-medium text-forest-800">{account.account_name}</span>
                    {alreadyRep ? (
                      <span className="text-xs text-gray-500">
                        {alreadyRep.status === "approved" ? "承認済み" : alreadyRep.status === "pending" ? "申請中" : "拒否済み"}
                      </span>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleRequest(account.device_id)}
                        loading={actionLoading === account.device_id}
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1" />
                        申請
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Representative List (Approved) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-forest-50">
          <h2 className="text-sm font-bold text-forest-800 mb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-forest-600" />
            代表者一覧
          </h2>
          {approvedReps.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">代表者がいません</p>
          ) : (
            <div className="space-y-2">
              {approvedReps.map((rep) => (
                <div key={rep.id} className="flex items-center justify-between p-3 bg-forest-50 rounded-xl">
                  <div>
                    <span className="text-sm font-medium text-forest-800">
                      {rep.accounts?.account_name ?? "不明"}
                    </span>
                    <span className="ml-2 text-xs text-forest-600 bg-forest-100 px-2 py-0.5 rounded-full">
                      承認済み
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Requests */}
        {pendingReps.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-forest-50">
            <h2 className="text-sm font-bold text-forest-800 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              申請中
            </h2>
            <div className="space-y-2">
              {pendingReps.map((rep) => (
                <div key={rep.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                  <span className="text-sm font-medium text-forest-800">
                    {rep.accounts?.account_name ?? "不明"}
                  </span>
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={() => handleUpdateStatus(rep.id, "approved")}
                      disabled={actionLoading === rep.id}
                      className="p-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button type="button"
                      onClick={() => handleUpdateStatus(rep.id, "rejected")}
                      disabled={actionLoading === rep.id}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejected */}
        {rejectedReps.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-forest-50">
            <h2 className="text-sm font-bold text-forest-800 mb-3">拒否済み</h2>
            <div className="space-y-2">
              {rejectedReps.map((rep) => (
                <div key={rep.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-500">
                    {rep.accounts?.account_name ?? "不明"}
                  </span>
                  <span className="text-xs text-gray-400">拒否</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Representative Candidates (Friends) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-forest-50">
          <h2 className="text-sm font-bold text-forest-800 mb-3">代表者候補（フレンド）</h2>
          {candidates.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              フレンドがいません。アカウント名検索から代表者申請を行ってください。
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {candidates.map((friend) => (
                <div
                  key={friend.device_id}
                  className="flex items-center justify-between p-3 bg-forest-50 rounded-xl"
                >
                  <span className="text-sm font-medium text-forest-800">{friend.account_name}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRequest(friend.device_id)}
                    loading={actionLoading === friend.device_id}
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1" />
                    申請
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
