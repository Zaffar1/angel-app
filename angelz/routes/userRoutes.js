const express = require('express');
const router = express.Router();
const { registerUser, loginUser, forgotPassword, resetPassword,  editProfile, userProfile, userDelete, changePassword } = require('../controllers/userController');
const { auth, validateEditProfile } = require('../middleware/authMiddleware');
const { getMyOrganization } = require('../controllers/organizationController');
// const { registerValidation } = require('../validations/userValidation');
// const validate = require('../middleware/validateRequest');
const getUploadMiddleware  = require('../middleware/upload');
const upload = getUploadMiddleware('users');
// console.log({
//   registerUser,
//   loginUser,
//   forgotPassword,
//   resetPassword,
//   editProfile,
//   userProfile,
//   userDelete,
//   auth,
//   validateEditProfile,
//   getMyOrganization
// });

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/edit-profile', auth, upload.single("image"), validateEditProfile, editProfile);
router.get('/user-profile', auth, userProfile);
router.delete('/delete-user', auth, userDelete);
router.post('/change-password', auth, changePassword);


router.get('/my-organizations', auth, getMyOrganization);

module.exports = router;