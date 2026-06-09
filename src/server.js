const express = require("express");
const path = require("path");
const fs = require("fs");

function startServer() {
  const app = express();

  app.get("/health", (req, res) => {
    res.json({ status: "alive", time: new Date().toISOString() });
  });

  app.get("/screenshot", (req, res) => {
    const file = "/tmp/debug.png";
    if (fs.existsSync(file)) res.sendFile(file);
    else res.json({ error: "No screenshot yet" });
  });

  app.get("/html", (req, res) => {
    const file = "/tmp/debug.html";
    if (fs.existsSync(file)) res.send(fs.readFileSync(file, "utf8"));
    else res.json({ error: "No HTML yet" });
  });
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Health server running on port ${PORT}`);
  });
}

module.exports = startServer;
