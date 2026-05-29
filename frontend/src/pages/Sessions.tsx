import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { laravelApi } from "../lib/laravelApi";

interface Session {
  id: number;
  token_id: string;
  ip_address: string;
  user_agent: string | null;
  device: string;
  last_active: string;
  created_at: string;
  is_current: boolean;
  revoked: boolean;
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<Set<string>>(new Set());
  useAuth();

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await laravelApi.getSessions();
      setSessions(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (tokenId: string) => {
    setRevoking((prev) => new Set(prev).add(tokenId));
    try {
      await laravelApi.revokeSession(tokenId);

      setSessions((prev) =>
        prev.map((s) =>
          s.token_id === tokenId ? { ...s, revoked: true } : s
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to revoke session");
    } finally {
      setRevoking((prev) => {
        const next = new Set(prev);
        next.delete(tokenId);
        return next;
      });
    }
  };

  const revokeAllOthers = async () => {
    try {
      await laravelApi.revokeOtherSessions();

      setSessions((prev) =>
        prev.map((s) => ({ ...s, revoked: !s.is_current }))
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to revoke sessions"
      );
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Active Sessions</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Active Sessions</h1>
        {sessions.filter((s) => !s.is_current && !s.revoked).length > 0 && (
          <button
            onClick={revokeAllOthers}
            className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Revoke All Others
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`border rounded-lg p-4 ${
              session.revoked
                ? "bg-gray-50 border-gray-200"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {session.device}
                  </span>
                  {session.is_current && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                      Current
                    </span>
                  )}
                  {session.revoked && (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                      Revoked
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {session.ip_address}
                </p>
                {session.user_agent && (
                  <p className="text-xs text-gray-400 mt-1 truncate max-w-md">
                    {session.user_agent}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Last active: {session.last_active}
                </p>
              </div>

              {!session.is_current && !session.revoked && (
                <button
                  onClick={() => revokeSession(session.token_id)}
                  disabled={revoking.has(session.token_id)}
                  className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                >
                  {revoking.has(session.token_id) ? "Revoking..." : "Revoke"}
                </button>
              )}
            </div>
          </div>
        ))}

        {sessions.length === 0 && (
          <p className="text-gray-500 text-center py-8">No sessions found.</p>
        )}
      </div>
    </div>
  );
}