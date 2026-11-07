import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../api";
import { socket } from "../socket";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import Alert from "../components/Alert";
import Badge from "../components/Badge";
import Button from "../components/Button";
import FormField from "../components/FormField";
import TicketControls from "../components/TicketControls";

// Adds a comment unless it's already there (own post + live event can both arrive)
const addUnique = (list, comment) =>
  list?.some((c) => c.id === comment.id) ? list : [...(list ?? []), comment];

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const ticketQuery = useApi(`/tickets/${id}`);
  const comments = useApi(`/tickets/${id}/comments`);
  const { data: ticket, loading, error } = ticketQuery;
  const { mutate: mutateTicket, reload: reloadTicket } = ticketQuery;
  const { mutate: mutateComments, reload: reloadComments } = comments;

  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  // Live updates: join this ticket's room while the page is open
  useEffect(() => {
    const join = () => socket.emit("ticket:join", id);
    const onComment = (comment) => {
      if (comment.ticket === id) mutateComments((list) => addUnique(list, comment));
    };
    const onTicket = (updated) => {
      if (updated.id === id) mutateTicket(() => updated);
    };
    // After a dropped connection events may have been missed, so refetch
    const onReconnect = () => {
      reloadTicket();
      reloadComments();
    };

    if (socket.connected) join();
    socket.on("connect", join); // rooms are lost on reconnect, so join again
    socket.on("comment:new", onComment);
    socket.on("ticket:updated", onTicket);
    socket.io.on("reconnect", onReconnect);

    return () => {
      socket.emit("ticket:leave", id);
      socket.off("connect", join);
      socket.off("comment:new", onComment);
      socket.off("ticket:updated", onTicket);
      socket.io.off("reconnect", onReconnect);
    };
  }, [id, mutateTicket, mutateComments, reloadTicket, reloadComments]);

  async function addComment(e) {
    e.preventDefault();
    setPostError("");
    setPosting(true);
    try {
      const created = await api(`/tickets/${id}/comments`, {
        method: "POST",
        body: { text },
      });
      setText("");
      mutateComments((list) => addUnique(list, created));
    } catch (err) {
      setPostError(err.message);
    } finally {
      setPosting(false);
    }
  }

  const back = (
    <Link to="/" className="text-sm text-blue-600 hover:underline">
      &larr; Back to tickets
    </Link>
  );

  if (loading) return <p className="text-slate-500">Loading ticket...</p>;

  if (error) {
    return (
      <div className="space-y-3">
        {back}
        <Alert>{error.message}</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {back}

      <section className="rounded-xl bg-white p-6 shadow">
        <div className="flex flex-wrap items-center gap-2">
          <Badge type="status" value={ticket.status} />
          <Badge type="priority" value={ticket.priority} />
        </div>
        <h1 className="mt-3 text-xl font-bold">{ticket.title}</h1>
        <p className="mt-2 whitespace-pre-wrap text-slate-700">{ticket.description}</p>
        <dl className="mt-4 grid gap-1 text-sm text-slate-500 sm:grid-cols-3">
          <div>
            <dt className="font-medium text-slate-600">Created by</dt>
            <dd>{ticket.createdBy?.name ?? "Deleted user"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">Assigned to</dt>
            <dd>{ticket.assignedTo?.name ?? "Unassigned"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">Created</dt>
            <dd>{new Date(ticket.createdAt).toLocaleString()}</dd>
          </div>
        </dl>
      </section>

      {user.role !== "customer" && (
        <TicketControls ticket={ticket} user={user} onChanged={reloadTicket} />
      )}

      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">Comments</h2>

        {comments.loading && <p className="text-slate-500">Loading comments...</p>}
        <Alert>
          {comments.error && `Could not load comments: ${comments.error.message}`}
        </Alert>

        {comments.data?.length === 0 && (
          <p className="text-sm text-slate-500">No comments yet.</p>
        )}

        <ul className="space-y-4">
          {comments.data?.map((c) => (
            <li key={c.id} className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{c.author?.name ?? "Deleted user"}</span>
                {c.author && c.author.role !== "customer" && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                    Staff
                  </span>
                )}
                <span className="text-xs text-slate-500">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{c.text}</p>
            </li>
          ))}
        </ul>

        <form onSubmit={addComment} className="mt-6 space-y-3">
          <Alert>{postError}</Alert>
          <FormField
            id="comment"
            label="Add a comment"
            multiline
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            maxLength={1000}
          />
          <Button type="submit" disabled={posting}>
            {posting ? "Posting..." : "Post comment"}
          </Button>
        </form>
      </section>
    </div>
  );
}