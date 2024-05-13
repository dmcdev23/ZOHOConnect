const { Licence } = require('../models');
const logger = require('../utils/logger');
/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createLicence = async (userBody, userId) => {
  try {
    return await Licence.create({ userId, ...userBody });
  } catch (e) {
    throw e;
  }
};
const getLicenceById = async (id) => {
  try {
    return await Licence.findById(id);
  } catch (e) {
    throw e;
  }
};
const getOrganizations = async (id) => {
  try {
    return await Licence.findById(id);
  } catch (e) {
    throw e;
  }
};
const findOneAndUpdate = async (id, body) => {
  try {
    return await Licence.findOneAndUpdate(id, body);
  } catch (e) {
    throw e;
  }
};

module.exports = {
  createLicence,
  getLicenceById,
  getOrganizations,
  findOneAndUpdate,
};
