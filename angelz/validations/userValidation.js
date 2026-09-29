const Joi = require('joi');

const locationSchema = Joi.object({
  city: Joi.string().optional(),
  state: Joi.string().optional(),
  country: Joi.string().optional(),
  zipcode: Joi.string().optional(),
  coordinates: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required()
  }).optional()
});


// const timingSchema = Joi.object({
//   day: Joi.string().valid(
//     'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
//   ).required(),
//   from: Joi.string()
//     .pattern(/^([0-1]\d|2[0-3]):([0-5]\d)$/)
//     .message("Invalid 'from' time format (HH:MM)")
//     .required(),
//   to: Joi.string()
//     .pattern(/^([0-1]\d|2[0-3]):([0-5]\d)$/)
//     .message("Invalid 'to' time format (HH:MM)")
//     .required()
// });

// const timingSchema = Joi.object({
//   day: Joi.string()
//     .valid(
//       "Monday",
//       "Tuesday",
//       "Wednesday",
//       "Thursday",
//       "Friday",
//       "Saturday",
//       "Sunday"
//     )
//     .required(),

//   start_time: Joi.string()
//     .pattern(/^([0-1]\d|2[0-3]):([0-5]\d)$/)
//     .message("Invalid start_time format (expected HH:MM 24-hour)")
//     .required(),

//   end_time: Joi.string()
//     .pattern(/^([0-1]\d|2[0-3]):([0-5]\d)$/)
//     .message("Invalid end_time format (expected HH:MM 24-hour)")
//     .required(),
// }).custom((value, helpers) => {
//   const { start_time, end_time } = value;

//   if (!start_time || !end_time) {
//     return helpers.error("any.invalid", {
//       message: "Both start_time and end_time are required",
//     });
//   }

//   const [sh, sm] = start_time.split(":").map(Number);
//   const [eh, em] = end_time.split(":").map(Number);

//   const startMinutes = sh * 60 + sm;
//   const endMinutes = eh * 60 + em;

//   if (endMinutes <= startMinutes) {
//     return helpers.error("any.invalid", {
//       message: "end_time must be later than start_time",
//     });
//   }

//   return value;
// }, "Time range validation");

// const timingSchema = Joi.object({
//   day: Joi.string()
//     .valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
//     .required(),

//   from: Joi.string()
//     .pattern(/^([0-1]\d|2[0-3]):([0-5]\d)$/)
//     .message("Invalid 'from' time format (expected HH:MM in 24-hour format)")
//     .optional(),

//   to: Joi.string()
//     .pattern(/^([0-1]\d|2[0-3]):([0-5]\d)$/)
//     .message("Invalid 'to' time format (expected HH:MM in 24-hour format)")
//     .optional(),

//   start_time: Joi.string().optional(),
//   end_time: Joi.string().optional(),
// }).custom((value, helpers) => {
//   const start = value.start_time || value.from;
//   const end = value.end_time || value.to;

//   if (!start || !end) {
//     return helpers.error("any.invalid", { message: "Both start and end times are required" });
//   }

//   const [sh, sm] = start.split(":").map(Number);
//   const [eh, em] = end.split(":").map(Number);
//   const startMin = sh * 60 + sm;
//   const endMin = eh * 60 + em;

//   if (endMin <= startMin) {
//     return helpers.error("any.invalid", { message: "'end_time' must be later than 'start_time'" });
//   }

//   // normalize values
//   return {
//     day: value.day,
//     start_time: start,
//     end_time: end
//   };
// }, "Time range validation");


