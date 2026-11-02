import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "../api";
import Alert from "../components/Alert";
import Button from "../components/Button";
import FormField from "../components/FormField";

export default function NewTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const ticket = await api("/tickets", { method: "POST", body: form });
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-xl bg-white p-6 shadow">
      <h1 className="mb-4 text-xl font-bold">New ticket</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert>{error}</Alert>
        <FormField
          id="title"
          label="Title"
          value={form.title}
          onChange={update("title")}
          required
          minLength={3}
          maxLength={100}
        />
        <FormField
          id="description"
          label="Description"
          multiline
          value={form.description}
          onChange={update("description")}
          required
          minLength={5}
          maxLength={2000}
        />
        <div>
          <label htmlFor="priority" className="mb-1 block text-sm font-medium text-slate-700">
            Priority
          </label>
          <select
            id="priority"
            value={form.priority}
            onChange={update("priority")}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create ticket"}
          </Button>
          <Link to="/" className="text-sm text-slate-600 hover:underline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}