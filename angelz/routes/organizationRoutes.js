const express = require('express');
const router = express.Router();
const getUploadMiddleware  = require('../middleware/upload');
// const { createOrganizationController, deleteOrg, getPendingRequests,allOrgs } = require('../controllers/organizationController');
const organizationController = require('../controllers/organizationController');

const { auth } = require('../middleware/authMiddleware');
const { createOrganization, organizationDetails } = require('../controllers/organizationController');
const { uploadMedia } = require('../controllers/organizationMedia');
const {requireOrganization} = require('../middleware/requireAdminChecks');
const upload = getUploadMiddleware('organizations');

// router.post('/create-organization', auth, createOrganization);

// router.post('/create-organization',auth,requireOrganization, upload.array('media', 10),createOrganization);
router.post(
  '/create-organization',
  auth,
  requireOrganization,
  upload.array('media', 10),
  organizationController.createOrganizationController
);

router.get('/all-orgs', auth, requireOrganization, organizationController.allOrgs);
router.get('/all', auth, organizationController.allOrgs);
router.get('/company-types', auth, requireOrganization, organizationController.orgTypes);
router.get("/:id", auth, organizationController.getOrgData);
router.get('/org-detail/:id', auth, requireOrganization, organizationController.organizationDetails);
router.post('/upload-org-media', upload.array('media', 10),auth, requireOrganization, uploadMedia);
// router.post('/respond',auth,requireOrganization,missionResponse);
router.delete('/:organization_id', auth, requireOrganization, organizationController.deleteOrg);

router.get('/missions/pending-requests',auth, requireOrganization, organizationController.getPendingRequests);


module.exports = router;