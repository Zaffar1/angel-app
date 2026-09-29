const Joi = require('joi');

exports.volunteerPostValidation = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    image: Joi.string().required(),
    post_status: Joi.string().optional(),
    status: Joi.string().optional(),
});