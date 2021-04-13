const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  avatar: {
    type: String,
    required: false,
  },
  createDate: {
    type: Date,
    default: Date.now,
  },
  lastUpdate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Conversation", ConversationSchema);
