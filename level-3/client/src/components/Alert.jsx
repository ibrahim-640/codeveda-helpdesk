const TYPES = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-green-200 bg-green-50 text-green-700",
};

export default function Alert({ type = "error", children }) {
  if (!children) return null;
  return (
    <p role="alert" className={`rounded-md border px-3 py-2 text-sm ${TYPES[type]}`}>
      {children}
    </p>
  );
}