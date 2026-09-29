const volunteerGroupService = require('../services/volunteerGroupService');
const {
  registerGroupValidation,
  loginGroupValidation,
  inviteVolunteerValidation,
  updateVolunteerValidation,
    assignToMissionValidation,
  assignToOrganizationValidation,
} = require('../validations/volunteerGroupValidation');

// ─── Register Volunteer Group ─────────────────────────────────────────────────

exports.registerGroup = async (req, res) => {
  try {
    const { error, value } = registerGroupValidation.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map((d) => d.message),
      });
    }

    const result = await volunteerGroupService.registerGroup(value);

    return res.status(201).json({
      success: true,
      message: 'Volunteer group registered successfully',
      data: result,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

// ─── Login Volunteer Group ────────────────────────────────────────────────────

exports.loginGroup = async (req, res) => {
  try {
    const { error, value } = loginGroupValidation.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map((d) => d.message),
      });
    }

    const result = await volunteerGroupService.loginGroup(value.email, value.password);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

// ─── Invite Volunteer ─────────────────────────────────────────────────────────

exports.inviteVolunteer = async (req, res) => {
  try {
    const { error, value } = inviteVolunteerValidation.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map((d) => d.message),
      });
    }

    const groupUserId = req.user.id;
    const result = await volunteerGroupService.inviteVolunteer(groupUserId, value);

    return res.status(201).json({
      success: true,
      message: 'Volunteer invited successfully. Credentials have been sent via email.',
      data: result,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

// ─── Get Volunteers ───────────────────────────────────────────────────────────

exports.getVolunteers = async (req, res) => {
  try {
    const volunteers = await volunteerGroupService.getVolunteers(
      req.user.id,
      req.user.type
    );

    return res.status(200).json({
      success: true,
      message: 'Volunteers fetched successfully',
      data: volunteers,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

// ─── Get Volunteer By ID ──────────────────────────────────────────────────────

exports.getVolunteerById = async (req, res) => {
  try {
    const { id } = req.params;
    const volunteer = await volunteerGroupService.getVolunteerById(
      parseInt(id),
      req.user.id,
      req.user.type
    );

    return res.status(200).json({
      success: true,
      message: 'Volunteer fetched successfully',
      data: volunteer,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

// ─── Update Volunteer ─────────────────────────────────────────────────────────

exports.updateVolunteer = async (req, res) => {
  try {
    const { error, value } = updateVolunteerValidation.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map((d) => d.message),
      });
    }

    const { id } = req.params;
    const result = await volunteerGroupService.updateVolunteer(
      parseInt(id),
      req.user.id,
      req.user.type,
      value
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

// ─── Delete Volunteer ─────────────────────────────────────────────────────────

exports.deleteVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await volunteerGroupService.deleteVolunteer(
      parseInt(id),
      req.user.id,
      req.user.type
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

exports.assignToMission = async (req, res) => {
  try {
    const { error, value } = assignToMissionValidation.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map((d) => d.message),
      });
    }

    const result = await volunteerGroupService.assignVolunteersToMission(
      req.user.id,
      value.mission_id,
      value.volunteer_ids
    );

    const { assigned, skipped, mission_name } = result;
    let message;
    if (assigned.length > 0 && skipped.length === 0) {
      message = `Successfully assigned ${assigned.length} volunteer${assigned.length > 1 ? 's' : ''} to mission "${mission_name}".`;
    } else if (assigned.length > 0 && skipped.length > 0) {
      message = `${assigned.length} volunteer${assigned.length > 1 ? 's' : ''} assigned to mission "${mission_name}". ${skipped.length} could not be assigned — please review the details below.`;
    } else {
      message = `No volunteers were assigned to mission "${mission_name}". Please review the details below.`;
    }

    return res.status(200).json({
      success: assigned.length > 0,
      message,
      data: result,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

// ─── Assign Volunteers to an Organization ───────────────────────────────────

exports.assignToOrganization = async (req, res) => {
  try {
    const { error, value } = assignToOrganizationValidation.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map((d) => d.message),
      });
    }

    const result = await volunteerGroupService.assignVolunteersToOrganization(
      req.user.id,
      value.organization_id,
      value.volunteer_ids
    );

    const { assigned, skipped, organization_name } = result;
    let message;
    if (assigned.length > 0 && skipped.length === 0) {
      message = `Successfully added ${assigned.length} volunteer${assigned.length > 1 ? 's' : ''} to "${organization_name}".`;
    } else if (assigned.length > 0 && skipped.length > 0) {
      message = `${assigned.length} volunteer${assigned.length > 1 ? 's' : ''} added to "${organization_name}". ${skipped.length} could not be assigned — please review the details below.`;
    } else {
      // All skipped — surface the reasons directly
      const reasons = skipped.map((s) => s.reason).join(' ');
      message = reasons || `No volunteers could be added to "${organization_name}".`;
    }

    return res.status(200).json({
      success: assigned.length > 0,
      message,
      data: result,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};


exports.updateMissionStatus = async (req, res) => {
  try {
    const { mission_id, volunteer_id, status } = req.body;
    if (!mission_id || !volunteer_id) {
      return res.status(400).json({
        success: false,
        message: 'mission_id and volunteer_id are required',
      });
    }

    const result = await volunteerGroupService.updateMissionStatus(
      req.user.id,
      { mission_id, volunteer_id, status: status || 'completed' }
    );

    return res.status(200).json({
      success: true,
      message: 'Mission completion request sent to organization successfully!',
      data: result,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};
