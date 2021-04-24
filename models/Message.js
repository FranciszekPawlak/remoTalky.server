const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Group",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  seen: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  createDate: {
    type: Date,
    default: Date.now,
    require: true,
  },
});

module.exports = mongoose.model("Message", MessageSchema);
