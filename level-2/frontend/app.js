const API = "/tickets";
const STATUSES = ["open", "in_progress", "resolved", "closed"];

const form = document.getElementById("ticket-form");
const formMessage = document.getElementById("form-message");
const listMessage = document.getElementById("list-message");
const list = document.getElementById("ticket-list");

// Wrapper around fetch that throws a readable error for non-2xx responses
async function request(url, options) {
  const res = await fetch(url, options);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function loadTickets() {
  listMessage.textContent = "Loading...";
  listMessage.className = "";
  try {
    const tickets = await request(API);
    render(tickets);
  } catch (err) {
    listMessage.textContent = `Could not load tickets: ${err.message}`;
    listMessage.className = "error";
  }
}

function render(tickets) {
  list.replaceChildren();
  listMessage.textContent = tickets.length ? "" : "No tickets yet.";
  tickets.forEach((t) => list.appendChild(createCard(t)));
}

function createCard(ticket) {
  const card = document.createElement("article");
  card.className = "ticket";

  const badge = document.createElement("span");
  badge.className = `badge ${ticket.priority}`;
  badge.textContent = ticket.priority;

  const title = document.createElement("h3");
  title.textContent = ticket.title;

  const desc = document.createElement("p");
  desc.textContent = ticket.description;

  const select = document.createElement("select");
  STATUSES.forEach((s) => {
    const option = document.createElement("option");
    option.value = s;
    option.textContent = s.replace("_", " ");
    option.selected = s === ticket.status;
    select.appendChild(option);
  });
  select.addEventListener("change", async () => {
    try {
      await request(`${API}/${ticket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: select.value }),
      });
    } catch (err) {
      alert(err.message);
      loadTickets();
    }
  });

  const del = document.createElement("button");
  del.className = "danger";
  del.textContent = "Delete";
  del.addEventListener("click", async () => {
    if (!confirm("Delete this ticket?")) return;
    try {
      await request(`${API}/${ticket.id}`, { method: "DELETE" });
      loadTickets();
    } catch (err) {
      alert(err.message);
    }
  });

  const actions = document.createElement("div");
  actions.className = "actions";
  actions.append(select, del);

  card.append(badge, title, desc, actions);
  return card;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.textContent = "";
  try {
    await request(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.value.trim(),
        description: form.description.value.trim(),
        priority: form.priority.value,
      }),
    });
    form.reset();
    formMessage.textContent = "Ticket created.";
    formMessage.className = "success";
    loadTickets();
  } catch (err) {
    formMessage.textContent = err.message;
    formMessage.className = "error";
  }
});

loadTickets();