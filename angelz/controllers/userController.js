const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectDB = require('../config/db');
const userService = require('../services/userService');
const { registerValidation, loginValidation, editValidation, changePasswordValidation } = require('../validations/userValidation');

exports.registerUser = async (req, res) => {
  try {
    const { error } = registerValidation.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map(err => err.message.replace(/"/g, ""));
      return res.status(400).json({ errors: messages });
    }

    const result = await userService.registerUser(req.body);

    res.status(200).json({
      message: "User registered successfully",
      user: result.user,
      token: result.token,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { error } = loginValidation.validate(req.body);
    if (error) {
      const messages = error.details.map(err => err.message.replace(/"/g, ""));
      return res.status(400).json({ errors: messages });
    }

    const { email, password } = req.body;
    const result = await userService.loginUser(email, password);

    res.json({ message: "Login successful", token: result.token, user: result.user, userType: result.userType    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// exports.registerUser = async (req, res) => {
//   try {
//     const { error } = registerValidation.validate(req.body, { abortEarly: false });
//     if (error) {
//       const messages = error.details.map(err => err.message.replace(/"/g, ''));
//       return res.status(400).json({ errors: messages });
//     }

//     const {
//       name,
//       last_name,
//       email,
//       password,
//       contact_no,
//       description,
//       type,
//       image,
//       city,
//       state,
//       // country,
//       zipcode,
//       lat,
//       lng
//     } = req.body;

//     const pool = await connectDB();

//     // check if email exists
//     const [existingUser] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
//     if (existingUser.length > 0) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     // hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // insert user
//     const [result] = await pool.query(
//       `INSERT INTO users 
//        (name, last_name, email, password, contact_no, description, type, image, city, state, zipcode, lat, lng) 
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [name, last_name, email, hashedPassword, contact_no, description, type, image, city, state, zipcode, lat, lng]
//     );

//     // get inserted user
//     const [newUser] = await pool.query("SELECT * FROM users WHERE id = ?", [result.insertId]);

//     // generate token
//     const token = jwt.sign(
//       { id: newUser[0].id, email: newUser[0].email, type: newUser[0].type },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     // remove password before sending user data
//     delete newUser[0].password;

//     res.status(200).json({
//       message: "User registered successfully",
//       user: newUser[0],
//       token
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//   }
// };


// exports.loginUser = async (req, res) => {
//   try {
//     const { error } = loginValidation.validate(req.body);
//     if (error) {
//       const messages = error.details.map(err => err.message.replace(/"/g, ''));
//       return res.status(400).json({ errors: messages });
//     }

//     const pool = await connectDB();
//     const { email, password } = req.body;

//     const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

//     if (rows.length === 0) {
//       return res.status(400).json({ message: 'Email not found' });
//     }

//     const user = rows[0];

//     const validPass = await bcrypt.compare(password, user.password);
//     if (!validPass) {
//       return res.status(400).json({ message: 'Invalid password' });
//     }

//     const token = jwt.sign(
//       { id: user.id, type: user.type }, 
//       process.env.JWT_SECRET, 
//       { expiresIn: '1d' }
//     );

//     res.json({ message: 'Login successful', token });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

exports.editProfile = async (req, res) => {
  try {
    let body = { ...req.body };

    if (req.file) {
      body.image = `/uploads/users/images/${req.file.filename}`;
    }

    // Parse JSON array fields sent via FormData
    const parseIfJson = (key) => {
      if (body[key] && typeof body[key] === "string") {
        try {
          body[key] = JSON.parse(body[key]);
        } catch (err) {
          return res.status(400).json({ errors: [`Invalid JSON for ${key}`] });
        }
      }
    };

    ["available_timing", "preferences", "expertise"].forEach(parseIfJson);

    //  Validate AFTER parsing
    const { error } = editValidation.validate(body);
    if (error) {
      const messages = error.details.map((e) => e.message.replace(/"/g, ""));
      return res.status(400).json({ errors: messages });
    }

    //  Pass parsed body to service
    const result = await userService.editProfile(req.user.id, body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// exports.editProfile = async (req, res) => {
//   try {
//     // Clone req.body into a mutable object
//     let body = { ...req.body };

//     if (req.file) {
//       body.image = `/uploads/users/images/${req.file.filename}`;
//     }

//     // Parse available_timing if it's a string (form-data case)
//     if (body.available_timing && typeof body.available_timing === "string") {
//       try {
//         body.available_timing = JSON.parse(body.available_timing);
//       } catch (err) {
//         return res.status(400).json({ errors: ["Invalid JSON for available_timing"] });
//       }
//     }

//     // Validate AFTER parsing
//     const { error } = editValidation.validate(body);
//     if (error) {
//       const messages = error.details.map(e => e.message.replace(/"/g, ""));
//       return res.status(400).json({ errors: messages });
//     }

//     // Pass the parsed + validated body to service
//     const result = await userService.editProfile(req.user.id, body);
//     res.json(result);

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };



exports.userProfile = async (req, res) => {
  try {
    const user = await userService.getUserProfile(req.user.id);
    res.json({ userDetails: user });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

exports.userDelete = async (req, res) => {
  try {
    const result = await userService.deleteUser(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const result = await userService.forgotPassword(email);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) {
      return res.status(400).json({ message: "Email, token, and password are required" });
    }
    const result = await userService.resetPassword({ email, token, password });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { error } = changePasswordValidation.validate(req.body);
    if (error) {
      const messages = error.details.map((e) => e.message.replace(/"/g, ""));
      return res.status(400).json({ errors: messages });
    }

    const result = await userService.changePassword(req.user.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// exports.registerUser = async (req, res) => {
//   try {
//     const { error } = registerValidation.validate(req.body, { abortEarly: false });
//     if (error) {
//       const messages = error.details.map(err => err.message.replace(/"/g, ''));
//       return res.status(400).json({ errors: messages });
//     }

//     const {
//       name,
//       last_name,
//       email,
//       password,
//       confirmPassword,
//       contact_no,
//       description,
//       type,
//       image,
//       city,
//       state,
//       country,
//       zipcode,
//       lat,
//       lng
//     } = req.body;

//     const pool = await connectDB();

//     const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
//     if (existingUser.length > 0) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const [result] = await pool.query(
//       `INSERT INTO users 
//        (name, last_name, email, password, contact_no, description, type, image, city, state, country, zipcode, lat, lng) 
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [name, last_name, email, hashedPassword, contact_no, description, type, image, city, state, country, zipcode, lat, lng]
//     );

//     res.status(200).json({ message: 'User registered successfully' });
//     // res.status(200).json({ message: 'User registered successfully', userId: result.insertId });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//   }
// }



// exports.editProfile = async (req, res) => {
//   try {
//     const { error } = editValidation.validate(req.body);
//     if (error) {
//       const messages = error.details.map((err) => err.message.replace(/"/g, ""));
//       return res.status(400).json({ errors: messages });
//     }

//     const pool = await connectDB();

//     const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.user.id]);
//     if (rows.length === 0) {
//       return res.status(400).json({ message: "User not found" });
//     }

//     let updatedFields = { ...req.body };

//     if (updatedFields.password) {
//       const salt = await bcrypt.genSalt(10);
//       updatedFields.password = await bcrypt.hash(updatedFields.password, salt);
//     }

//     const fields = Object.keys(updatedFields)
//       .map((field) => `${field} = ?`)
//       .join(", ");
//     const values = Object.values(updatedFields);

//     await pool.query(`UPDATE users SET ${fields} WHERE id = ?`, [...values, req.user.id]);

//     res.json({ message: "Profile updated successfully" });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

////////////// IF user want edit expertise,preferences,timings


// exports.editProfile = async (req, res) => {
//   try {
//     const { error } = editValidation.validate(req.body);
//     if (error) {
//       const messages = error.details.map((err) => err.message.replace(/"/g, ""));
//       return res.status(400).json({ errors: messages });
//     }

//     const pool = await connectDB();

//     const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.user.id]);
//     if (rows.length === 0) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     let updatedFields = { ...req.body };

//     if (updatedFields.password) {
//       const salt = await bcrypt.genSalt(10);
//       updatedFields.password = await bcrypt.hash(updatedFields.password, salt);
//     }

//     const userFields = { ...updatedFields };
//     delete userFields.expertise;
//     delete userFields.preferences;
//     delete userFields.available_timing;

//     if (Object.keys(userFields).length > 0) {
//       const fields = Object.keys(userFields)
//         .map((field) => `${field} = ?`)
//         .join(", ");
//       const values = Object.values(userFields);

//       await pool.query(`UPDATE users SET ${fields} WHERE id = ?`, [...values, req.user.id]);
//     }

//     if (updatedFields.expertise) {
//       await pool.query("DELETE FROM user_expertise WHERE user_id = ?", [req.user.id]);
//       for (const skill of updatedFields.expertise) {
//         await pool.query("INSERT INTO user_expertise (user_id, expertise) VALUES (?, ?)", [
//           req.user.id,
//           skill,
//         ]);
//       }
//     }

//     if (updatedFields.preferences) {
//       await pool.query("DELETE FROM user_preferences WHERE user_id = ?", [req.user.id]);
//       for (const pref of updatedFields.preferences) {
//         await pool.query("INSERT INTO user_preferences (user_id, preference) VALUES (?, ?)", [
//           req.user.id,
//           pref,
//         ]);
//       }
//     }

//     if (updatedFields.available_timing) {
//       await pool.query("DELETE FROM user_timings WHERE user_id = ?", [req.user.id]);
//       for (const timing of updatedFields.available_timing) {
//         await pool.query(
//           "INSERT INTO user_timings (user_id, day, `from`, `to`) VALUES (?, ?, ?, ?)",
//           [req.user.id, timing.day, timing.from, timing.to]
//         );
//       }
//     }

//     res.json({ message: "Profile updated successfully" });

//   } catch (error) {
//     console.error("Error updating profile:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };
