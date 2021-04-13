const express = require("express");
const app = express();
const socketServer = require("http").createServer(app);
const io = require("socket.io")(socketServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/user");
const conversationRoutes = require("./routes/conversation");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const { initialUser } = require("./helpers/initialUser");
const chatSocket = require("./sockets/chatsSocket")(io);

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
app.use("/conversation", conversationRoutes);

initialUser();

app.listen(4000, () => console.log(`Server is running on port 4000.`));
socketServer.listen(4001, () =>
  console.log(`Socket.io is running on port 4001.`)
);
