const Joi = require('joi');

const syncOrders = {
  body: Joi.object(),
  query: Joi.object().keys({
    licenceNumber: Joi.string().required(),
  }),
};

const getOrders = {
  query: Joi.object().keys({
    licenceNumber: Joi.string().required(),
    organization_id: Joi.string().optional(),
    page: Joi.number().default(1),
    limit: Joi.number().default(10),
  }),
};

const syncContacts = {
  query: Joi.object().keys({
    licenceNumber: Joi.string().required(),
    organization_id: Joi.string().optional(),
  }),
};
const updateLicence = {
  email: Joi.string(),
  licence: Joi.string(),
  user_id: Joi.string(),
  consumer_key: Joi.string(),
  consumer_secret: Joi.string(),
  storeUrl: Joi.string(),
};

module.exports = {
  syncOrders,
  updateLicence,
  getOrders,
  syncContacts,
};
