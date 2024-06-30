const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { licenceService, wordPressService } = require('../services');
const { post, put, getDynamic } = require('../commonServices/axios.service');
const mongoose = require('mongoose');
const { response } = require('express');
const ZOHOController = require('./ZOHO.controller');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const ObjectId = mongoose.Types.ObjectId;

const syncOrders = catchAsync(async (req, res) => {
  try {
    const licence = await licenceService.findOne({ _id: ObjectId(req.query.licenceNumber) });
    const WooCommerce = new WooCommerceRestApi({
      url: licence.storeUrl,
      consumerKey: licence.WPKey,
      consumerSecret: licence.WPSecret,
      version: 'wc/v3'
    });
    const IdsToExclude = await wordPressService.findOrder(
      {
        userId: req.user._id,
        _id: ObjectId(req.query.licenceNumber)
      },
      true,
      { id: 1, _id: 0 }
    );
    fetchFromOrder(WooCommerce, IdsToExclude, req);

    res.status(httpStatus.OK).send({ msg: 'Order sync in progress' });
  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(!!e?.response ? {
      statusText: e.response.statusText,
      data: e.response.data
    } : e);
  }
});

const getOrders = catchAsync(async (req, res) => {
  try {
    const licence = await wordPressService.find({ _id: ObjectId(req.query.licenceNumber) });
    res.status(httpStatus.OK).send({ msg: 'Order sync in progress' });
  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(!!e?.response ? {
      statusText: e.response.statusText,
      data: e.response.data
    } : e);
  }
});

const linkLicence = catchAsync(async (req, res) => {
  try {
    const { body } = req;
    if (body.email && body.licenceNumber && body.storeUrl) {
      const [licence] = await licenceService.aggregate([
          {
            $match: {
              _id: ObjectId(body.licenceNumber)
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: '$user'
          }
        ]);
      if(licence?.user?.email == body.email) {
        const data = await licenceService.updateOne({_id: ObjectId(body.licenceNumber)}, {storeUrl: body.storeUrl});
        res.status(httpStatus.OK).send(data);
      }
    } else if (body.user_id && body.consumer_key && body.consumer_secret) {
      const data = await licenceService.updateOne({_id: ObjectId(body.user_id)}, {
        WPKey: body.consumer_key,
        WPSecret: body.consumer_secret
      })
      res.status(httpStatus.OK).send(data);
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ msg: 'Invalid Parameter' });
    }
  } catch (e) {
    console.error(e);
    res.status(e?.response.status || httpStatus.INTERNAL_SERVER_ERROR).send(!!e?.response ? {
      statusText: e.response.statusText,
      data: e.response.data
    } : e);
  }
});

const syncCustomer = catchAsync(async (req, res) => {
  try {
    const licence = await licenceService.findOne({ _id: ObjectId(req.query.licenceNumber) });
    const WooCommerce = new WooCommerceRestApi({
      url: licence.storeUrl,
      consumerKey: licence.WPKey,
      consumerSecret: licence.WPSecret,
      version: 'wc/v3'
    });
    const IdsToExclude = await wordPressService.findCustomer(
      {
        userId: req.user._id,
        _id: ObjectId(req.query.licenceNumber)
      },
      true,
      { id: 1, _id: 0 }
    );
    fetchFromGeneric(WooCommerce, IdsToExclude, req, 'customers');
    res.status(httpStatus.OK).send({ msg: 'Order sync in progress' });
  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(!!e?.response ? {
      statusText: e.response.statusText,
      data: e.response.data
    } : e);
  }
})

const syncCustomerToZoho = catchAsync(async (req, res) => {
  try {
    if(!req.query.organization_id) res.status(httpStatus.BAD_REQUEST).send({msg: 'organization_id is required'});
    await syncToZohoFromGeneric(req, 'createCustomers');
    res.status(httpStatus.OK).send({ msg: 'Order sync in progress' });
  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(!!e?.response ? {
      statusText: e.response.statusText,
      data: e.response.data
    } : e);
  }
})

module.exports = {
  syncOrders,
  linkLicence,
  getOrders,
  syncCustomer,
  syncCustomerToZoho
};

const fetchFromOrder = async (WooCommerce, IdsToExclude, req) => {
  const responseArray = [];
  const limit = 100;
  for (let i = 1; ; i++) {
    const orders = await WooCommerce.get('orders', {
      per_page: limit,
      page: i,
      exclude: IdsToExclude.map((ele) => ele.id)
    });
    if (orders.status === httpStatus.OK) {
      await wordPressService.createOrder(req, orders.data);
      responseArray.concat(orders.data);
    } else {
      responseArray.concat(orders.data);
    }
    if (orders.data.length < limit) {
      break;
    }
  }
}

const fetchFromGeneric = async (WooCommerce, IdsToExclude, req, getWhat = 'customers') => {
  const serviceMap = {
    customers: wordPressService.createCustomer,
  }
  const responseArray = [];
  const limit = 100;
  for (let i = 1; ; i++) {
    const orders = await WooCommerce.get(getWhat, {
      per_page: limit,
      page: i,
      exclude: IdsToExclude.map((ele) => ele.id)
    });
    if (orders.status === httpStatus.OK) {
      await serviceMap[getWhat](req, orders.data);
      responseArray.concat(orders.data);
    } else {
      responseArray.concat(orders.data);
    }
    if (orders.data.length < limit) {
      break;
    }
  }
}

const syncToZohoFromGeneric = async (req, getWhat = 'customers') => {
  const serviceMap = {
    customers: wordPressService.findCustomer,
    createCustomers: wordPressService.findCustomer,
    bulkWritecreateCustomers: wordPressService.bulkWrite,
  }
  const countMap = {
    customers: wordPressService.getCustomerCount,
    createCustomers: wordPressService.getCustomerCount,
  }
  const ZohoserviceMap = {
    customers: wordPressService.findCustomer,
    createCustomers: ZOHOController.postCreateContact,
  }
  const count = await countMap[getWhat]({ licenceNumber: ObjectId(req.query.licenceNumber), isSyncedToZoho: false });
  const limit = 500;
  let responseArray = [];
  let errorArray = []
  for (let i = 1;i< count ; i++) {
    let data = await serviceMap[getWhat](
      { licenceNumber: ObjectId(req.query.licenceNumber), isSyncedToZoho: false},
      true,
      {},
      {skip: i* limit, limit: limit});
    let transformData = await ZOHOController.transformData(req,data,getWhat)
    for(let i = 0; i < transformData.length; ++i){
      req.body = transformData[i];
      const response = await ZohoserviceMap[getWhat](req);
      if(response && response.status >= 200 && response.status < 300 ) {
        responseArray.push(
          { updateOne :
            {
              "filter": {_id: data[i]._id},
                "update": {
                  $set: {
                    isSyncedToZoho: true
                  }
                }
            }
          }
          )
      } else{
        errorArray.push(response);
      }
      console.log(responseArray);
    }
  }
  let d = await serviceMap[`bulkWrite${getWhat}`](responseArray);
}
