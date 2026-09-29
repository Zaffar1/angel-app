const Joi = require('joi');

exports.organizationValidation = Joi.object({
    company_name: Joi.string().required(),
    description: Joi.string().allow('').optional(),
    email: Joi.string().required(),
    services: Joi.string().optional(),
    contact: Joi.string().allow('').optional(),
    address: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    state: Joi.string().allow('').optional(),
    zipcode: Joi.string().allow('').optional(),
    country: Joi.string().allow('').optional(),
    organization_website: Joi.string().uri().allow('').optional(),
});


exports.organizationIdValidation = Joi.object({
  organization_id: Joi.string()
    .length(24)
    .hex()
    .required()
    .messages({
      'string.length': 'organization_id must be 24 characters long',
      'string.hex': 'organization_id must be a valid hexadecimal ObjectId',
      'any.required': 'organization_id is required'
    })
});