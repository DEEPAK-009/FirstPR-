const express = require('express');
const {
  signup,
  login,
  githubLogin,
  githubCallback,
  getCurrentUser,
  updateProfile,
  changePassword,
  deleteAccount
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/github', githubLogin);
router.get('/github/callback', githubCallback);
router.get('/me', requireAuth, getCurrentUser);
router.patch('/profile', requireAuth, updateProfile);
router.put('/password', requireAuth, changePassword);
router.delete('/account', requireAuth, deleteAccount);

module.exports = router;
