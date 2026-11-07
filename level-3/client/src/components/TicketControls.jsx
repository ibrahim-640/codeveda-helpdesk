import { useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../api";
import { useApi } from "../hooks/useApi";
import Alert from "./Alert";
import Button from "./Button";

const STATUSES = ["open", "in_progress", "resolved", "closed"];
const PRIORITIES = ["low", "medium", "high"];

const SELECT_CLASS =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50";

function Select({ id, label, value, options, onChange, disabled, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={SELECT_CLASS}
      >
        {children ??
          options.map((o) => (
            <option key={o} value={o}>
              {o.replace("_", " ")}
            </option>
          ))}
      </select>
    </div>
  );
}

// Only rendered for admins, so the /users request only happens for them
function AssigneeSelect({ value, onChange, disabled }) {
  const { data: users, error } = useApi("/users");
  const staff = users?.filter((u) => u.role !== "customer") ?? [];

  return (
    <div>
      <Select
        id="assignee"
        label="Assigned to"
        value={value ?? ""}
        onChange={(v) => onChange(v === "" ? null : v)}
        disabled={disabled || !users}
      >
        <option value="">Unassigned</option>
        {staff.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.role})
          </option>
        ))}
      </Select>
      {error && (
        <p className="mt-1 text-xs text-red-600">Could not load staff: {error.message}</p>
      )}
    </div>
  );
}

export default function TicketControls({ ticket, user, onChanged }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isAdmin = user.role === "admin";

  async function update(changes) {
    setError("");
    setBusy(true);
    try {
      await api(`/tickets/${ticket.id}`, { method: "PUT", body: changes });
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this ticket and all its comments?")) return;
    setError("");
    setBusy(true);
    try {
      await api(`/tickets/${ticket.id}`, { method: "DELETE" });
      navigate("/");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
      <h2 className="mb-4 text-lg font-semibold text-blue-900">Staff controls</h2>
      <Alert>{error}</Alert>

      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          id="status"
          label="Status"
          value={ticket.status}
          options={STATUSES}
          onChange={(status) => update({ status })}
          disabled={busy}
        />
        <Select
          id="priority"
          label="Priority"
          value={ticket.priority}
          options={PRIORITIES}
          onChange={(priority) => update({ priority })}
          disabled={busy}
        />
        {isAdmin && (
          <AssigneeSelect
            value={ticket.assignedTo?.id}
            onChange={(assignedTo) => update({ assignedTo })}
            disabled={busy}
          />
        )}
      </div>

      {isAdmin && (
        <div className="mt-4">
          <Button variant="danger" onClick={remove} disabled={busy}>
            Delete ticket
          </Button>
        </div>
      )}
    </section>
  );
}