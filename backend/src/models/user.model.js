const pool = require('../config/db');

/**
 * Find a user by their phone number
 */
const findByPhone = async (phone) => {
  const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : null;
  if (!cleanPhone) return null;
  const result = await pool.query(
    `SELECT * FROM users WHERE phone = $1 OR phone = $2 LIMIT 1`,
    [cleanPhone, phone]
  );
  return result.rows[0] || null;
};

/**
 * Find a user by their username
 */
const findByUsername = async (username) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
    [username]
  );
  return result.rows[0] || null;
};

/**
 * Find a user by their email
 */
const findByEmail = async (email) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email]
  );
  return result.rows[0] || null;
};

/**
 * Find a user by login identifier (Username, Phone, or Email)
 */
const findByLogin = async (login) => {
  if (!login) return null;
  const cleanLogin = login.trim();
  const cleanPhone = cleanLogin.replace(/\D/g, '').slice(-10);

  const result = await pool.query(
    `SELECT * FROM users
     WHERE LOWER(username) = LOWER($1)
        OR LOWER(email) = LOWER($1)
        OR ($2 != '' AND (phone = $2 OR phone = $1))
     LIMIT 1`,
    [cleanLogin, cleanPhone]
  );
  return result.rows[0] || null;
};

/**
 * Find a user by their ID
 */
const findById = async (id) => {
  const result = await pool.query(
    `SELECT id, phone, username, email, avatar_url, public_key, is_online, last_seen, created_at
     FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Create a new user (supports username, phone, email, password_hash)
 */
const createUser = async ({ username, phone = null, email = null, password_hash = null }) => {
  const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : null;
  const result = await pool.query(
    `INSERT INTO users (username, phone, email, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, phone, username, email, avatar_url, public_key, is_online, last_seen, created_at`,
    [username, cleanPhone, email, password_hash]
  );
  return result.rows[0];
};

/**
 * Update user password
 */
const updatePassword = async (id, password_hash) => {
  await pool.query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [password_hash, id]
  );
};

/**
 * Update a user's online status and last_seen timestamp
 */
const updateOnlineStatus = async (id, isOnline) => {
  await pool.query(
    `UPDATE users SET is_online = $1, last_seen = NOW(), updated_at = NOW()
     WHERE id = $2`,
    [isOnline, id]
  );
};

/**
 * Update a user's profile (username, avatar_url)
 */
const updateProfile = async (id, { username, avatar_url }) => {
  const result = await pool.query(
    `UPDATE users SET username = COALESCE($1, username),
                      avatar_url = COALESCE($2, avatar_url),
                      updated_at = NOW()
     WHERE id = $3
     RETURNING id, phone, username, avatar_url, public_key, is_online, last_seen`,
    [username, avatar_url, id]
  );
  return result.rows[0];
};

/**
 * Search users by username or phone number (for starting new chats)
 */
const searchByUsername = async (query, currentUserId) => {
  const cleanPhone = query.replace(/\D/g, '').slice(-10);
  const result = await pool.query(
    `SELECT id, username, phone, avatar_url, is_online, last_seen
     FROM users
     WHERE (
       username ILIKE $1
       OR phone ILIKE $1
       OR ($3 != '' AND phone ILIKE $3)
     )
       AND id != $2
     LIMIT 20`,
    [`%${query}%`, currentUserId, `%${cleanPhone}%`]
  );
  return result.rows;
};

module.exports = {
  findByPhone,
  findByUsername,
  findByEmail,
  findByLogin,
  findById,
  createUser,
  updatePassword,
  updateOnlineStatus,
  updateProfile,
  searchByUsername
};