const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { licenceService } = require('../services');
const { post, put } = require('../commonServices/axios.service');
const createLicence = catchAsync(async (req, res) => {
  try {
    const data = await licenceService.createLicence(req.body);
    res.status(httpStatus.OK).send(data);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});

const getOrganizations = catchAsync(async (req, res) => {
  try {
    const data = await licenceService.getOrganizations(req.user.licence[req.query.licenceNumber]);
    res.status(httpStatus.OK).send(data?.organizations);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});
const createOrganizations = catchAsync(async (req, res) => {
  try {
    const data = await post({
      endpoint: '/organizations',
      accessToken: req.user.licence[req.query.licenceNumber].accessToken,
      data: JSON.stringify(req.body),
    });
    res.status(httpStatus.OK).send(data.organizations);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});
const updateOrganizations = catchAsync(async (req, res) => {
  try {
    const data = await put({
      endpoint: '/organizations',
      accessToken: req.user.licence[req.query.licenceNumber].accessToken,
      data: JSON.stringify(req.body),
    });
    res.status(httpStatus.OK).send(data.organizations);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});

const createItem = catchAsync(async (req, res) => {
  try {
    const { data } = await post({
      endpoint: '/items' + `organization_id=${req.query.organization_id}`,
      accessToken: req.user.licence[req.query.licenceNumber].accessToken,
      data: req.body,
    });
    res.status(httpStatus.OK).send(data);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});

const getItems = catchAsync(async (req, res) => {
  try {
    const data = await licenceService.getItems(req);
    res.status(httpStatus.OK).send(data);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});

const updateItems = catchAsync(async (req, res) => {
  try {
    const data = await put({
      endpoint: '/items' + ('' || `${req.query.itemId}`) +`organization_id=${req.query.organization_id}`,
      accessToken: req.user.licence[req.query.licenceNumber].accessToken,
      data: JSON.stringify(req.body),
    });
    res.status(httpStatus.OK).send(data.item);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});

module.exports = {
  createLicence,
  getOrganizations,
  createOrganizations,
  updateOrganizations,
  createItem,
  getItems,
  updateItems
};
