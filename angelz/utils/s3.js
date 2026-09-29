const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

/**
 * Upload file to S3 and return the public URL
 */
exports.uploadToS3 = async (file) => {
  const fileContent = fs.readFileSync(file.path);
  const fileName = `${Date.now()}-${file.originalname}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    Body: fileContent,
    ContentType: file.mimetype,
    ACL: 'public-read',
  };

  const upload = await s3.upload(params).promise();

  // Optionally delete local file after upload
//   fs.unlinkSync(file.path);

  return upload.Location; // public URL of the uploaded file
};