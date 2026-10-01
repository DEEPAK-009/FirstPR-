const express = require('express');
const {
  saveBookmark,
  getBookmarks,
  removeBookmark,
  updateBookmarkStatus
} = require('../controllers/bookmarkController');

const router = express.Router();

router.get('/', getBookmarks);
router.post('/', saveBookmark);
router.delete('/:id', removeBookmark);
router.patch('/:id/status', updateBookmarkStatus);

module.exports = router;
