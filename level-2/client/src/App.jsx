import { useEffect, useState } from "react";

export default function App() {
  const [result, setResult] = useState("Checking the API...");

  useEffect(() => {
    // Not logged in yet, so we expect a 401. That still proves the proxy works.
    fetch("/api/auth/me")
      .then(async (res) => {
        const body = await res.json();
        setResult(`HTTP ${res.status}: ${JSON.stringify(body)}`);
      })
      .catch((err) => setResult(`Failed: ${err.message}`));
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-blue-700">HelpDesk</h1>
        <p className="mt-2 text-sm text-slate-600">React + Tailwind is running.</p>
        <p className="mt-4 rounded bg-slate-50 p-3 font-mono text-xs text-slate-800">
          {result}
        </p>
      </div>
    </div>
  );
}