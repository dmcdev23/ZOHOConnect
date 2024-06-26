const httpStatus = require('http-status');
const { WordPressModel } = require('../models');
const ApiError = require('../utils/ApiError');

const find = async (filter, lean = true, project = {}) => {
  const data = await WordPressModel.find(filter, project).lean(lean);
  return data;
};

const create = async (req, data) => {
  data = data.map((ele) => ({ data: ele, userId: req.user._id.toString(), id: ele.id, licenceNumber: req.query.licenceNumber }));
  return await WordPressModel.create(data);
};

module.exports = {
  find,
  create,
};
