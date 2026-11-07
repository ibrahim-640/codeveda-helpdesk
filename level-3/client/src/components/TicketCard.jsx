import { Link } from "react-router";
import Badge from "./Badge";

export default function TicketCard({ ticket, showOwner = false }) {
  return (
    <Link
      to={`/tickets/${ticket.id}`}
      className="block rounded-xl bg-white p-4 shadow transition hover:shadow-md"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge type="status" value={ticket.status} />
        <Badge type="priority" value={ticket.priority} />
      </div>
      <h3 className="mt-2 font-semibold">{ticket.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{ticket.description}</p>
      <p className="mt-3 text-xs text-slate-500">
        {showOwner && ticket.createdBy ? `${ticket.createdBy.name} · ` : ""}
        {new Date(ticket.createdAt).toLocaleDateString()}
        {ticket.assignedTo ? ` · Assigned to ${ticket.assignedTo.name}` : ""}
      </p>
    </Link>
  );
}