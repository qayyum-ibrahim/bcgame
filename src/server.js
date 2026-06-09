const express = require("express");
const path = require("path");
const fs = require("fs");

function startServer() {
  const app = express();

  app.get("/health", (req, res) => {
    res.json({ status: "alive", time: new Date().toISOString() });
  });

  app.get("/screenshot", (req, res) => {
    const file = "/tmp/bcgame-page.png";
    if (fs.existsSync(file)) {
      res.sendFile(file);
    } else {
      res.json({ error: "No screenshot yet" });
    }
  });
  app.get("/screenshot2", (req, res) => {
    const file = "/tmp/after-cookie.png";
    if (fs.existsSync(file)) {
      res.sendFile(file);
    } else {
      res.json({ error: "No screenshot yet" });
    }
  });

  app.get("/screenshot3", (req, res) => {
    const file = "/tmp/after-login-click.png";
    if (fs.existsSync(file)) {
      res.sendFile(file);
    } else {
      res.json({ error: "No screenshot yet" });
    }
  });
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Health server running on port ${PORT}`);
  });
}

module.exports = startServer;
