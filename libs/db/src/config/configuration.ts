export default () => ({
  port: parseInt(process.env.PORT ?? '', 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT ?? '', 10) || 5432,
    name: process.env.DB_NAME || 'ott_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
    poolMax: parseInt(process.env.DB_POOL_MAX ?? '', 10) || 20,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'access_secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '', 10) || 10,
  },

  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxVideoSizeMb: parseInt(process.env.MAX_VIDEO_SIZE_MB ?? '', 10) || 2048,
    maxImageSizeMb: parseInt(process.env.MAX_IMAGE_SIZE_MB ?? '', 10) || 5,
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '', 10) || 587,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM || 'OTT Platform <no-reply@example.com>',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
});
