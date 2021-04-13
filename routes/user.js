const express = require("express");
const authRoutes = express.Router();
const UserSchema = require("../models/User");
const dotenv = require("dotenv");
const withAuth = require("../withAuth");
const jwt = require("jsonwebtoken");
dotenv.config();
const secret = process.env.SECRET;

authRoutes.post("/register", withAuth, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const user = new UserSchema({ username, email, password, role });
    user.save((err) => {
      if (err) {
        res.status(500).json({
          error:
            "Error registering new user please try again. Probably email is already in use",
        });
      } else {
        res.status(200).send("Success");
      }
    });
  } catch (err) {
    res.status(400).send(parseError(err));
  }
});

authRoutes.post("/resetPassword", withAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  UserSchema.findOne({ _id: userId }, function (err, user) {
    if (err) {
      console.error(err);
      res.status(500).json({
        error: "Internal error please try again",
      });
    } else if (!user) {
      res.status(401).json({
        error: "Incorrect token. Logout and try again",
      });
    } else {
      user.isCorrectPassword(oldPassword, function (err, same) {
        if (err) {
          res.status(500).json({
            error: "Internal error please try again",
          });
        } else if (!same) {
          res.status(401).json({
            error: "Incorrect password",
          });
        } else {
          // Issue token
          user.password = newPassword;
          user.save(function (err) {
            if (err) {
              res.status(500).json({
                error: "Internal error please try again",
              });
            } else {
              res.status(200).send("Success");
            }
          });
        }
      });
    }
  });
});

authRoutes.post("/login", (req, res) => {
  const { email, password } = req.body;
  UserSchema.findOne({ email }, function (err, user) {
    if (err) {
      console.error(err);
      res.status(500).json({
        error: "Internal error please try again",
      });
    } else if (!user) {
      res.status(401).json({
        error: "Incorrect email or password",
      });
    } else {
      user.isCorrectPassword(password, function (err, same) {
        if (err) {
          res.status(500).json({
            error: "Internal error please try again",
          });
        } else if (!same) {
          res.status(401).json({
            error: "Incorrect email or password",
          });
        } else {
          // Issue token
          const payload = {
            username: user.username,
            role: user.role,
            id: user._id,
          };
          const token = jwt.sign(payload, secret, {
            expiresIn: "14d",
          });
          res.cookie("token", token, {
            httpOnly: true,
          });
          res
            .status(200)
            .json({ username: user.username, role: user.role, id: user._id });
        }
      });
    }
  });
});

authRoutes.get("/checkRole", withAuth, function (req, res) {
  res.status(200).json(req.user);
});

authRoutes.get("/users", withAuth, function (req, res) {
  const requestUserId = req.user.id;
  UserSchema.find({ _id: { $ne: requestUserId } }, (err, users) => {
    if (err) {
      console.error(err);
      res.status(500).json({
        error: "Internal error please try again",
      });
    } else if (!users) {
      res.status(401).json({
        error: "No users in db",
      });
    } else {
      const usersForSelect = users.map((user) => ({
        id: user._id,
        username: user.username,
        email: user.email,
      }));

      res.status(200).json(usersForSelect);
    }
  });
});

authRoutes.get("/logout", (req, res) => {
  res.clearCookie("token").sendStatus(200);
});

module.exports = authRoutes;
