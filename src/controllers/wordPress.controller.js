const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { licenceService, wordPressService } = require('../services');
const { post, put, getDynamic } = require('../commonServices/axios.service');
const mongoose = require('mongoose');
const { response } = require('express');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const ObjectId = mongoose.Types.ObjectId;

const syncOrders = catchAsync(async (req, res) => {
  try {
    const licence = await licenceService.findOne({ licenceNumber: req.query.licenceNumber });
    const WooCommerce = new WooCommerceRestApi({
      url: licence.storeUrl,
      consumerKey: licence.WPKey,
      consumerSecret: licence.WPSecret,
      version: 'wc/v3'
    });
    const IdsToExclude = await wordPressService.find(
      {
        userId: req.user._id,
        licenceNumber: req.query.licenceNumber
      },
      true,
      { id: 1, _id: 0 }
    );
    const responseArray = [];
    const limit = 100;
    for (let i = 1; ; i++) {
      const orders = await WooCommerce.get('orders', {
        per_page: limit,
        page: i,
        exclude: IdsToExclude.map((ele) => ele.id)
      });
      if (orders.status === httpStatus.OK) {
        await wordPressService.create(req, orders.data);
        responseArray.concat(orders.data);
      } else {
        responseArray.concat(orders.data);
      }
      if (orders.data.length < limit) {
        break;
      }
    }

    res.status(httpStatus.OK).send(responseArray);
  } catch (e) {
    console.error(e);
    res.status(e?.response.status || httpStatus.INTERNAL_SERVER_ERROR).send(!!e?.response ? {
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

module.exports = {
  syncOrders,
  linkLicence
};
