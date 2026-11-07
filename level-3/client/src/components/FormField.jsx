const CLASSES =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function FormField({ label, id, multiline = false, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {multiline ? (
        <textarea id={id} rows={5} className={CLASSES} {...props} />
      ) : (
        <input id={id} className={CLASSES} {...props} />
      )}
    </div>
  );
}