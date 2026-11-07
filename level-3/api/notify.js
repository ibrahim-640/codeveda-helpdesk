const Notification = require("./models/Notification");
const { emitToUser } = require("./socket");

// Saves a notification for each recipient and pushes it to their private room.
// The person who caused the event is never notified about it.
async function notify({ actor, ticket, recipients, type, message }) {
  try {
    const ids = [...new Set(recipients.filter(Boolean).map(String))].filter(
      (id) => id !== String(actor._id)
    );
    if (ids.length === 0) return;

    const docs = await Notification.insertMany(
      ids.map((user) => ({ user, ticket: ticket._id, type, message }))
    );
    for (const doc of docs) emitToUser(doc.user, "notification:new", doc.toJSON());
  } catch (err) {
    // A failed notification must never break the request that triggered it
    console.error("Notification failed:", err.message);
  }
}

module.exports = { notify };