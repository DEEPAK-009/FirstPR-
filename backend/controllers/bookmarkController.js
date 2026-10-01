const { query } = require('../db');

// Helper to extract or generate a unique numeric ID from an issue URL
const getIssueId = (issue) => {
  if (issue.id && Number.isInteger(Number(issue.id))) {
    return BigInt(issue.id);
  }

  // Extract from github url: https://github.com/owner/repo/issues/123 -> hash or issue number
  if (issue.url) {
    const parts = issue.url.split('/issues/');
    if (parts.length > 1) {
      const issueNum = parseInt(parts[1], 10);
      if (!Number.isNaN(issueNum)) {
        // Hash the repo name + issue num into a safe 64-bit integer
        let hash = 0;
        const repoStr = parts[0];
        for (let i = 0; i < repoStr.length; i += 1) {
          hash = (hash << 5) - hash + repoStr.charCodeAt(i);
          hash |= 0;
        }
        return BigInt(Math.abs(hash) * 100000 + issueNum);
      }
    }
  }

  return BigInt(Date.now());
};

const saveBookmark = async (req, res) => {
  try {
    const issue = req.body;
    const userId = req.user?.id || null;

    if (!issue || !issue.title || !issue.url) {
      return res.status(400).json({ error: 'Issue title and URL are required' });
    }

    const issueId = getIssueId(issue);

    // 1. Upsert issue into `issues` table
    await query(
      `INSERT INTO issues (
        github_issue_id, repo_name, title, url, labels, comments_count,
        opened_at, confidence_score, is_beginner_friendly, ai_explanation,
        original_body, match_reason, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      ON CONFLICT (github_issue_id) DO UPDATE SET
        confidence_score = EXCLUDED.confidence_score,
        ai_explanation = EXCLUDED.ai_explanation,
        match_reason = EXCLUDED.match_reason,
        updated_at = NOW()`,
      [
        issueId.toString(),
        issue.repo || 'unknown repository',
        issue.title,
        issue.url,
        issue.labels || [],
        issue.comments || 0,
        issue.openedAt ? new Date(issue.openedAt) : null,
        issue.confidence || 0,
        true,
        issue.explanation || '',
        issue.originalBody || '',
        issue.matchReason || ''
      ]
    );

    // 2. Insert into `bookmarks`
    if (userId) {
      await query(
        `INSERT INTO bookmarks (github_issue_id, user_id, status, updated_at)
         VALUES ($1, $2, 'SAVED', NOW())
         ON CONFLICT (user_id, github_issue_id) DO UPDATE SET
           status = 'SAVED',
           updated_at = NOW()`,
        [issueId.toString(), userId]
      );
    } else {
      await query(
        `INSERT INTO bookmarks (github_issue_id, status, updated_at)
         VALUES ($1, 'SAVED', NOW())
         ON CONFLICT DO NOTHING`,
        [issueId.toString()]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Issue bookmarked successfully',
      issueId: issueId.toString()
    });
  } catch (error) {
    console.error('Save Bookmark Error:', error.message);
    return res.status(500).json({ error: 'Failed to save bookmark', details: error.message });
  }
};

const getBookmarks = async (req, res) => {
  try {
    const userId = req.user?.id;
    let queryText = `SELECT 
        b.id as bookmark_id,
        b.status,
        b.notes,
        b.created_at as bookmarked_at,
        i.github_issue_id as id,
        i.repo_name as repo,
        i.title,
        i.url,
        i.labels,
        i.comments_count as comments,
        i.opened_at as "openedAt",
        i.confidence_score as confidence,
        i.ai_explanation as explanation,
        i.original_body as "originalBody",
        i.match_reason as "matchReason"
       FROM bookmarks b
       JOIN issues i ON b.github_issue_id = i.github_issue_id`;

    const params = [];
    if (userId) {
      queryText += ' WHERE b.user_id = $1';
      params.push(userId);
    } else {
      queryText += ' WHERE b.user_id IS NULL';
    }
    queryText += ' ORDER BY b.created_at DESC';

    const result = await query(queryText, params);

    return res.json({
      total: result.rows.length,
      bookmarks: result.rows
    });
  } catch (error) {
    console.error('Get Bookmarks Error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch bookmarks', details: error.message });
  }
};

const removeBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
      return res.status(400).json({ error: 'Issue ID is required' });
    }

    let queryText = 'DELETE FROM bookmarks WHERE github_issue_id = $1';
    const params = [id];
    if (userId) {
      queryText += ' AND user_id = $2';
      params.push(userId);
    }

    const result = await query(queryText, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    return res.json({ success: true, message: 'Bookmark removed successfully' });
  } catch (error) {
    console.error('Remove Bookmark Error:', error.message);
    return res.status(500).json({ error: 'Failed to remove bookmark' });
  }
};

const updateBookmarkStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user?.id;

    const validStatuses = ['SAVED', 'IN_PROGRESS', 'PR_SUBMITTED', 'MERGED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    let queryText = `UPDATE bookmarks
       SET status = COALESCE($1, status),
           notes = COALESCE($2, notes),
           updated_at = NOW()
       WHERE github_issue_id = $3`;
    const params = [status, notes, id];
    if (userId) {
      queryText += ' AND user_id = $4';
      params.push(userId);
    }
    queryText += ' RETURNING *';

    const result = await query(queryText, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    return res.json({ success: true, bookmark: result.rows[0] });
  } catch (error) {
    console.error('Update Bookmark Status Error:', error.message);
    return res.status(500).json({ error: 'Failed to update bookmark status' });
  }
};

module.exports = {
  saveBookmark,
  getBookmarks,
  removeBookmark,
  updateBookmarkStatus
};
