import { useApi } from "../hooks/useApi";
import Alert from "../components/Alert";
import BarChart from "../components/BarChart";
import Button from "../components/Button";
import StatCard from "../components/StatCard";

// Full class names so Tailwind can see them
const STATUS_BARS = {
  open: "bg-blue-500",
  in_progress: "bg-amber-500",
  resolved: "bg-green-500",
  closed: "bg-slate-400",
};
const PRIORITY_BARS = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
};

function formatDuration(hours) {
  if (hours === null || hours === undefined) return "No data yet";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} days`;
}

export default function Stats() {
  const { data, loading, error, reload } = useApi("/stats");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <Button variant="ghost" onClick={reload}>
          Refresh
        </Button>
      </div>

      {loading && <p className="text-slate-500">Loading statistics...</p>}
      <Alert>{error && `Could not load statistics: ${error.message}`}</Alert>

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total tickets" value={data.totals.total} />
            <StatCard
              label="Active"
              value={data.totals.active}
              hint="Open or in progress"
            />
            <StatCard
              label="Unassigned"
              value={data.totals.unassigned}
              hint="Active, nobody assigned"
            />
            <StatCard
              label="Avg. time to resolve"
              value={formatDuration(data.totals.avgResolutionHours)}
              hint={`${data.totals.resolved} resolved tickets`}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <BarChart
              title="By status"
              items={Object.entries(data.byStatus).map(([key, value]) => ({
                label: key.replace("_", " "),
                value,
                barClass: STATUS_BARS[key],
              }))}
            />
            <BarChart
              title="By priority"
              items={Object.entries(data.byPriority).map(([key, value]) => ({
                label: key,
                value,
                barClass: PRIORITY_BARS[key],
              }))}
            />
          </div>

          <BarChart
            title="Tickets opened, last 7 days"
            items={data.perDay.map((d) => ({
              label: new Date(`${d.date}T00:00:00Z`).toLocaleDateString(undefined, {
                weekday: "short",
                day: "numeric",
                timeZone: "UTC",
              }),
              value: d.count,
            }))}
          />

          <section className="overflow-x-auto rounded-xl bg-white shadow">
            <h2 className="p-4 pb-2 font-semibold">Staff workload</h2>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Role</th>
                  <th className="px-4 py-2 font-medium">Active</th>
                  <th className="px-4 py-2 font-medium">Total assigned</th>
                </tr>
              </thead>
              <tbody>
                {data.agents.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2">{a.name}</td>
                    <td className="px-4 py-2 capitalize text-slate-600">{a.role}</td>
                    <td className="px-4 py-2 font-medium">{a.active}</td>
                    <td className="px-4 py-2">{a.assigned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}