const express = require("express");
const eventRoutes = express.Router();
const GroupSchema = require("../models/Group");
const withAuth = require("../withAuth");
const EventSchema = require("../models/Event");
const mongoose = require("mongoose");
const validate = require("../validation/validator");
const eventValidationRules = require("../validation/eventValidationRules");
const { groupInitialName } = require("../helpers/groupInitialName");

eventRoutes.post(
  "/create",
  withAuth,
  validate(eventValidationRules),
  async (req, res) => {
    const { title, description, start, end, group, users } = req.body;
    const user = req.user;

    try {
      const event = new EventSchema({
        title,
        description,
        start,
        end,
        creator: user.id,
        users: users,
        group: group,
      });

      const savedEvent = await event.save();
      res.status(200).json(savedEvent);
    } catch (err) {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    }
  }
);

eventRoutes.post(
  "/edit",
  withAuth,
  validate(eventValidationRules),
  async (req, res) => {
    const { id, title, description, start, end, group, users } = req.body;
    try {
      const eventToEdit = await EventSchema.findById(id);
      eventToEdit.title = title;
      eventToEdit.description = description;
      eventToEdit.start = start;
      eventToEdit.end = end;
      eventToEdit.group = group;
      eventToEdit.users = users;
      eventToEdit.lastUpdate = Date.now();

      eventToEdit.save();
      res.status(200).json(eventToEdit);
    } catch (err) {
      res.status(500).json({
        error: err,
      });
    }
  }
);

eventRoutes.get("/get/:id", withAuth, async (req, res) => {
  const id = req.params.id;
  try {
    const event = await EventSchema.findById(id)
      .populate({
        path: "users",
        select: "_id  username",
        model: "User",
      })
      .populate({
        path: "group",
        select: "_id  name",
        model: "Group",
      })
      .populate({
        path: "creator",
        select: "_id  username",
        model: "User",
      });
    if (event) {
      if (event.group && !event.group.name) {
        const groupWithName = groupInitialName([event.group]);
        event.group = groupWithName;
      }
      res.status(200).json(event);
    } else {
      res.status(404).json({ error: "Cannot find event" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
});

eventRoutes.delete("/delete/:id", withAuth, async (req, res) => {
  const id = req.params.id;
  try {
    const eventToDelete = await EventSchema.findById(id);
    const deletedEvent = eventToDelete.delete();
    res.status(200).json(deletedEvent);
  } catch (err) {
    res.status(500).json({
      error: err,
    });
  }
});

eventRoutes.get("/list", withAuth, async (req, res) => {
  try {
    const requestUserId = req.user.id;

    const events = await EventSchema.find({
      $or: [
        {
          users: requestUserId,
        },
        {
          creator: requestUserId,
        },
      ],
    }).populate({
      path: "users",
      select: "_id  username",
      model: "User",
    });

    if (!events) {
      res.status(401).json({
        error: "You don't have any events",
      });
    } else {
      res.status(200).json(events);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err,
    });
  }
});

module.exports = eventRoutes;