const timingSchema = Joi.object({
  // day: Joi.string()
  //   .valid(
  //     "Monday",
  //     "Tuesday",
  //     "Wednesday",
  //     "Thursday",
  //     "Friday",
  //     "Saturday",
  //     "Sunday"
  //   )
  //   .required(),
day: Joi.string()
  .pattern(/^[A-Za-z\s]+$/)
  .message("Day must contain only alphabets")
  .required(),

  start_time: Joi.string()
    .pattern(/^([0-1]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .message("Invalid 'start_time' format (expected HH:MM or HH:MM:SS in 24-hour format)")
    .required(),

  end_time: Joi.string()
    .pattern(/^([0-1]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .message("Invalid 'end_time' format (expected HH:MM or HH:MM:SS in 24-hour format)")
    .required(),
})
.custom((value, helpers) => {
  // Convert both to minutes since midnight for comparison
  const toMinutes = (time) => {
    const parts = time.split(":").map(Number);
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    return h * 60 + m;
  };

  const start = toMinutes(value.start_time);
  const end = toMinutes(value.end_time);

  if (end <= start) {
    return helpers.error("any.invalid", {
      message: "'end_time' must be later than 'start_time'",
    });
  }

  return value;
}, "Time range validation");



// const timingSchema = Joi.object({
//   day: Joi.string()
//     .valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
//     .required(),

//   start_time: Joi.string()
//     .pattern(/^([0-1]\d|2[0-3]):([0-5]\d)$/)
//     .message("Invalid 'from' time format (expected HH:MM in 24-hour format)")
//     .required(),

//   end_time: Joi.string()
//     .pattern(/^([0-1]\d|2[0-3]):([0-5]\d)$/)
//     .message("Invalid 'to' time format (expected HH:MM in 24-hour format)")
//     .required()
// }).custom((value, helpers) => {
//   // Extra check: ensure "to" is after "from"
//   const [fromH, fromM] = value.from.split(":").map(Number);
//   const [toH, toM] = value.to.split(":").map(Number);

//   const fromMinutes = fromH * 60 + fromM;
//   const toMinutes = toH * 60 + toM;

//   if (toMinutes <= fromMinutes) {
//     return helpers.error("any.invalid", {
//       message: "'to' time must be later than 'from' time"
//     });
//   }

//   return value;
// }, "Time range validation");


exports.registerValidation = Joi.object({
  name: Joi.string().required(),
  last_name: Joi.string().optional(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('password'))
    .messages({
      'any.only': 'Confirm password must match password',
      'string.empty': 'Confirm password is required'
    }),

  contact_no: Joi.string().pattern(/^\d{10,15}$/).optional(),
  description: Joi.string().optional(),

  type: Joi.string().valid('admin','volunteer','organization','user','volunteer_group').optional(),
  image: Joi.string().uri().optional(),

  // Arrays for child tables
  expertise: Joi.array().items(Joi.string()).optional(),
  preferences: Joi.array().items(Joi.string()).optional(),
  available_timing: Joi.array().items(timingSchema).optional(),

  // address: Joi.string().optional(),

  // Nested location object
  city: Joi.string().optional(),
  state: Joi.string().optional(),
  country: Joi.string().optional(),
  zipcode: Joi.string().optional(),
  lat: Joi.number().optional(),
  lng: Joi.number().optional()
});

exports.loginValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});


// exports.organizationValidation = Joi.object({
//   company_name: Joi.string().required(),
//   description: Joi.string().allow("").optional(),
//   email: Joi.string().email().required(),
//   contact: Joi.string().allow("").optional(),
//   address: Joi.string().allow("").optional(),
//   city: Joi.string().allow("").optional(),
//   state: Joi.string().allow("").optional(),
//   zipcode: Joi.string().allow("").optional(),
//   country: Joi.string().allow("").optional(),
//   type: Joi.string().allow("").optional(),
// });

exports.editValidation = Joi.object({
  name: Joi.string().allow("").optional(),
  last_name: Joi.string().allow("").optional(),

  contact_no: Joi.string()
    .pattern(/^\d{10,15}$/)
    .message("Please enter a valid contact number")
    .allow("")
    .optional(),

  description: Joi.string().allow("").optional(),
  image: Joi.any().optional(),

  address: Joi.string().allow("").optional(),
  city: Joi.string().allow("").optional(),
  state: Joi.string().allow("").optional(),
  country: Joi.string().allow("").optional(),
  zipcode: Joi.string().allow("").optional(),

  lat: Joi.number().optional(),
  lng: Joi.number().optional(),
  //  Accept both string and array for form-data compatibility
  available_timing: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(timingSchema))
    .optional(),

  //  Do the same for expertise and preferences
  expertise: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(Joi.string()))
    .optional(),

  preferences: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(Joi.string()))
    .optional(),

  company_name: Joi.string().allow("").optional(),

  //  Allow string or array for company_type (e.g. "NGO" or ["NGO", "Nonprofit"])
  company_type: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(Joi.string()))
    .optional(),
    services: Joi.string().allow("").optional(),
    organization_website: Joi.string().uri().allow("").optional(),
});


