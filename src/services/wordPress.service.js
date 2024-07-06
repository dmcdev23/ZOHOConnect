const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { WordPressModel, wordPressCustomer, wordPressProduct } = require('../models');
const ApiError = require('../utils/ApiError');

const { ObjectId } = mongoose.Types;

const findOrder = async (filter, lean = true, project = {}, options = { page: 1, limit: 10 }) => {
  const data = await WordPressModel.find(filter, project, {
    skip: (options.page - 1) * options.limit,
    limit: options.limit,
  }).lean(lean);
  return data;
};

const findCustomer = async (filter, lean = true, project = {}, options = {}) => {
  const data = await wordPressCustomer.find(filter, project, options).lean(lean);
  return data;
};

const findProduct = async (filter, lean = true, project = {}, options = {}) => {
  const data = await wordPressProduct.find(filter, project, options).lean(lean);
  return data;
};

const getCustomerCount = async (filter) => {
  const data = await wordPressCustomer.count(filter);
  return data;
};

const getProductCount = async (filter) => {
  const data = await wordPressProduct.count(filter);
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

const createProduct = async (req, data) => {
  data = data.map((ele) => ({
    data: { ...ele, meta_data: ele.meta_data.filter((element) => element.key !== 'amazonS3_cache') },
    userId: req.user._id.toString(),
    id: ele.id,
    licenceNumber: ObjectId(req.query.licenceNumber),
  }));
  return await wordPressProduct.create(data);
};

const bulkWrite = async (pipeline) => {
  const data = await wordPressCustomer.bulkWrite(pipeline);
  return data;
};

const bulkWriteItems = async (pipeline) => {
  const data = await wordPressProduct.bulkWrite(pipeline);
  return data;
};

const bulkWriteOrders = async (pipeline) => {
  const data = await WordPressModel.bulkWrite(pipeline);
  return data;
};

const getOrerCount = async (filter) => {
  const data = await WordPressModel.count(filter);
  return data;
};

module.exports = {
  findOrder,
  createOrder,
  createCustomer,
  findCustomer,
  getCustomerCount,
  bulkWrite,
  createProduct,
  getProductCount,
  bulkWriteItems,
  findProduct,
  getOrerCount,
  bulkWriteOrders
};
