const GroupSchema = require("../models/Group");

let users = [];
let callGroups = [];
exports = module.exports = function (io) {
  io.on("connection", (socket) => {
    console.log("connect video");

    socket.on("call users", (groupId, userId) => {
      GroupSchema.findById(groupId, (err, group) => {
        if (!err && group) {
          const usersInGroup = group.users.filter((item) => item !== userId);
          const usersToCall = users.filter((item) =>
            usersInGroup.includes(item.userId)
          );
          usersToCall.forEach((item) => {
            if (item.userId !== userId) {
              io.to(item.socketId).emit("incomming call", group);
            }
          });
        }
      });
    });

    socket.on("login", (user) => {
      const isUserLogedIn = users.find((item) => item.userId == user.id);
      if (!isUserLogedIn) {
        console.log("login create new user");

        users.push({
          socketId: socket.id,
          userId: user.id,
          username: user.username,
        });
      }
    });

    socket.on("join call", (groupId, user) => {
      console.log("join call");
      const userInGroupObject = {
        socketId: socket.id,
        userId: user.id,
        username: user.username,
      };
      const groupIsCreated = callGroups.find(
        (item) => item.groupId === groupId
      );

      if (groupIsCreated) {
        const isUserInGroup = groupIsCreated.users.find(
          (item) => item.userId === user.id
        );
        if (!isUserInGroup) {
          callGroups.map((item) => {
            if (item.groupId === groupId) {
              item.users.push(userInGroupObject);
            }
            return item;
          });
        }
      } else {
        callGroups.push({ groupId, users: [userInGroupObject] });
      }

      const groupCall = callGroups.find((item) => item.groupId === groupId);
      const callUsers = groupCall.users.filter(
        (item) => item.userId !== user.id
      );
      console.log(callUsers);
      socket.emit("all users", callUsers);
    });

    socket.on("sending signal", (payload) => {
      io.to(payload.userToSignal).emit("user joined", {
        signal: payload.signal,
        callerID: payload.callerID,
        username: payload.username,
      });
    });

    socket.on("returning signal", (payload) => {
      io.to(payload.callerID).emit("receiving returned signal", {
        signal: payload.signal,
        id: socket.id,
      });
    });

    socket.on("disconnect", () => {
      console.log("disconnect video");
      users = users.filter((item) => item.socketId !== socket.id);
      callGroups.map(
        (item) =>
          (item.users = item.users.filter(
            (element) => element.socketId !== socket.id
          ))
      );
      socket.broadcast.emit("user left", socket.id);
    });

    socket.on("leave call", (userId) => {
      console.log("leave call");
      callGroups.map(
        (item) =>
          (item.users = item.users.filter(
            (element) =>
              element.userId !== userId || element.socketId !== socket.id
          ))
      );
      socket.broadcast.emit("user left", socket.id);
    });
  });
};
