const express = require('express');
const cors = require('cors');
require('dotenv').config();
const issueRoutes = require('./routes/issueRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});
app.use('/api/issues', issueRoutes);

module.exports = app;