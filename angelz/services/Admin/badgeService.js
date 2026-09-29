const badgeModel = require('../../models/Badge');
const AppError = require('../../utils/AppError');

async function listBadges({ page, limit, search }) {
  const offset = (page - 1) * limit;

  const [badges, total] = await Promise.all([
    badgeModel.findAll({ limit, offset, search }),
    badgeModel.count(search)
  ]);

  return {
    badges,
    page,
    limit,
    totalBadges: total,
    totalPages: Math.ceil(total / limit) || 1
  };
}

async function createBadge(data) {
  if (Number(data.min_points) >= Number(data.max_points)) {
    throw new AppError("Min points must be less than max points", 400);
  }
  return badgeModel.create(data);
}

  async function getBadge(id) {
    return badgeModel.findById(id);
  }



async function updateBadge(id, data) {
  const exists = await badgeModel.findById(id);
  if (!exists) throw new AppError("Badge not found", 404);

  if (Number(data.min_points) >= Number(data.max_points)) {
    throw new AppError("Min points must be less than max points", 400);
  }

  await badgeModel.update(id, data);

  return badgeModel.findById(id);
}


async function deleteBadge(id) {
  const exists = await badgeModel.findById(id);
  if (!exists) throw new AppError("Badge not found", 404);

  return badgeModel.remove(id);
}

module.exports = {
  listBadges,
  createBadge,
  updateBadge,
  deleteBadge,
  getBadge
};
