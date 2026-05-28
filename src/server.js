const express = require('express');

function startServer() {
  const app = express();

  app.get('/health', (req, res) => {
    res.json({ status: 'alive', time: new Date().toISOString() });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Health server running on port ${PORT}`);
  });
}

module.exports = startServer;