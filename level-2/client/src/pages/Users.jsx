import { useState } from "react";
import { api } from "../api";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import Alert from "../components/Alert";

const ROLES = ["customer", "agent", "admin"];

export default function Users() {
  const { user: me } = useAuth();
  const { data: users, loading, error, reload } = useApi("/users");
  const [message, setMessage] = useState({ type: "success", text: "" });
  const [busyId, setBusyId] = useState(null);

  async function changeRole(target, role) {
    setMessage({ type: "success", text: "" });
    setBusyId(target.id);
    try {
      await api(`/users/${target.id}/role`, { method: "PATCH", body: { role } });
      setMessage({ type: "success", text: `${target.name} is now ${role}.` });
      reload();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Users</h1>

      <div className="mb-4">
        <Alert type={message.type}>{message.text}</Alert>
      </div>

      {loading && <p className="text-slate-500">Loading users...</p>}
      <Alert>{error && `Could not load users: ${error.message}`}</Alert>

      {users && (
        <div className="overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isMe = u.id === me.id;
                return (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      {u.name}
                      {isMe && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u, e.target.value)}
                        disabled={isMe || busyId === u.id}
                        aria-label={`Role for ${u.name}`}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm capitalize disabled:opacity-50"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}