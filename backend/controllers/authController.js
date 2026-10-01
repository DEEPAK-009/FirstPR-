const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { query } = require('../db');
const {
  jwtSecret,
  githubClientId,
  githubClientSecret,
  frontendUrl
} = require('../config/env');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name || user.github_username,
      username: user.github_username,
      avatarUrl: user.avatar_url
    },
    jwtSecret,
    { expiresIn: '7d' }
  );
};

// ── Email / Password Signup ──
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const displayName = (name || normalizedEmail.split('@')[0]).trim();
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=0284c7,4f46e5,7c3aed`;

    const result = await query(
      `INSERT INTO users (name, email, password_hash, avatar_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, name, email, avatar_url, preferred_skills, created_at`,
      [displayName, normalizedEmail, passwordHash, avatarUrl]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error('Signup Error:', error.message);
    return res.status(500).json({ error: 'Failed to create account', details: error.message });
  }
};

// ── Email / Password Login ──
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const result = await query(
      `SELECT id, name, email, password_hash, github_username, avatar_url, preferred_skills, created_at
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      return res.status(401).json({
        error: 'This account was created via GitHub OAuth. Please sign in with GitHub.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    delete user.password_hash;
    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    return res.status(500).json({ error: 'Failed to sign in', details: error.message });
  }
};

// ── GitHub OAuth: Step 1 Redirect ──
const githubLogin = (req, res) => {
  const host = req.get('host') || '';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

  // Callback URL must match one of the registered URIs in GitHub OAuth App settings
  const redirectUri =
    process.env.GITHUB_CALLBACK_URL ||
    (isLocal
      ? `http://${host}/api/auth/github/callback`
      : `${req.protocol}://${host}/api/auth/github/callback`);

  const returnTo = req.query.returnTo || (isLocal ? 'http://localhost:3000' : frontendUrl);
  const state = Buffer.from(JSON.stringify({ returnTo, redirectUri })).toString('base64');

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&state=${encodeURIComponent(state)}&scope=read:user,user:email`;

  return res.redirect(githubAuthUrl);
};

// ── GitHub OAuth: Step 2 Callback ──
const githubCallback = async (req, res) => {
  const { code, state } = req.query;

  let targetFrontendUrl = frontendUrl;
  let usedRedirectUri = undefined;

  if (state) {
    try {
      const parsed = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
      if (parsed.returnTo) {
        targetFrontendUrl = parsed.returnTo.replace(/\/+$/, '');
      }
      if (parsed.redirectUri) {
        usedRedirectUri = parsed.redirectUri;
      }
    } catch (e) {
      console.warn('Could not parse OAuth state:', e.message);
    }
  }

  if (!code) {
    return res.redirect(`${targetFrontendUrl}/login?error=Missing+authorization+code`);
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: githubClientId,
        client_secret: githubClientSecret,
        code,
        redirect_uri: usedRedirectUri
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      console.error('GitHub Token Exchange Failed:', tokenResponse.data);
      return res.redirect(
        `${targetFrontendUrl}/login?error=${encodeURIComponent(
          tokenResponse.data.error_description || 'GitHub authorization failed'
        )}`
      );
    }

    // 2. Fetch user profile from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'FirstPR-App'
      }
    });

    const ghUser = userResponse.data;

    // 3. Fetch primary email if public email is null
    let email = ghUser.email;
    if (!email) {
      try {
        const emailsResponse = await axios.get('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'FirstPR-App'
          }
        });
        const primary = emailsResponse.data.find((e) => e.primary && e.verified);
        if (primary) {
          email = primary.email;
        }
      } catch (e) {
        console.warn('Could not fetch GitHub private email:', e.message);
      }
    }

    const normalizedEmail = (email || `${ghUser.login}@users.noreply.github.com`).toLowerCase().trim();

    // 4. Upsert user in Neon PostgreSQL
    const upsertResult = await query(
      `INSERT INTO users (
        name, email, github_id, github_username, avatar_url, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (github_username) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, users.name),
        email = COALESCE(EXCLUDED.email, users.email),
        avatar_url = EXCLUDED.avatar_url,
        github_id = EXCLUDED.github_id,
        updated_at = NOW()
      RETURNING id, name, email, github_username, avatar_url, preferred_skills, created_at`,
      [
        ghUser.name || ghUser.login,
        normalizedEmail,
        ghUser.id.toString(),
        ghUser.login,
        ghUser.avatar_url
      ]
    );

    const user = upsertResult.rows[0];
    const token = generateToken(user);

    // 5. Redirect back to frontend dashboard with token
    return res.redirect(`${targetFrontendUrl}/dashboard?token=${token}`);
  } catch (error) {
    console.error('GitHub Callback Error:', error.response?.data || error.message);
    return res.redirect(`${targetFrontendUrl}/login?error=GitHub+login+failed`);
  }
};

// ── Get Authenticated User Profile & Stats ──
const getCurrentUser = async (req, res) => {
  try {
    const userResult = await query(
      `SELECT id, name, email, github_id, github_username, avatar_url, preferred_skills, created_at,
              (password_hash IS NOT NULL AND password_hash != '') AS has_password
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Compute bookmark statistics for the user
    const statsResult = await query(
      `SELECT 
         COUNT(*)::int as total,
         COUNT(CASE WHEN status = 'SAVED' THEN 1 END)::int as saved,
         COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END)::int as in_progress,
         COUNT(CASE WHEN status = 'PR_SUBMITTED' THEN 1 END)::int as pr_submitted,
         COUNT(CASE WHEN status = 'MERGED' THEN 1 END)::int as merged
       FROM bookmarks
       WHERE user_id = $1`,
      [req.user.id]
    );

    const stats = statsResult.rows[0] || {
      total: 0,
      saved: 0,
      in_progress: 0,
      pr_submitted: 0,
      merged: 0
    };

    return res.json({
      user: {
        ...user,
        stats
      }
    });
  } catch (error) {
    console.error('Get Current User Error:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve profile' });
  }
};

// ── Update Profile Details (Name, Skills, Avatar) ──
const updateProfile = async (req, res) => {
  try {
    const { name, preferred_skills, avatar_url } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name.trim());
    }

    if (preferred_skills !== undefined && Array.isArray(preferred_skills)) {
      fields.push(`preferred_skills = $${idx++}`);
      values.push(preferred_skills.map((s) => s.trim()).filter(Boolean));
    }

    if (avatar_url !== undefined) {
      fields.push(`avatar_url = $${idx++}`);
      values.push(avatar_url.trim());
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    fields.push('updated_at = NOW()');
    values.push(req.user.id);

    const updateQuery = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, name, email, github_id, github_username, avatar_url, preferred_skills, created_at,
                (password_hash IS NOT NULL AND password_hash != '') AS has_password
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update Profile Error:', error.message);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};

// ── Change Password ──
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password_hash } = userResult.rows[0];

    // If account has an existing password, verify currentPassword
    if (password_hash) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }

      const isMatch = await bcrypt.compare(currentPassword, password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect current password' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, req.user.id]
    );

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change Password Error:', error.message);
    return res.status(500).json({ error: 'Failed to update password' });
  }
};

// ── Delete Account & Associated Data ──
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete user bookmarks first
    await query('DELETE FROM bookmarks WHERE user_id = $1', [userId]);

    // Delete user record
    const result = await query('DELETE FROM users WHERE id = $1', [userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete Account Error:', error.message);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
};

module.exports = {
  signup,
  login,
  githubLogin,
  githubCallback,
  getCurrentUser,
  updateProfile,
  changePassword,
  deleteAccount
};
