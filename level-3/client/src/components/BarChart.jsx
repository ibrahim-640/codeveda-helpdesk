export default function BarChart({ title, items }) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <section className="rounded-xl bg-white p-4 shadow">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 capitalize text-slate-600">
              {item.label}
            </span>
            <div className="h-3 flex-1 rounded-full bg-slate-100">
              <div
                className={`h-3 rounded-full ${item.barClass ?? "bg-blue-500"}`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
            <span className="w-8 text-right font-medium">{item.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}