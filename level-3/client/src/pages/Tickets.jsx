import { useState } from "react";
import { Link } from "react-router";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import Alert from "../components/Alert";
import Button from "../components/Button";
import TicketCard from "../components/TicketCard";

const FILTERS = ["all", "open", "in_progress", "resolved", "closed"];

export default function Tickets() {
  const { user } = useAuth();
  const isStaff = user.role !== "customer";

  const [status, setStatus] = useState("all");
  const path = status === "all" ? "/tickets" : `/tickets?status=${status}`;
  const { data: tickets, loading, error } = useApi(path);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{isStaff ? "All tickets" : "My tickets"}</h1>
        <Link
          to="/tickets/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New ticket
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f}
            type="button"
            variant={status === f ? "primary" : "ghost"}
            onClick={() => setStatus(f)}
            className="px-3 py-1 capitalize"
          >
            {f.replace("_", " ")}
          </Button>
        ))}
      </div>

      {loading && <p className="text-slate-500">Loading tickets...</p>}
      <Alert>{error && `Could not load tickets: ${error.message}`}</Alert>

      {tickets && tickets.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-slate-500 shadow">
          {status === "all" ? "No tickets yet." : "No tickets match this filter."}
        </p>
      )}

      {tickets && tickets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} showOwner={isStaff} />
          ))}
        </div>
      )}
    </div>
  );
}