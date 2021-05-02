const express = require("express");
const app = express();
const socketServer = require("http").createServer(app);
const socketServer2 = require("http").createServer(app);
const io = require("socket.io")(socketServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});
const io2 = require("socket.io")(socketServer2, {
  cors: {
    origin: "http://localhost:3000",
  },
});
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/user");
const groupRoutes = require("./routes/group");
const eventRoutes = require("./routes/event");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const { initialUser } = require("./helpers/initialUser");
const groupSocket = require("./sockets/groupSocket")(io);
const videoSocket = require("./sockets/videoSocket")(io2);

dotenv.config();

mongoose
  .connect(process.env.DB_ACCESS, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .catch((err) => console.log(err));

app.disable("x-powered-by");

app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:3000", "http://localhost:5000"],
  })
);
app.use(cookieParser());

app.use("/", authRoutes);
app.use("/group", groupRoutes);
app.use("/event", eventRoutes);

initialUser();

app.listen(4000, () => console.log(`Server is running on port 4000.`));
socketServer.listen(4001, () =>
  console.log(`Socket.io is running on port 4001.`)
);
socketServer2.listen(4002, () =>
  console.log(`Socket.io 2 is running on port 4002.`)
);
