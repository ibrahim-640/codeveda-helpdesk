import { Route, Routes } from "react-router";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import NewTicket from "./pages/NewTicket";
import TicketDetail from "./pages/TicketDetail";
import Tickets from "./pages/Tickets";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Users from "./pages/Users";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-4xl p-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

                    {/* Everything inside needs a login */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Tickets />} />
            <Route path="/tickets/new" element={<NewTicket />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
          </Route>
                    {/* Admin only: other roles are redirected to "/" */}
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/users" element={<Users />} />
          </Route>
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </div>
  );
}