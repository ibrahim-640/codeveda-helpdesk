const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const request = require("supertest");
const { app } = require("../server");
const os = require("os");
const PASSWORD = "password123";
let counter = 0;

// Connects to the test database and empties it. Refuses to touch any database
// whose name doesn't end in "_test", so real data can never be wiped by mistake.
async function connectTestDb() {
    await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000, // fail with a readable error instead of hanging
    // mongodb driver 7.6+ loads `os` with a dynamic import() that Jest's sandbox
    // rejects, which empties the handshake (NODE-7832). Passing it in directly
    // gives the driver the same value it would get in plain Node.
    runtimeAdapters: { os },
  });
  const name = mongoose.connection.name;
  if (!name.endsWith("_test")) {
    await mongoose.disconnect();
    throw new Error(`Refusing to run tests against database "${name}"`);
  }
  const models = Object.values(mongoose.models);
  await Promise.all(models.map((m) => m.init())); // make sure indexes exist
  await Promise.all(models.map((m) => m.deleteMany({})));
}

async function disconnectTestDb() {
  // let fire-and-forget notifications finish before the connection closes
  await new Promise((resolve) => setTimeout(resolve, 300));
  await mongoose.disconnect();
}

// Creates a user directly in the database (fast hash), without logging in.
async function makeUser(role = "customer") {
  const User = mongoose.model("User");
  counter += 1;
  const email = `${role}${counter}@test.example`;
  const user = await User.create({
    name: `${role} ${counter}`,
    email,
    passwordHash: await bcrypt.hash(PASSWORD, 4),
    role,
  });
  return { user, email };
}

// Creates a user and logs in through the real API. The agent keeps the cookie.
async function loginAs(role) {
  const { user, email } = await makeUser(role);
  const agent = request.agent(app);
  const res = await agent
    .post("/api/auth/login")
    .send({ email, password: PASSWORD });
  if (res.status !== 200) throw new Error(`Test login failed (${res.status})`);
  return { agent, user };
}

// Notifications are saved just after the response is sent, so poll briefly
async function waitFor(check, timeoutMs = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = await check();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return 0;
}

module.exports = {
  PASSWORD,
  connectTestDb,
  disconnectTestDb,
  makeUser,
  loginAs,
  waitFor,
};