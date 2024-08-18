const { Licence } = require('../models');
const { get } = require('../commonServices/axios.service');
const logger = require('../utils/logger');
const { GET_ORGNIZATION, GET_ITEMS, GET_CONTACTS } = require('../utils/endPoints');
const { tr } = require('faker/lib/locales');
/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createLicence = async (userBody, userId) => {
  try {
    return await Licence.findOneAndUpdate({ userId, ...userBody }, {
      $set: { userId, ...userBody }
    }, {
      upsert: true,
      new: true
    }).lean();
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
const getOrganizations = async (location, accessToken) => {
  try {
    return await get(accessToken, GET_ORGNIZATION(location));
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
        ? `${GET_ITEMS(req.user.licence[req.query.licenceNumber].licenceNumber)}/${req.query.itemId}/?organization_id=${req.query.organization_id}`
        : `${GET_ITEMS(req.user.licence[req.query.licenceNumber].licenceNumber)}/?organization_id=${req.query.organization_id}`
    );
  } catch (e) {
    throw e;
  }
};

const getContacts = async (req) => {
  try {
    return await get(
      req.user.licence[req.query.licenceNumber],
      req.query?.itemId
        ? `${GET_ITEMS(req.user.licence[req.query.licenceNumber].licenceNumber)}/${req.query.itemId}/?organization_id=${req.query.organization_id}`
        : `${GET_CONTACTS((req.user.licence[req.query.licenceNumber].licenceNumber))}/?organization_id=${req.query.organization_id}`
    );
  } catch (e) {
    throw e;
  }
};

const getLicence = async (req) => {
  try {
    return await Licence.find({
      userId: req.user._id
    });
  } catch (e) {
    throw e;
  }
};

const findOne = async (filter, lean = true, project = {}) => {
  try {
    return await Licence.findOne(filter, project).lean(lean);
  } catch (e) {
    throw e;
  }
};

const aggregate = async (pipeline) => {
  try {
    if (!Array.isArray(pipeline)) throw new Error('pipeline must be an array');
    return await Licence.aggregate(pipeline);
  } catch (e) {
    throw e;
  }
};

const updateOne = async (filter, set, options = {}) => {
  try {
    return await Licence.updateOne(filter, {
        $set: set
      },
      options);
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
  getContacts,
  getLicence,
  findOne,
  aggregate,
  updateOne
};
