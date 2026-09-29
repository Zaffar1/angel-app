const Organization = require('../models/Organization');
const { organizationIdValidation } = require('../validations/organizationValidation');
const User = require('../models/User');
const OrganizationMedia = require('../models/OrganizationMedia');
const organizationService = require('../services/organizationService');
const { getPendingMissionRequests,createOrganization } = require('../services/organizationService');



// @desc
// Params
// 
exports.createOrganizationController = async (req, res) => {
    try {
        const userId = req.user.id;
        const payload = req.body;
        const files = req.files;

        const result = await createOrganization(payload, files, userId);

        res.status(201).json({ message: 'Organization created successfully' });

        // res.status(201).json({ message: 'Organization created successfully', organizationId: result.organizationId });

    } catch (error) {
        if (error.type === 'validation') {
            return res.status(400).json({ errors: error.errors });
        } else if (error.type === 'conflict') {
            return res.status(409).json({ message: error.message, file: error.file });
        } else {
            console.error(error);
            return res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
};

exports.getMyOrganization = async (req, res) => {
    try {
        const data = await organizationService.getOrganizationsWithMedia(req.user._id);

        if (!data) {
            return res.status(404).json({ message: "No organizations found for this user" });
        }

        return res.status(200).json({ organizations: data });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getOrgData = async (req, res) => {
  try {
    const { id } = req.params;
    const organization = await organizationService.getOrgData(id);
    const volunteers = await organizationService.getOrgVolsData(id);
    res.json({ organization, volunteers });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// exports.getOrgData = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const organization = await organizationService.getOrgData(id);
//     res.json({ organization });
//   } catch (err) {
//     res.status(404).json({ message: err.message });
//   }
// };

exports.organizationDetails = async (req, res) => {
    try {
        const organizationId = parseInt(req.params.id);
        if (isNaN(organizationId)) {
            return res.status(400).json({ message: "Invalid organization ID" });
        }

        const organization = await organizationService.getOrganizationDetailsWithMedia(organizationId);
        if (!organization) {
            return res.status(404).json({ message: "Organization not found" });
        }

        return res.status(200).json(organization);

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


exports.deleteOrg = async (req, res) => {
    try {
        const {organization_id} = req.params;
        const deleted = await organizationService.deleteOrg(organization_id);
        if (deleted === 0) {
            return res.status(404).json({ message: "Organization not found" });
        }

        res.status(200).json({ message: "Organization deleted successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message:"Server error", error: error.message });
    }
}

exports.allOrgs = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const orgs = await organizationService.allOrgs({ page: Number(page), limit: Number(limit) });
        res.json(orgs);
    } catch (error) {
        res.status(500).json({ message:"Server error", error: error.message });
    }
}


exports.orgTypes = async (req, res) => {
    try {
        const orgTypes = await organizationService.orgTypes();
        res.status(200).json({ success: true, company_types: orgTypes });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

exports.getPendingRequests = async (req, res) => {
  try {
    if (req.user.type !== 'organization') {
      return res.status(403).json({
        success: false,
        message: 'Only organization admins can view pending mission requests'
      });
    }

    const requests = await getPendingMissionRequests(req.user.id);

    return res.json({
      success: true,
      count: requests.length,
      pending_requests: requests
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};


// exports.createOrganization = async (req, res) => {
//     try {
//         const { error } = organizationValidation.validate(req.body);
//         if (error) {
//             const messages = error.details.map(err => err.message.replace(/"/g, ''));
//             return res.status(400).json({ errors: messages });
//         }

//         const organizationExists = await Organization.findOne({ company_name: req.body.company_name });
//         if (organizationExists) {
//             return res.status(400).json({ message: 'Company name already exists' });
//         }

//         const files = req.files;
//         const allowedMimeType = ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'];
//         const maxFileSize = 40 * 1024 * 1024; // 40 MB

//         if (files && files.length > 0) {
//             for (const file of files) {
//                 if (!allowedMimeType.includes(file.mimetype)) {
//                     return res.status(400).json({ message: 'Invalid file type. Only JPG, PNG images and MP4/MOV videos are allowed', file: file.originalname });
//                 }

//                 if (file.size > maxFileSize) {
//                     return res.status(400).json({
//                         message: 'File size is too large, Max size allowed is 40MB',
//                         file: file.originalname
//                     });
//                 }
//             }
//         }

//         const organization = new Organization({
//             ...req.body,
//             user_id: req.user._id
//         });

//         await organization.save();

//         if (files && files.length > 0) {
//             for (const file of files) {
//                 const type = file.mimetype.startsWith('video') ? 'video' : 'image';

//                 const media = new OrganizationMedia({
//                     organization_id: organization._id,
//                     type,
//                     url: `/uploads/organizations/${type === 'video' ? 'videos' : 'images'}/${file.filename}`
//                 });

//                 await media.save();
//             }
//         }

//         res.status(200).json({ message: 'Organization created successfully' });

//     } catch (error) {
//         if (error && error._id) {
//             await Organization.deleteOne({ _id: error._id });
//         }

//         if (error.name === 'ValidationError') {
//             const messages = Object.values(error.errors).map(err => err.message);
//             return res.status(400).json({ errors: messages });
//         }

//         res.status(500).json({ message: 'Server Error', error: error.message });
//     }
// };



// exports.organizationDetails = async (req,res) => {
//     try {
//         const { error } = organizationIdValidation.validate(req.body);

//         if (error) {
//             const messages = error.details.map(err => err.message.replace(/"/g, ''));
//             return res.status(400).json({ errors: messages });
//         }

//         const fetchOrg = await Organization.findById(req.body.organization_id).populate('user','-password').lean() ;
//         if(!fetchOrg) return res.status(400).json({ message: "Organization not found" });

//         const media = await OrganizationMedia.find({ organization_id: fetchOrg._id }).lean();


//         return res.status(200).json({ ...fetchOrg, images: media.filter(m=> m.type === 'image'),
//             videos: media.filter(m=> m.type === 'video')
//           });

//     } catch (error) {
//         res.status(500).json({ message: 'Server Error', error: error.message });
//     }
    
// }