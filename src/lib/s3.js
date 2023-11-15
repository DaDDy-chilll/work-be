const S3 = require('aws-sdk/clients/s3');

const {
  AWS_REGION,
  AWS_ACCESS_KEY,
  AWS_SECRET_KEY,
  AWS_S3_BUCKET_NAME,
} = require('../constants');
const generateKeyFromFile = require('../utils/generateKeyFromFilename');

const s3 = new S3({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY,
  },
});

function uploadFile(file) {
  const key = generateKeyFromFile(file);

  return s3
    .upload({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: file.mimetype,
    })
    .promise();
}

async function getFileStream(key) {
  return s3
    .getObject({ Key: key, Bucket: AWS_S3_BUCKET_NAME })
    .createReadStream();
}

module.exports = { uploadFile, getFileStream };
