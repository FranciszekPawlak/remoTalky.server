const MessageSchema = require("../models/Message");
const ConversationSchema = require("../models/Conversation");
const {
  addUser,
  getUser,
  deleteUser,
  getUsers,
  clearUsers,
  getUsersInConversation,
} = require("../helpers/conversationUser");

exports = module.exports = function (io) {
  io.sockets.on("connection", function (socket) {
    socket.on("joinConversation", (userId, conversationId) => {
      console.log("join");
      const { user, error } = addUser(socket.id, userId, conversationId);
      // if (error) return io.emit("message", { status: "error", data: error });
      socket.join(user.conversation);

      const query = MessageSchema.find({
        conversation: conversationId,
      })
        .populate("user", "username")
        .sort("createdDate");
      // .limit(40);

      query.exec(function (err, messages) {
        if (err) {
          socket.emit("initMessages", { status: "error", data: err });
        } else {
          socket.emit("initMessages", {
            status: "success",
            data: messages,
          });
        }
      });
    });

    socket.on("markMessagesAsSeen", () => {
      const { userId, conversation } = getUser(socket.id);
      if (conversation && userId) {
        MessageSchema.updateMany(
          {
            conversation: conversation,
            seen: { $ne: userId },
          },
          {
            $push: { seen: userId },
          },
          (err, messages) => {
            if (err) {
              console.error(err);
            }
          }
        );
      }
    });

    socket.on("typing", (action) => {
      if (!socket.id) {
        return;
      }
      const { conversation, userId } = getUser(socket.id);

      socket.to(conversation).emit("typing", { user: userId, status: action });
    });

    socket.on("leaveConversation", () => {
      console.log("disconnected");
      const user = getUser(socket.id);
      if (user) {
        deleteUser(user.id);
        socket.leave(user.conversation);
        if (io.sockets.sockets[socket.id]) {
          io.sockets.sockets[socket.id].disconnect();
        }
      }
    });

    socket.on("disconnect", () => {
      const user = getUser(socket.id);
      if (user) {
        deleteUser(user.id);
        socket.leave(user.conversation);
        if (io.sockets.sockets[socket.id]) {
          io.sockets.sockets[socket.id].disconnect();
        }
      }
    });

    socket.on("message", (message) => {
      const { conversation, userId } = getUser(socket.id);
      const usersInConversation = getUsersInConversation(conversation);

      ConversationSchema.findOne({ _id: conversation }, function (
        err,
        conversation
      ) {
        if (!err && conversation) {
          conversation.lastUpdate = Date.now();
          conversation.save((err) => {
            if (err) {
              console.error(err);
            }
          });
        }
      });

      const newMessage = new MessageSchema({
        text: message,
        conversation: conversation,
        user: userId,
        seen: usersInConversation.length > 1 ? usersInConversation : [userId],
      });
      newMessage.save((err, item) => {
        if (err) {
          io.to(socket.id).emit("message", { status: "error", data: err });
        } else {
          MessageSchema.findOne(item)
            .populate("user", "username")
            .exec((err, item) => {
              io.in(conversation).emit("message", {
                status: "success",
                data: item,
              });
            });
        }
      });
    });
  });
};
