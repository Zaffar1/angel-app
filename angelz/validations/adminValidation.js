const Joi = require('joi');

exports.userListValidation = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    search: Joi.string().allow('').optional(),
    sortBy: Joi.string().valid('name','email','createdAt').optional(),
    sortOrder: Joi.string().valid('asc','desc').optional(),
    type: Joi.string().valid('organization','volunteer'),
    status: Joi.string().valid('active','inactive').optional()
});

exports.volunteerGroupListValidation = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    search: Joi.string().allow('').optional(),
    sortBy: Joi.string().valid('id', 'name', 'email', 'created_at', 'createdAt', 'status', 'points', 'members_count').optional(),
    sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional(),
    status: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    state: Joi.string().allow('').optional(),
    country: Joi.string().allow('').optional(),
});