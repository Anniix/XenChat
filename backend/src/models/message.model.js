const pool = require('../config/db');

/**
 * Save a new message to the database
 */
const createMessage = async ({ chat_id, sender_id, ciphertext, cipher_display = null }) => {
  const result = await pool.query(
    `INSERT INTO messages (chat_id, sender_id, ciphertext, cipher_display, status)
     VALUES ($1, $2, $3, $4, 'sent')
     RETURNING *`,
    [chat_id, sender_id, ciphertext, cipher_display]
  );
  return result.rows[0];
};

/**
 * Get a message by its ID
 */
const getMessageById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM messages WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Soft-delete a message (set is_deleted = true)
 */
const deleteMessage = async (id, userId) => {
  const result = await pool.query(
    `UPDATE messages SET is_deleted = true
     WHERE id = $1 AND sender_id = $2
     RETURNING *`,
    [id, userId]
  );
  return result.rows[0] || null;
};

/**
 * Mark all messages in a chat as read (for the receiver)
 * Returns the IDs of messages that were just marked as read
 */
const markMessagesRead = async (chat_id, reader_id) => {
  const result = await pool.query(
    `UPDATE messages
     SET read_at = NOW(), status = 'read'
     WHERE chat_id = $1
       AND sender_id != $2
       AND read_at IS NULL
     RETURNING id, sender_id`,
    [chat_id, reader_id]
  );
  return result.rows; // [ { id, sender_id } ]
};

const updateStatus = async (message_id, status) => {
  await pool.query(
    `UPDATE messages SET status = $1 WHERE id = $2`,
    [status, message_id]
  );
};

module.exports = { createMessage, getMessageById, deleteMessage, markMessagesRead, updateStatus };