const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { licenceService } = require('../services');
const createLicence = catchAsync(async (req, res) => {
  try {
    const res = await licenceService.createLicence(req.body);
    res.status(httpStatus.OK).send(URL);
  } catch (e) {
    console.error(e);
    throw e;
  }
});

const getOrganizations = catchAsync(async (req, res) => {
  try {
    const res = await licenceService.getOrganizations(req);
    res.status(httpStatus.OK).send(URL);
  } catch (e) {
    console.error(e);
    throw e;
  }
});

module.exports = {
  createLicence,
  getOrganizations
};
