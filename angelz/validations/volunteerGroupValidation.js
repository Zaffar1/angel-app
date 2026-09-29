const Joi = require('joi');

// Validation for registering a Volunteer Group
exports.registerGroupValidation = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  contact_no: Joi.string().pattern(/^\d{10,15}$/).optional(),
  description: Joi.string().allow('').optional(),
  city: Joi.string().allow('').optional(),
  state: Joi.string().allow('').optional(),
  country: Joi.string().allow('').optional(),
});

// Validation for Volunteer Group login
exports.loginGroupValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Validation for inviting a volunteer
exports.inviteVolunteerValidation = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  contact_no: Joi.string().pattern(/^\d{10,15}$/).allow('').optional(),
  description: Joi.string().allow('').optional(),
});

// Validation for updating a volunteer's details
exports.updateVolunteerValidation = Joi.object({
  name: Joi.string().allow('').optional(),
  contact_no: Joi.string().pattern(/^\d{10,15}$/).allow('').optional(),
  description: Joi.string().allow('').optional(),
  city: Joi.string().allow('').optional(),
  state: Joi.string().allow('').optional(),
  country: Joi.string().allow('').optional(),
});


exports.assignToMissionValidation = Joi.object({
  mission_id: Joi.number().integer().positive().required(),
  volunteer_ids: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one volunteer_id is required',
      'any.required': 'volunteer_ids is required',
    }),
});

// Validation for assigning group volunteers to an Organization
exports.assignToOrganizationValidation = Joi.object({
  organization_id: Joi.number().integer().positive().required(),
  volunteer_ids: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one volunteer_id is required',
      'any.required': 'volunteer_ids is required',
    }),
});
