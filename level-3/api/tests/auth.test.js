const request = require("supertest");
const { app } = require("../server");
const {
  PASSWORD,
  connectTestDb,
  disconnectTestDb,
  makeUser,
} = require("./helpers");

beforeAll(connectTestDb);
afterAll(disconnectTestDb);

describe("signup", () => {
  const body = {
    name: "Sneaky Person",
    email: "sneaky@test.example",
    password: "password123",
  };

  test("always creates a customer, even if the request asks for admin", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...body, role: "admin" });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe("customer");
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  test("rejects an email that is already registered", async () => {
    const res = await request(app).post("/api/auth/signup").send(body);
    expect(res.status).toBe(409);
  });

  test("rejects a short password", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...body, email: "short@test.example", password: "short" });
    expect(res.status).toBe(400);
  });

  test("rejects an invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...body, email: "not-an-email" });
    expect(res.status).toBe(400);
  });

  test("rejects an object where an email is expected (NoSQL injection)", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...body, email: { $ne: "" } });
    expect(res.status).toBe(400);
  });
});

describe("login", () => {
  test("wrong password and unknown email give the same message", async () => {
    const { email } = await makeUser("customer");
    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "not-the-password" });
    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.example", password: PASSWORD });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error).toBe(unknownEmail.body.error);
  });

  test("sets an HttpOnly, SameSite=Lax cookie", async () => {
    const { email } = await makeUser("customer");
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("passwordHash");

    const cookie = res.headers["set-cookie"].join(";");
    expect(cookie).toMatch(/token=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  test("/me works while logged in and stops after logout", async () => {
    const { email } = await makeUser("customer");
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({ email, password: PASSWORD });

    expect((await agent.get("/api/auth/me")).status).toBe(200);
    expect((await agent.post("/api/auth/logout")).status).toBe(200);
    expect((await agent.get("/api/auth/me")).status).toBe(401);
  });
});

describe("server", () => {
  test("health check reports the database as connected", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.database).toBe("connected");
  });

  test("rejects oversized request bodies with 413", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a".repeat(20000), password: "x" });
    expect(res.status).toBe(413);
  });

  test("unknown API routes return a JSON 404", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Route not found");
  });
});