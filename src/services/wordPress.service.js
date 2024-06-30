const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { WordPressModel, wordPressCustomer } = require('../models');
const ApiError = require('../utils/ApiError');
const { ObjectId } = mongoose.Types;

const findOrder = async (filter, lean = true, project = {}) => {
  const data = await WordPressModel.find(filter, project).lean(lean);
  return data;
};

const findCustomer = async (filter, lean = true, project = {}, options = {}) => {
  const data = await wordPressCustomer.find(filter, project, options).lean(lean);
  return data;
};

const getCustomerCount = async (filter) => {
  const data = await wordPressCustomer.count(filter);
  return data;
};

const createOrder = async (req, data) => {
  data = data.map((ele) => ({
    data: ele,
    userId: req.user._id.toString(),
    id: ele.id,
    licenceNumber: ObjectId(req.query.licenceNumber),
  }));
  return await WordPressModel.create(data);
};

const createCustomer = async (req, data) => {
  data = data.map((ele) => ({
    data: ele,
    userId: req.user._id.toString(),
    id: ele.id,
    licenceNumber: ObjectId(req.query.licenceNumber),
  }));
  return await wordPressCustomer.create(data);
};

const bulkWrite = async (pipeline) => {
  const data = await wordPressCustomer.bulkWrite(pipeline);
  return data;
};
module.exports = {
  findOrder,
  createOrder,
  createCustomer,
  findCustomer,
  getCustomerCount,
  bulkWrite
};
