const request = require("supertest");
const { app } = require("../server");
const User = require("../models/User");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const {
  connectTestDb,
  disconnectTestDb,
  makeUser,
  loginAs,
  waitFor,
} = require("./helpers");

let customerA, customerB, agent, admin, ticketA, ticketB;

beforeAll(async () => {
  await connectTestDb();
  customerA = await loginAs("customer");
  customerB = await loginAs("customer");
  agent = await loginAs("agent");
  admin = await loginAs("admin");

  const a = await customerA.agent
    .post("/api/tickets")
    .send({ title: "Ticket from A", description: "Created by customer A" });
  const b = await customerB.agent
    .post("/api/tickets")
    .send({ title: "Ticket from B", description: "Created by customer B" });
  ticketA = a.body;
  ticketB = b.body;
});

afterAll(disconnectTestDb);

describe("not logged in", () => {
  test.each([
    ["get", "/api/tickets"],
    ["post", "/api/tickets"],
    ["get", "/api/users"],
    ["get", "/api/stats"],
    ["get", "/api/notifications"],
  ])("%s %s is refused with 401", async (method, path) => {
    const res = await request(app)[method](path);
    expect(res.status).toBe(401);
  });
});

describe("customer", () => {
  test("sees only their own tickets", async () => {
    const res = await customerA.agent.get("/api/tickets");
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].id).toBe(ticketA.id);
  });

  test("gets 404, not 403, for another customer's ticket", async () => {
    const res = await customerA.agent.get(`/api/tickets/${ticketB.id}`);
    expect(res.status).toBe(404);
  });

  test("cannot comment on another customer's ticket", async () => {
    const res = await customerA.agent
      .post(`/api/tickets/${ticketB.id}/comments`)
      .send({ text: "Let me in" });
    expect(res.status).toBe(404);
  });

  test("can comment on their own ticket", async () => {
    const res = await customerA.agent
      .post(`/api/tickets/${ticketA.id}/comments`)
      .send({ text: "Any update?" });
    expect(res.status).toBe(201);
    expect(res.body.author.name).toBe(customerA.user.name);
  });

  test("cannot update or delete tickets", async () => {
    const put = await customerA.agent
      .put(`/api/tickets/${ticketA.id}`)
      .send({ status: "resolved" });
    const del = await customerA.agent.delete(`/api/tickets/${ticketA.id}`);
    expect(put.status).toBe(403);
    expect(del.status).toBe(403);
  });

  test("cannot reach admin endpoints", async () => {
    const users = await customerA.agent.get("/api/users");
    const stats = await customerA.agent.get("/api/stats");
    const promote = await customerA.agent
      .patch(`/api/users/${customerB.user.id}/role`)
      .send({ role: "admin" });
    expect(users.status).toBe(403);
    expect(stats.status).toBe(403);
    expect(promote.status).toBe(403);
    expect((await User.findById(customerB.user._id)).role).toBe("customer");
  });
});

