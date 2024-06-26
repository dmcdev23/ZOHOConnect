const Joi = require('joi');

const syncOrders = {
  body: Joi.object(),
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
  updateLicence
};
