const http = require("node:http");
const fs = require("fs");
const path = require("path");
const socket = require("socket.io");
require("dotenv").config();

const PORT = process.env.PORT;
const HOST = process.env.HOST;

const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, "public", req.url);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log("opened server on", server.address());
});

// Socket setup
const io = socket(server);

const activeUsers = new Set();

io.on("connection", function (socket) {
  console.log("Made socket connection");

  socket.on("new user", function (data) {
    socket.userId = data;
    activeUsers.add(data);
    io.emit("new user", [...activeUsers]);
  });

  socket.on("disconnect", () => {
    activeUsers.delete(socket.userId);
    io.emit("user disconnected", socket.userId);
  });

  socket.on("chat message", function (data) {
    io.emit("chat message", data);
  });

  socket.on("typing", function (data) {
    socket.broadcast.emit("typing", data);
  });
});