describe("agent", () => {
  test("sees every ticket", async () => {
    const res = await agent.agent.get("/api/tickets");
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
  });

  test("changing status updates the ticket and notifies only its owner", async () => {
    const res = await agent.agent
      .put(`/api/tickets/${ticketA.id}`)
      .send({ status: "in_progress" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("in_progress");

    const ownerCount = await waitFor(() =>
      Notification.countDocuments({ user: customerA.user._id, type: "status" })
    );
    expect(ownerCount).toBe(1);
    expect(await Notification.countDocuments({ user: customerB.user._id })).toBe(0);
    expect(await Notification.countDocuments({ user: agent.user._id })).toBe(0);
  });

  test("cannot assign tickets (admins only)", async () => {
    const res = await agent.agent
      .put(`/api/tickets/${ticketA.id}`)
      .send({ assignedTo: agent.user.id });
    expect(res.status).toBe(403);
  });

  test("cannot delete tickets", async () => {
    const res = await agent.agent.delete(`/api/tickets/${ticketA.id}`);
    expect(res.status).toBe(403);
  });

  test("cannot reach admin endpoints", async () => {
    expect((await agent.agent.get("/api/users")).status).toBe(403);
    expect((await agent.agent.get("/api/stats")).status).toBe(403);
  });
});

describe("admin", () => {
  test("can assign a ticket to an agent, who is notified", async () => {
    const res = await admin.agent
      .put(`/api/tickets/${ticketA.id}`)
      .send({ assignedTo: agent.user.id });
    expect(res.status).toBe(200);
    expect(res.body.assignedTo.id).toBe(agent.user.id);

    const count = await waitFor(() =>
      Notification.countDocuments({ user: agent.user._id, type: "assigned" })
    );
    expect(count).toBe(1);
    // the person who made the change is never notified about it
    expect(await Notification.countDocuments({ user: admin.user._id })).toBe(0);
  });

  test("cannot assign a ticket to a customer", async () => {
    const res = await admin.agent
      .put(`/api/tickets/${ticketA.id}`)
      .send({ assignedTo: customerA.user.id });
    expect(res.status).toBe(400);
  });

  test("lists users without password hashes", async () => {
    const res = await admin.agent.get("/api/users");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
  });

  test("cannot change their own role", async () => {
    const res = await admin.agent
      .patch(`/api/users/${admin.user.id}/role`)
      .send({ role: "customer" });
    expect(res.status).toBe(400);
  });

  test("rejects an invalid role", async () => {
    const target = await makeUser("customer");
    const res = await admin.agent
      .patch(`/api/users/${target.user.id}/role`)
      .send({ role: "superuser" });
    expect(res.status).toBe(400);
  });

  test("can promote a customer to agent", async () => {
    const target = await makeUser("customer");
    const res = await admin.agent
      .patch(`/api/users/${target.user.id}/role`)
      .send({ role: "agent" });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe("agent");
  });

  test("gets dashboard statistics", async () => {
    const res = await admin.agent.get("/api/stats");
    expect(res.status).toBe(200);
    expect(res.body.totals.total).toBeGreaterThanOrEqual(2);
    expect(Object.keys(res.body.byStatus).sort()).toEqual(
      ["closed", "in_progress", "open", "resolved"]
    );
  });

  test("deleting a ticket also deletes its comments", async () => {
    await customerB.agent
      .post(`/api/tickets/${ticketB.id}/comments`)
      .send({ text: "To be deleted" });
    expect(await Comment.countDocuments({ ticket: ticketB.id })).toBe(1);

    const res = await admin.agent.delete(`/api/tickets/${ticketB.id}`);
    expect(res.status).toBe(204);
    expect(await Comment.countDocuments({ ticket: ticketB.id })).toBe(0);
    expect((await admin.agent.get(`/api/tickets/${ticketB.id}`)).status).toBe(404);
  });
});

describe("security", () => {
  test("a role changed in the database applies immediately", async () => {
    const staff = await loginAs("agent");
    const before = await staff.agent
      .put(`/api/tickets/${ticketA.id}`)
      .send({ status: "in_progress" });
    expect(before.status).toBe(200);

    await User.updateOne({ _id: staff.user._id }, { role: "customer" });

    const after = await staff.agent
      .put(`/api/tickets/${ticketA.id}`)
      .send({ status: "resolved" });
    expect(after.status).toBe(403);
  });

  test("a deleted user's cookie stops working", async () => {
    const temp = await loginAs("customer");
    expect((await temp.agent.get("/api/auth/me")).status).toBe(200);
    await User.deleteOne({ _id: temp.user._id });
    expect((await temp.agent.get("/api/auth/me")).status).toBe(401);
  });

  test("query operators in filters never reach MongoDB", async () => {
    // make sure at least one ticket is NOT open
    await admin.agent
      .put(`/api/tickets/${ticketA.id}`)
      .send({ status: "in_progress" });

    const res = await admin.agent.get("/api/tickets?status[$eq]=open");
    if (res.status === 200) {
      // filter was ignored: the non-open ticket is still listed
      expect(res.body.items.some((t) => t.status !== "open")).toBe(true);
    } else {
      expect(res.status).toBe(400);
    }
  });

  test("pagination input is validated and capped", async () => {
    expect((await admin.agent.get("/api/tickets?page=0")).status).toBe(400);
    const res = await admin.agent.get("/api/tickets?limit=1000");
    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(50);
  });
});