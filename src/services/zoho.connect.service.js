const { Licence } = require('../models');
const { get } = require('../commonServices/axios.service');
const logger = require('../utils/logger');
const { GET_ORGNIZATION, GET_ITEMS } = require('../utils/endPoints');
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
const getOrganizations = async (user) => {
  try {
    return await get(user, GET_ORGNIZATION);
  } catch (e) {
    throw e;
  }
};

const findOneAndUpdate = async (_id, body) => {
  try {
    return await Licence.findOneAndUpdate({ _id }, body, { new: true });
  } catch (e) {
    throw e;
  }
};

const getItems = async (req) => {
  try {
    return await get(
      req.user.licence[req.query.licenceNumber],
      req.query?.itemId
        ? `${GET_ITEMS}/${req.query.itemId}/?organization_id=${req.query.organization_id}`
        : `${GET_ITEMS}/?organization_id=${req.query.organization_id}`
    );
  } catch (e) {
    throw e;
  }
};

module.exports = {
  createLicence,
  getLicenceById,
  getOrganizations,
  findOneAndUpdate,
  getItems,
};
