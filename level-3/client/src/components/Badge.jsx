const STYLES = {
  status: {
    open: "bg-blue-100 text-blue-800",
    in_progress: "bg-amber-100 text-amber-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-slate-200 text-slate-700",
  },
  priority: {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  },
};

export default function Badge({ type, value }) {
  const style = STYLES[type]?.[value] ?? "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${style}`}
    >
      {value.replace("_", " ")}
    </span>
  );
}