// Tests always use their own throwaway database and a made-up secret.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-secret-test-only-secret-1234567890";
process.env.JWT_EXPIRES_IN = "1d";
process.env.MONGODB_URI =
  process.env.MONGODB_URI_TEST || "mongodb://127.0.0.1:27017/helpdesk_test";
process.env.DOTENV_CONFIG_QUIET = "true";