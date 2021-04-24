const MessageSchema = require("../models/Message");
const GroupSchema = require("../models/Group");
const {
  addUser,
  getUser,
  deleteUser,
  getUsers,
  clearUsers,
  getUsersInGroup,
} = require("../helpers/groupUser");

exports = module.exports = function (io) {
  io.sockets.on("connection", function (socket) {
    socket.on("joinGroup", (userId, groupId) => {
      console.log("join chat");
      const { user, error } = addUser(socket.id, userId, groupId);
      // if (error) return io.emit("message", { status: "error", data: error });
      socket.join(user.group);

      const query = MessageSchema.find({
        group: groupId,
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
      const { userId, group } = getUser(socket.id);
      if (group && userId) {
        MessageSchema.updateMany(
          {
            group: group,
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
      const { group, userId } = getUser(socket.id);

      socket.to(group).emit("typing", { user: userId, status: action });
    });

    socket.on("leaveGroup", () => {
      console.log("disconnected");
      const user = getUser(socket.id);
      if (user) {
        deleteUser(user.id);
        socket.leave(user.group);
        if (io.sockets.sockets[socket.id]) {
          io.sockets.sockets[socket.id].disconnect();
        }
      }
    });

    socket.on("disconnect", () => {
      const user = getUser(socket.id);
      if (user) {
        deleteUser(user.id);
        socket.leave(user.group);
        if (io.sockets.sockets[socket.id]) {
          io.sockets.sockets[socket.id].disconnect();
        }
      }
    });

    socket.on("message", (message) => {
      const { group, userId } = getUser(socket.id);
      const usersInGroup = getUsersInGroup(group);

      GroupSchema.findOne({ _id: group }, function (err, group) {
        if (!err && group) {
          group.lastUpdate = Date.now();
          group.save((err) => {
            if (err) {
              console.error(err);
            }
          });
        }
      });

      const newMessage = new MessageSchema({
        text: message,
        group: group,
        user: userId,
        seen: usersInGroup.length > 1 ? usersInGroup : [userId],
      });
      newMessage.save((err, item) => {
        if (err) {
          io.to(socket.id).emit("message", { status: "error", data: err });
        } else {
          MessageSchema.findOne(item)
            .populate("user", "username")
            .exec((err, item) => {
              io.in(group).emit("message", {
                status: "success",
                data: item,
              });
            });
        }
      });
    });
  });
};
