import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h1 className="text-xl font-bold">Welcome, {user.name}</h1>
      <p className="mt-1 text-sm text-slate-600">
        You are signed in as <span className="font-semibold">{user.role}</span>.
      </p>
      <p className="mt-4 text-sm text-slate-500">
        The ticket list arrives in the next step.
      </p>
    </div>
  );
}