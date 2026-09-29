const jwt = require('jsonwebtoken');
const organizationService = require('../services/organizationService');
const { editValidation } = require('../validations/userValidation');
const Joi = require('joi');

exports.auth = (req,res,next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired. Please log in again.' });
        } else {
            return res.status(400).json({ message: 'Invalid token' });
        }
    }
}


exports.validateEditProfile = async (req, res, next) => {
  try {
    // 1) Normalize company_type if it's a string (common with form-data)
    if (req.body.company_type && typeof req.body.company_type === 'string') {
      try {
        const parsed = JSON.parse(req.body.company_type);
        req.body.company_type = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        req.body.company_type = [req.body.company_type]; // fallback
      }
    }

    // 2) Run Joi validation
    const schema = editValidation.keys({
      company_type: Joi.array().items(Joi.string()).optional(),
      // services: Joi.string().allow("").optional()
    });

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map(e => e.message.replace(/"/g, ''));
      return res.status(400).json({ errors: messages });
    }

    // 3) DB-backed allowed values check (case-insensitive) + auto-insert if not exists
    if (req.body.company_type && req.body.company_type.length > 0) {
      let orgTypes = await organizationService.getOrgTypesList(); // ["School","NGO","Charity"]
      let allowedLower = orgTypes.map(t => t.toLowerCase());
      const finalTypes = [];

      for (const type of req.body.company_type) {
        const lower = String(type).toLowerCase();
        const idx = allowedLower.indexOf(lower);

        if (idx !== -1) {
          // Already exists → normalize casing
          finalTypes.push(orgTypes[idx]);
        } else {
          // Not in DB → insert and normalize
          const newType = await organizationService.addOrgType(type);
          finalTypes.push(newType);

          // Update local cache to avoid duplicates in same request
          orgTypes.push(newType);
          allowedLower.push(newType.toLowerCase());
        }
      }

      req.body.company_type = finalTypes;
    }

    next();
  } catch (err) {
    console.error('validateEditProfile error', err);
    return res.status(500).json({ error: 'Validation failed: ' + err.message });
  }
};