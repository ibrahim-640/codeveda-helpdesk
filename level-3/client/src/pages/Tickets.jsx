import { useState } from "react";
import { Link } from "react-router";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import Alert from "../components/Alert";
import Button from "../components/Button";
import TicketCard from "../components/TicketCard";

const FILTERS = ["all", "open", "in_progress", "resolved", "closed"];
const PAGE_SIZE = 10;

export default function Tickets() {
  const { user } = useAuth();
  const isStaff = user.role !== "customer";

  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  if (status !== "all") params.set("status", status);

  const { data, loading, error } = useApi(`/tickets?${params}`);

  function changeFilter(next) {
    setStatus(next);
    setPage(1); // a new filter always starts from the first page
  }

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
            onClick={() => changeFilter(f)}
            className="px-3 py-1 capitalize"
          >
            {f.replace("_", " ")}
          </Button>
        ))}
      </div>

      {loading && <p className="text-slate-500">Loading tickets...</p>}
      <Alert>{error && `Could not load tickets: ${error.message}`}</Alert>

      {data && data.total === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-slate-500 shadow">
          {status === "all" ? "No tickets yet." : "No tickets match this filter."}
        </p>
      )}

      {data && data.items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.items.map((t) => (
            <TicketCard key={t.id} ticket={t} showOwner={isStaff} />
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            disabled={data.page <= 1}
            onClick={() => setPage(data.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-600">
            Page {data.page} of {data.pages} · {data.total} tickets
          </span>
          <Button
            type="button"
            variant="ghost"
            disabled={data.page >= data.pages}
            onClick={() => setPage(data.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}