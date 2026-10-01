const express = require('express');
const {
  saveBookmark,
  getBookmarks,
  removeBookmark,
  updateBookmarkStatus
} = require('../controllers/bookmarkController');

const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Require authentication for all bookmark routes
router.use(requireAuth);

router.get('/', getBookmarks);
router.post('/', saveBookmark);
router.delete('/:id', removeBookmark);
router.patch('/:id/status', updateBookmarkStatus);

module.exports = router;
