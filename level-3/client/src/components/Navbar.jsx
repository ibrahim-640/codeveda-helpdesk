import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-blue-900 text-white">
      <nav className="mx-auto flex max-w-4xl items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-lg font-bold">
            HelpDesk
          </Link>
          {user?.role === "admin" && (
            <Link to="/users" className="text-sm hover:underline">
              Users
            </Link>
          )}
        </div>

        {user ? (
          <div className="flex items-center gap-2 text-sm sm:gap-3">
            <NotificationBell />
            <span className="hidden sm:inline">{user.name}</span>
            <span className="rounded-full bg-blue-700 px-2 py-0.5 text-xs uppercase">
              {user.role}
            </span>
            <Button variant="ghost" onClick={logout} className="whitespace-nowrap">
              Log out
            </Button>
          </div>
        ) : (
          <div className="flex gap-4 text-sm">
            <Link to="/login">Log in</Link>
            <Link to="/signup">Sign up</Link>
          </div>
        )}
      </nav>
    </header>
  );
}