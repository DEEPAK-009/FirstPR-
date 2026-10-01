const express = require('express');
const cors = require('cors');

const { port } = require('./config/env');
const issueRoutes = require('./routes/issueRoutes');

const app = express();

app.use(cors()); // we can allow it just for a specific url too
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', port });
});

app.use('/api/issues', issueRoutes);

module.exports = app;
