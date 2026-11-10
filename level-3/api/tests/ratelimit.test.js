const request = require("supertest");
const { app } = require("../server");
const { connectTestDb, disconnectTestDb } = require("./helpers");

beforeAll(connectTestDb);
afterAll(disconnectTestDb);

test("the 11th failed login in a row is blocked with 429", async () => {
  const statuses = [];
  for (let i = 0; i < 11; i++) {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.example", password: "wrong-password" });
    statuses.push(res.status);
  }
  expect(statuses.slice(0, 10)).toEqual(Array(10).fill(401));
  expect(statuses[10]).toBe(429);
}, 60000);