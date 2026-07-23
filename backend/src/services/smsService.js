const axios = require('axios');

/**
 * Send SMS OTP to a phone number.
 * Supports Fast2SMS, 2Factor, Twilio, or console fallback.
 */
const sendSMS = async (phone, otpCode) => {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const fullPhone = phone.startsWith('+') ? phone : `+91${cleanPhone}`;

  console.log(`📱 [SMS SERVICE] Sending OTP ${otpCode} to ${fullPhone}...`);

  // 1. Fast2SMS (Popular Indian SMS Gateway)
  if (process.env.FAST2SMS_API_KEY) {
    try {
      await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          variables_values: otpCode,
          route: 'otp',
          numbers: cleanPhone,
        },
        {
          headers: {
            authorization: process.env.FAST2SMS_API_KEY,
          },
        }
      );
      console.log('✅ SMS sent via Fast2SMS');
      return true;
    } catch (err) {
      console.error('❌ Fast2SMS error:', err.response?.data || err.message);
    }
  }

  // 2. 2Factor (Popular Indian OTP Gateway)
  if (process.env.TWO_FACTOR_API_KEY) {
    try {
      await axios.get(
        `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/${cleanPhone}/${otpCode}/AUTOGEN`
      );
      console.log('✅ SMS sent via 2Factor');
      return true;
    } catch (err) {
      console.error('❌ 2Factor error:', err.response?.data || err.message);
    }
  }

  // 3. Twilio
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const client = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      await client.messages.create({
        body: `Your XenChat verification code is: ${otpCode}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: fullPhone,
      });
      console.log('✅ SMS sent via Twilio');
      return true;
    } catch (err) {
      console.error('❌ Twilio error:', err.message);
    }
  }

  // Fallback mode for local dev (logs clearly to backend console)
  console.log(`🔑 [DEV MODE OTP CODE]: ${otpCode} for phone ${fullPhone}`);
  return true;
};

module.exports = { sendSMS };
