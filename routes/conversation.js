const express = require("express");
const conversationRoutes = express.Router();
const ConversationSchema = require("../models/Conversation");
const withAuth = require("../withAuth");
const MessageSchema = require("../models/Message");
const mongoose = require("mongoose");
const {
  conversationInitialName,
} = require("../helpers/conversationInitialName");

conversationRoutes.post("/create", withAuth, async (req, res) => {
  const { name, users, avatar } = req.body;
  const user = req.user;
  const conversation = new ConversationSchema({
    name,
    users: [...users, user.id],
    avatar,
  });
  conversation.save((err) => {
    if (err) {
      res.status(500).json({
        error: "Error registering new user please try again.",
      });
    } else {
      res.status(200).json(conversation);
    }
  });
});

conversationRoutes.get("/get", withAuth, async (req, res) => {
  try {
    const requestUserId = req.user.id;
    const conversations = await ConversationSchema.find({
      users: requestUserId,
    })
      .populate("users", "username")
      .sort({ lastUpdate: "descending" });

    if (!conversations) {
      res.status(401).json({
        error: "You don't have any conversations",
      });
    } else {
      const conversationWithName = conversationInitialName(
        conversations,
        requestUserId
      );

      const conversationsWithNotSeenMessagesNumber = await conversationWithName.map(
        async (item) => {
          const messages = await MessageSchema.find({
            seen: { $ne: requestUserId },
            conversation: item._id,
          });

          const count = messages.length;

          return {
            conversation: item,
            notSeenMessages: count ? count : 0,
          };
        }
      );

      Promise.all(conversationsWithNotSeenMessagesNumber).then((value) =>
        res.status(200).json(value)
      );
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Internal error please try again",
    });
  }

  // const requestUserId = req.user.id;
  // const query = ConversationSchema.find({ users: requestUserId })
  //   .populate("users", "username")
  //   .sort({ lastUpdate: "descending" });

  // query.exec(function (err, conversations) {
  //   if (err) {
  //     console.error(err);
  //     res.status(500).json({
  //       error: "Internal error please try again",
  //     });
  //   } else if (!conversations) {
  //     res.status(401).json({
  //       error: "You don't have any conversations",
  //     });
  //   } else {
  //     const conversationWithName = conversationInitialName(
  //       conversations,
  //       requestUserId
  //     );

  //     const conversationsWithNotSeenMessagesNumber = [];

  //     conversationWithName.forEach((item) => {
  //       MessageSchema.count(
  //         {
  //           seen: { $ne: requestUserId },
  //           conversation: item._id,
  //         },
  //         (err, count) => {
  //           if (!err) {
  //             conversationsWithNotSeenMessagesNumber.push({
  //               item,
  //               notSeenMessages: count ? count : 0,
  //             });
  //           }
  //         }
  //       );
  //     });

  //     res.status(200).json(conversationWithName);
  //   }
  // });
});

conversationRoutes.get("/xd", (req, res) => {
  res.status(200).send("xd");
});

module.exports = conversationRoutes;
