const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string().required().valid('user', 'admin'),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      name: Joi.string(),
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};
const linkZOHO = {
  query: Joi.object().keys({
    client_id: Joi.string().required(),
    client_secret: Joi.string().required(),
    licenceNumber: Joi.string().required(),
    // licenceNumber: Joi.string().required(),
  }),
};
const createLicence = {
  body: Joi.object().keys({
    clientId: Joi.string().required(),
    clientSecret: Joi.string().required(),
    licenceNumber: Joi.string().required(),
    refreshToken: Joi.string().required(),
    accessToken: Joi.string(),
  }),
};
const getOrganizations = {
  query: Joi.object().keys({
    clientId: Joi.string().required(),
    licenceNumber: Joi.string().required(),
  }),
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  linkZOHO,
  createLicence,
  getOrganizations,
};
