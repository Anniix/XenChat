const pool = require('../config/db');

/**
 * Save or update OTP for a phone number (expires in 5 minutes)
 */
const saveOTP = async (phone, otpCode) => {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const result = await pool.query(
    `INSERT INTO otps (phone, otp_code, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '5 minutes')
     ON CONFLICT (phone)
     DO UPDATE SET otp_code = $2, expires_at = NOW() + INTERVAL '5 minutes', created_at = NOW()
     RETURNING *`,
    [cleanPhone, otpCode]
  );
  return result.rows[0];
};

/**
 * Verify OTP for a phone number
 */
const verifyOTP = async (phone, otpCode) => {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const result = await pool.query(
    `SELECT * FROM otps
     WHERE phone = $1
       AND otp_code = $2
       AND expires_at > NOW()
     LIMIT 1`,
    [cleanPhone, otpCode]
  );

  if (result.rows.length > 0) {
    // Delete OTP once verified
    await pool.query(`DELETE FROM otps WHERE phone = $1`, [cleanPhone]);
    return true;
  }

  return false;
};

module.exports = { saveOTP, verifyOTP };
