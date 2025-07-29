import { registerAs } from '@nestjs/config';

export default registerAs('channels', () => ({
  email: {
    host: process.env.EMAIL_PROVIDER_HOST,
    port: parseInt(process.env.EMAIL_PROVIDER_PORT || '587', 10),
    secure: process.env.EMAIL_PROVIDER_SECURE === 'true',
    user: process.env.EMAIL_PROVIDER_USER,
    pass: process.env.EMAIL_PROVIDER_PASS,
    from: process.env.EMAIL_FROM_ADDRESS,
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
  },
}));
