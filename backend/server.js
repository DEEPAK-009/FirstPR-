const app = require('./app');
const { port } = require('./config/env');
const { initDb } = require('./db');

app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  await initDb();
});
