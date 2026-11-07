const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 401 = "I don't know who you are"
async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Load the user so deleted accounts and role changes take effect at once
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// 403 = "I know who you are, and you aren't allowed"
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "You do not have permission to do this" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };