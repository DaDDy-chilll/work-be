module.exports = {
  PORT: process.env.PORT || 8080,
  NODE_ENV: process.env.NODE_ENV || 'local',
  MONGODB_URI: process.env.MONGODB_URI,
  DB_NAME: process.env.DATABASE_NAME,
  JWT_TOKEN_SECRET: process.env.JWT_TOKEN_SECRET,
  AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
  AWS_SECRET_KEY: process.env.AWS_SECRET_KEY,
  AWS_REGION: process.env.AWS_REGION,
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
};
