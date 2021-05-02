const { body } = require("express-validator");

const EventValidationRules = [
  body("title").notEmpty(),
  body("start").notEmpty().isISO8601(),
  body("end").isISO8601().optional({ nullable: true }),
  body("users").isArray().optional(),
  body("groupId").isMongoId().optional({ nullable: true }),
];

module.exports = EventValidationRules;
