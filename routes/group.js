const express = require("express");
const groupRoutes = express.Router();
const GroupSchema = require("../models/Group");
const withAuth = require("../withAuth");
const MessageSchema = require("../models/Message");
const mongoose = require("mongoose");
const { groupInitialName } = require("../helpers/groupInitialName");

groupRoutes.post("/create", withAuth, async (req, res) => {
  const { name, users, avatar } = req.body;
  const user = req.user;
  const group = new GroupSchema({
    name,
    users: [...users, user.id],
    avatar,
  });
  group.save((err) => {
    if (err) {
      res.status(500).json({
        error: "Error registering new user please try again.",
      });
    } else {
      res.status(200).json(group);
    }
  });
});

groupRoutes.get("/getListWithNotification", withAuth, async (req, res) => {
  try {
    const requestUserId = req.user.id;
    const groups = await GroupSchema.find({
      users: requestUserId,
    })
      .populate("users", "username")
      .sort({ lastUpdate: "descending" });

    if (!groups) {
      res.status(401).json({
        error: "You don't have any groups",
      });
    } else {
      const groupWithName = groupInitialName(groups, requestUserId);

      const groupsWithNotSeenMessagesNumber = await groupWithName.map(
        async (item) => {
          const messages = await MessageSchema.find({
            seen: { $ne: requestUserId },
            group: item._id,
          });

          const count = messages.length;

          return {
            group: item,
            notSeenMessages: count ? count : 0,
          };
        }
      );

      Promise.all(groupsWithNotSeenMessagesNumber).then((value) =>
        res.status(200).json(value)
      );
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Internal error please try again",
    });
  }
});

groupRoutes.get("/getList", withAuth, async (req, res) => {
  try {
    const requestUserId = req.user.id;
    const groups = await GroupSchema.find({
      users: requestUserId,
    })
      .populate("users", "username")
      .sort({ lastUpdate: "descending" });

    if (!groups) {
      res.status(401).json({
        error: "You don't have any groups",
      });
    } else {
      const groupWithName = groupInitialName(groups, requestUserId);

      res.status(200).json(groupWithName);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Internal error please try again",
    });
  }
});

module.exports = groupRoutes;
