const express = require("express");
const fileRoutes = express.Router();
const withAuth = require("../withAuth");
const FileSchema = require("../models/File");
var path = require("path");
var multer = require("multer");
var zip = require("express-zip");
const fs = require("fs");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname + "/.." + "/uploads"));
  },
  filename: function (req, file, cb) {
    //.replace(/\.[^/.]+$/, "")
    const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "_" + file.originalname);
  },
});

var upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});

fileRoutes.post(
  "/upload",
  withAuth,
  upload.single("file"),
  async (req, res) => {
    console.log(req.file);
    const user = req.user;

    try {
      if (req.file) {
        const { originalname, size, mimetype, path } = req.file;
        const file = new FileSchema({
          name: originalname,
          size,
          type: mimetype,
          path,
          uploadDate: Date.now(),
          creator: user.id,
          users: [],
        });

        const savedFile = await file.save();
        res.status(200).json(file);
      } else {
        res.status(400).json({
          error: "Please upload a file!",
        });
      }
    } catch (err) {
      res.status(500).json({
        error: err,
      });
    }
  }
);

fileRoutes.post("/download", withAuth, async (req, res) => {
  const ids = req.body.ids;
  console.log(ids);
  try {
    // const files = await FileSchema.find({
    //   $and: [
    //     {
    //       _id: { $in: ids },
    //     },
    //     {
    //       $or: [
    //         {
    //           users: requestUserId,
    //         },
    //         {
    //           creator: requestUserId,
    //         },
    //       ],
    //     },
    //   ],
    // });
    if (ids.length > 1) {
      const files = await FileSchema.find({
        _id: { $in: ids },
      });
      if (files) {
        const filestToZip = files.map(({ name, path }) => {
          return { name: name, path: path };
        });
        res.zip(filestToZip);
      } else {
        res.status(401).json({
          error: "No files to download",
        });
      }
    } else {
      const file = await FileSchema.findById(ids[0]);
      if (file) {
        res.download(file.path, file.name);
      } else {
        res.status(401).json({
          error: "No file to download",
        });
      }
    }
  } catch (err) {
    res.status(500).json({
      error: err,
    });
  }
});

fileRoutes.post("/delete", withAuth, async (req, res) => {
  const ids = req.body.ids;
  console.log("delete", ids);
  try {
    const files = await FileSchema.find({
      _id: { $in: ids },
    });
    if (files) {
      files.forEach((item) => {
        console.log(item);
        item.deleteOne({ _id: item._id });
        if (fs.existsSync(item.path)) {
          fs.unlinkSync(item.path);
        }
      });
      res.status(200).json({ status: "success", ids: ids });
    } else {
      res.status(400).json({
        error: "No files to delete",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
});

fileRoutes.get("/list", withAuth, async (req, res) => {
  try {
    const requestUserId = req.user.id;

    const files = await FileSchema.find({
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

    if (!files) {
      res.status(401).json({
        error: "You don't have any files",
      });
    } else {
      res.status(200).json(files);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err,
    });
  }
});

module.exports = fileRoutes;
