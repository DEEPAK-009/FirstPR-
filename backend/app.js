const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const issueRoutes = require('./routes/issueRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', port: 5070 });
});

app.use('/api/issues', issueRoutes);

module.exports = app;
