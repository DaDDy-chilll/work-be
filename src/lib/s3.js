const S3 = require('aws-sdk/clients/s3');
const fs = require('fs');

const uuid = require('uuid').v4;

const {
  AWS_REGION,
  AWS_ACCESS_KEY,
  AWS_SECRET_KEY,
  AWS_S3_BUCKET_NAME,
} = require('../constants');

const s3 = new S3({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY,
  },
});

function uploadFile(file) {
  const [, ext] = file.originalname.split('.');

  return s3
    .upload({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: `${uuid()}.${ext}`,
      Body: file.buffer,
    })
    .promise();
}

module.exports = uploadFile;
