const Joi = require('joi');

exports.createPostSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    status: Joi.string().required(),
    can_post: Joi.string().valid('yes','no').default('no')
});