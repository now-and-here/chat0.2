const fs = require("fs");
const express = require("express");
const EventEmitter = require("events");

const chatEmitter = new EventEmitter();
const port = process.env.PORT || 8080;
const app = express();

var options = {
  dotfiles: "ignore",
  etag: false,
  extensions: ["htm", "html", "css", "js", "ico", "jpg", "jpeg", "png", "svg"],
  index: ["server.js"],
  maxAge: "1m",
  redirect: false,
};

app.use(express.static("public", options));

app.get("/static/*", respondStatic);
app.get("/chat", respondChat);
app.get("/sse", respondSSE);

app.listen(port, () => console.log(`Server listening on port ${port}`));

function respondStatic(req, res) {
  const filename = req.url.split("/static/")[1];
  console.log(filename)
  fs.createReadStream(filename)
    .on("error", () => respondNotFound(req, res))
    .pipe(res);
}

function respondChat(req, res) {
  const { message } = req.query;
  chatEmitter.emit("message", message);
  res.end();
}

function respondSSE(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
  });

  const onMessage = (msg) => res.write(`data: ${msg}\n\n`);
  chatEmitter.on("message", onMessage);
  res.on("close", function () {
    chatEmitter.off("message", onMessage);
  });
}

function respondNotFound(req, res) {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
}
