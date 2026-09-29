const fs = require('fs');
const path = require('path');
const multer = require('multer');

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'video/mp4', 'video/mpeg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const getUploadMiddleware = (folder) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const fileType = file.mimetype.startsWith('video') ? 'videos' : 'images';
      const uploadPath = path.join(__dirname, `../uploads/${folder}/${fileType}`);
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log("Saving file to:", uploadPath);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + '-' + file.fieldname + ext);
    }
  });

  return multer({ storage, fileFilter });
};

module.exports = getUploadMiddleware;