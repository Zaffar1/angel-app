const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const expertiseModel = require('../models/userExpertiseModel');
const preferencesModel = require('../models/userPreferencesModel');
const timingsModel = require('../models/userTimingsModel');
const organizationModel = require('../models/Organization');
const Leaderboard = require("../models/volunteerModel");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/email");
const { resetPasswordTemplate } = require("../utils/emailTemplates/resetPasswordTemplate");

exports.registerUser = async (data) => {
  const existing = await userModel.findByEmail(data.email);
  if (existing) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const userId = await userModel.createUser({ ...data, password: hashedPassword });

  const newUser = await userModel.findById(userId);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, type: newUser.type },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  delete newUser.password;

  return { user: newUser, token };
};

exports.loginUser = async (email, password) => {
  const user = await userModel.findByEmail(email);
  if (!user) throw new Error("Email not found");

  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) throw new Error("Invalid password");

  const token = jwt.sign(
    { id: user.id, type: user.type, isApproved: user.isApproved },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  const { password: _, ...userSafe } = user;

  if (user.type === "organization") {
    const orgDetails = await organizationModel.findByUserId(user.id);
    if (orgDetails) {
      Object.assign(userSafe, orgDetails);
    }
  }


  return { token, user: userSafe, userType: user.type };
};

exports.editProfile = async (userId, data) => {
  const existingUser = await userModel.findById(userId);
  if (!existingUser) throw new Error("User not found");

  let updatedFields = { ...data };

  // Hash password if provided
  if (updatedFields.password) {
    const salt = await bcrypt.genSalt(10);
    updatedFields.password = await bcrypt.hash(updatedFields.password, salt);
  }

  // Extract special fields
  // const { expertise, preferences, available_timing, company_name, description, email: orgEmail, company_type, contact, address, city, state, zipcode, country, ...userFields } = updatedFields;
//   const { expertise, preferences, available_timing, company_name, company_type,services, ...userFields } = updatedFields;
    const { expertise, preferences, available_timing, company_name, company_type, services, organization_website, ...userFields } = updatedFields;
  
  // Update base user table
  if (Object.keys(userFields).length > 0) {
    await userModel.updateUser(userId, userFields);
  }

  if (existingUser.type === "volunteer") {
    // Update expertise
    if (expertise) {
      await expertiseModel.replaceExpertise(userId, expertise);
    }

    // Update preferences
    if (preferences) {
      await preferencesModel.replacePreferences(userId, preferences);
    }

    // Update timings
    if (available_timing) {
      await timingsModel.replaceTimings(userId, available_timing);
    }
  }


  // Prepare organization payload
  const orgPayload = {
    company_name,
    // description,
    // email: orgEmail,
    company_type,
    services,
    organization_website
    // contact,
    // address,
    // city,
    // state,
    // zipcode,
    // country
  };

  // Only update organization if user is of type "organization" and has org fields
  if (existingUser.type === "organization" && company_name) {
    await organizationModel.upsertOrganization(userId, orgPayload);
  }

  return { message: "Profile updated successfully" };
};


// exports.editProfile = async (userId, data) => {
//   const existingUser = await userModel.findById(userId);
//   if (!existingUser) throw new Error("User not found");

//   let updatedFields = { ...data };

//   // Hash password if provided
//   if (updatedFields.password) {
//     const salt = await bcrypt.genSalt(10);
//     updatedFields.password = await bcrypt.hash(updatedFields.password, salt);
//   }

//   // Extract special fields
//   const { expertise, preferences, available_timing, company_name, description, email: orgEmail, type, contact, address, city, state, zipcode, country, ...userFields } = updatedFields;

//   // Update base user table
//   if (Object.keys(userFields).length > 0) {
//     await userModel.updateUser(userId, userFields);
//   }

//   // Update expertise
//   if (expertise) {
//     await expertiseModel.replaceExpertise(userId, expertise);
//   }

//   // Update preferences
//   if (preferences) {
//     await preferencesModel.replacePreferences(userId, preferences);
//   }

//   // Update timings
//   if (available_timing) {
//     await timingsModel.replaceTimings(userId, available_timing);
//   }

//   // Prepare organization payload
//   const orgPayload = {
//     company_name,
//     description,
//     email: orgEmail,
//     type,
//     contact,
//     address,
//     city,
//     state,
//     zipcode,
//     country
//   };

//   // Only update organization if user is of type "organization" and has org fields
//   if (existingUser.type === "organization" && company_name) {
//     await organizationModel.upsertOrganization(userId, orgPayload);
//   }

//   return { message: "Profile updated successfully" };
// };



// exports.getUserProfile = async (userId) => {
//   const user = await userModel.getProfileById(userId);
//   if (!user) throw new Error("User not found");
//   return user;
// };


exports.getUserProfile = async (userId) => {
  const user = await userModel.getProfileById(userId);
  if (!user) throw new Error("User not found");

  const { password, ...userSafe } = user;

  if (user.type === "organization") {
    const orgDetails = await organizationModel.findByUserId(user.id);
    if (orgDetails) {
      const orgVols = await organizationModel.orgVols(orgDetails.org_id);
      Object.assign(userSafe, orgDetails);
        userSafe.organization = {
        ...orgDetails,
        volunteers: orgVols
      };
    }
  }

  if (user.type === "volunteer") {
    const volDetails = await Leaderboard.volDetails(user.id);
    if (volDetails) {
      Object.assign(userSafe, volDetails);
    }
  }

  return userSafe;
};


exports.deleteUser = async (userId) => {
  const deleted = await userModel.deleteUser(userId);
  if (!deleted) throw new Error("User not found");
  return { message: "User deleted successfully" };
};


exports.forgotPassword = async (email) => {
  const user = await userModel.findByEmail(email);
  if (!user) {
    throw new Error("No user found with that email address");
  }

  // Generate random token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetExpires = new Date(Date.now() + 3600000); // 1 hour

  // Save to database
  await userModel.updateUser(user.id, {
    reset_token: resetToken,
    reset_token_expires: resetExpires,
  });

  // Send email
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

  const { message, html } = resetPasswordTemplate(resetUrl);

  try {

    await sendEmail({
      email: user.email,
      subject: "Reset Your Angelz Password",
      message,
      html
    });

  } catch (err) {

    console.log("EMAIL ERROR:", err);

    await userModel.updateUser(user.id, {
      reset_token: null,
      reset_token_expires: null,
    });

    throw new Error("There was an error sending the email. Try again later.");
  }

  return { message: "Reset link sent to your email!" };
};

exports.resetPassword = async (data) => {
  const { email, token, password } = data;

  const user = await userModel.findByEmail(email);
  if (!user) {
    throw new Error("Invalid reset link or user not found");
  }

  // Check token and expiration
  if (user.reset_token !== token || new Date(user.reset_token_expires) < new Date()) {
    throw new Error("Reset token is invalid or has expired");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update user
  await userModel.updateUser(user.id, {
    password: hashedPassword,
    reset_token: null,
    reset_token_expires: null,
  });

  return { message: "Password reset successful!" };
};


exports.changePassword = async (userId, data) => {
  const { currentPassword, password } = data;

  const user = await userModel.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new Error("Incorrect current password");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await userModel.updateUser(userId, {
    password: hashedPassword,
  });

  return { message: "Password changed successfully!" };
};