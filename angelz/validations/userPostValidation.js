const Joi = require('joi');

exports.createPostSchema = Joi.object({
  title: Joi.string().required().messages({
    'string.empty': 'Title is required'
  }),

  // ✅ tags can come as JSON string OR array of strings
  tags: Joi.alternatives()
    .try(
      Joi.string(), 
      Joi.array().items(Joi.string())
    )
    .optional(),

  // ✅ NEW: allow_interaction support
  allow_interaction: Joi.alternatives()
    .try(
      Joi.string(), // when sent as JSON string (FormData)
      Joi.object({
        comments: Joi.boolean().optional(),
        likes: Joi.boolean().optional(),
        share: Joi.boolean().optional(),
      })
    )
    .optional()
});