// exports.editValidation = Joi.object({
//   name: Joi.string().optional(),
//   last_name: Joi.string().optional(),

//   contact_no: Joi.string()
//     .pattern(/^\d{10,15}$/)
//     .message("Please enter a valid contact number")
//     .allow("")
//     .optional(),

//   description: Joi.string().allow("").optional(),
//   image: Joi.optional(),

//   address: Joi.string().allow("").optional(),
//   city: Joi.string().allow("").optional(),
//   state: Joi.string().allow("").optional(),
//   country: Joi.string().allow("").optional(),
//   zipcode: Joi.string().allow("").optional(),

//   lat: Joi.number().optional(),
//   lng: Joi.number().optional(),

//   // Accept both string and array for form-data compatibility
//   available_timing: Joi.alternatives().try(
//     Joi.string(),
//     Joi.array().items(timingSchema)
//   ).optional(),

//   expertise: Joi.array().items(Joi.string()).optional(),
//   preferences: Joi.array().items(Joi.string()).optional(),
//   company_name: Joi.string().allow("").optional(),
//   // company_type: Joi.string().allow("").optional(),
//   company_type: Joi.alternatives().try(
//   Joi.string(),
//   Joi.array().items(Joi.string())
//   ).optional()
// });

// exports.editValidation = Joi.object({
//   name: Joi.string().optional(),
//   last_name: Joi.string().optional(),
//   email: Joi.string().optional(),
//   contact_no: Joi.string()
//     .pattern(/^\d{10,15}$/)
//     .message("Please enter a valid contact number")
//     .optional(),
//   description: Joi.string().optional(),
//   image: Joi.optional(),
//   // address: Joi.string().optional(),
//   city: Joi.string().optional(),
//   state: Joi.string().optional(),
//   country: Joi.string().optional(),
//   zipcode: Joi.string().optional(),
//   lat: Joi.number().optional(),
//   lng: Joi.number().optional(),
//   // location: locationSchema.optional(),
//   available_timing: Joi.array().items(timingSchema).optional(),
//   expertise: Joi.array().items(Joi.string()).optional(),
//   preferences: Joi.array().items(Joi.string()).optional(),
//   password: Joi.string().min(6).optional(),
//   // organization: exports.organizationValidation.optional()
//   company_name: Joi.string().optional(),
//   description: Joi.string().allow("").optional(),
//   contact: Joi.string().allow("").optional(),
//   address: Joi.string().allow("").optional(),
//   city: Joi.string().allow("").optional(),
//   state: Joi.string().allow("").optional(),
//   zipcode: Joi.string().allow("").optional(),
//   country: Joi.string().allow("").optional(),
//   company_type: Joi.string().allow("").optional(),
// });


// exports.editValidation = Joi.object({
//   name: Joi.string().optional(),
//   password: Joi.string().min(6).optional(),
//   type: Joi.string().valid('admin', 'user', 'organization').optional(),
//   status: Joi.string().valid('active', 'inactive').optional(),
//   image: Joi.string().uri().optional(),
//   preferences: Joi.array().items(Joi.string()).optional(),
//   location: locationSchema.optional()
// });


exports.changePasswordValidation = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, lowercase letter, special character and number',
      'string.empty': 'New password is required',
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords must match',
      'string.empty': 'Confirm password is required',
    }),
});