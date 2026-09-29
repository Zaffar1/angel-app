const Joi = require('joi');

// const locationValid = Joi.object({
//   lat: Joi.number().required(),
//   lng: Joi.number().required()
// });

exports.missionValidation = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),

  // location: locationValid.optional(),
  lat: Joi.number().optional(),
  lng: Joi.number().optional(),

  start_time: Joi.date().iso().optional(),
  end_time: Joi.date().iso().optional(),

  file: Joi.string().optional(),

  relevant_distance: Joi.string()
    .valid('local', 'city wide', 'country wide', 'global')
    .optional(),

  work_type: Joi.string()
    .valid('tutor', 'staff', 'cleaning', 'watchman')
    .optional(),

  
  // vol_required: Joi.number().optional(),
  // points: Joi.number().optional(),
  // allowa: this field for -> comments,likes,share

  // organization_id: Joi.number()
  //   .integer()
  //   .positive()
  //   .required(),

mission_type: Joi.string().valid('virtual', 'on-site').optional(),

  volunteer_required: Joi.number().integer().min(1).optional(),

  // prefered_volunteer: Joi.array()
  //   .items(Joi.number().integer().positive())
  //   .optional(),

  // prefered_volunteer: Joi.array()
  // .items(Joi.string())
  // .optional(),

  points: Joi.number().integer().min(0).optional(),

  allow_interaction: Joi.alternatives().try(
    Joi.object({
      comments: Joi.boolean(),
      likes: Joi.boolean(),
      share: Joi.boolean()
    }),
    Joi.string()
  ).optional(),


  images: Joi.array()
    .items(Joi.string().optional()),

  assignedvolunteers: Joi.array()
    .items(Joi.number().integer().positive())
    .optional(),

  pendingRequests: Joi.array()
    .items(Joi.number().integer().positive())
    .optional(),

  status: Joi.any(),
  // status: Joi.string()
  //   .valid('pending', 'completed', 'rejected')
  //   .optional()
});


// Assign Volunteers
exports.assignVolunteerValidation = Joi.object({
  missionId: Joi.number().integer().required().messages({
    'number.base': 'missionId must be a number',
    'any.required': 'missionId is required'
  }),
  volunteerId: Joi.number().integer().required().messages({
    'number.base': 'volunteerId must be a number',
    'any.required': 'volunteerId is required'
  }),
});


// Start Mission
exports.startMissionValidation = Joi.object({
  mission_id: Joi.number().integer().required().messages({
    'number.base': 'mission_id must be a number',
    'any.required': 'mission_id is required'
  }),
  volunteer_id: Joi.number().integer().required().messages({
    'number.base': 'volunteer_id must be a number',
    'any.required': 'volunteer_id is required'
  }),
});

// Pending Requests
exports.pendingRequestsValidation = Joi.object({
  missionId: Joi.number().integer().required(),
  volunteerIds: Joi.array().items(Joi.number().integer().required()).min(1).required()
});

exports.rejectRequestValidation = Joi.object({
  missionId: Joi.number().required(),
  volunteerId: Joi.number().required()
});


exports.canPost = Joi.object({
  missionId: Joi.number().required()
});

// Check-in
exports.checkInValidation = Joi.object({
  missionId: Joi.number().integer().required(),
  volunteerId: Joi.number().integer().required(),
  checkInTime: Joi.date().required(),
  checkOutTime: Joi.date().optional().allow(null),
  pointsEarned: Joi.number().optional().default(0)
});

// Check-out update
exports.checkOutValidation = Joi.object({
  checkInId: Joi.number().integer().required(),
  checkOutTime: Joi.date().required(),
  pointsEarned: Joi.number().required()
});


exports.requestMissionValidation = Joi.object({
  mission_id: Joi.number().integer().required().messages({
    'any.required': 'Mission ID is required',
    'number.base': 'Mission ID must be a number'
  })
});

