const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { licenceService, wordPressService } = require('../services');
const { post, put, getDynamic } = require('../commonServices/axios.service');
const mongoose = require('mongoose');
const { response } = require('express');
const ZOHOController = require('./ZOHO.controller');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const ObjectId = mongoose.Types.ObjectId;
const { wordPressProduct, WordPressModel } = require('../models');

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
    await fetchFromOrder(WooCommerce, IdsToExclude, req);

    res.status(httpStatus.OK).send({ msg: 'Order sync in progress' });
  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(!!e?.response ? {
      statusText: e.response.statusText,
      data: e.response.data
    } : e);
  }
});

const syncProduct = catchAsync(async (req, res) => {
  try {
    //console.log("syncProduct req",  req.query.licenceNumber )
    const licence = await licenceService.findOne({ _id: ObjectId(req.query.licenceNumber) });
    console.log("syncProduct licence", licence)
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
    await fetchFromGeneric(WooCommerce, IdsToExclude, req, 'products');

    res.status(httpStatus.OK).send({ msg: 'Product sync in progress' });
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
    const licence = await wordPressService.findOrder({ licenceNumber: ObjectId(req.query.licenceNumber) }, true, {}, { page: req.query.page, limit: req.query.limit });
    res.status(httpStatus.OK).send(licence);
  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(!!e?.response ? {
      statusText: e.response.statusText,
      data: e.response.data
    } : e);
  }
});

const getProduct = catchAsync(async (req, res) => {
  try {
    const licence = await wordPressService.findProduct({ licenceNumber: ObjectId(req.query.licenceNumber) }, true, {}, { page: req.query.page, limit: req.query.limit });
    res.status(httpStatus.OK).send(licence);
  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(!!e?.response ? {
      statusText: e.response.statusText,
      data: e.response.data
    } : e);
  }
});

const getCustomer = catchAsync(async (req, res) => {
  try {
    const licence = await wordPressService.findCustomer({ licenceNumber: ObjectId(req.query.licenceNumber) }, true, {}, { page: req.query.page, limit: req.query.limit });
    res.status(httpStatus.OK).send(licence);
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
      if (licence?.user?.email == body.email) {
        const data = await licenceService.updateOne({ _id: ObjectId(body.licenceNumber) }, { storeUrl: body.storeUrl });
        res.status(httpStatus.OK).send(data);
      }
    } else if (body.user_id && body.consumer_key && body.consumer_secret) {
      const data = await licenceService.updateOne({ _id: ObjectId(body.user_id) }, {
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
    await fetchFromGeneric(WooCommerce, IdsToExclude, req, 'customers');
    res.status(httpStatus.OK).send({ msg: 'Customer sync in progress' });
  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(!!e?.response ? {
      statusText: e.response.statusText,
      data: e.response.data
    } : { data: e.message });
  }
})

const syncCustomerToZoho = catchAsync(async (req, res) => {
  try {
    if (!req.query.organization_id) res.status(httpStatus.BAD_REQUEST).send({ msg: 'organization_id is required' });
    await syncToZohoFromGeneric(req, 'createCustomers');
    res.status(httpStatus.OK).send({ msg: 'Customer sync in progress' });
  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(!!e?.response ? {
      statusText: e.response.statusText,
      data: e.response.data
    } : e);
  }
})

const syncProductToZoho = catchAsync(async (req, res) => {
  try {
    if (!req.query.organization_id) res.status(httpStatus.BAD_REQUEST).send({ msg: 'organization_id is required' });
    await syncToZohoFromGeneric(req, 'createProducts');
    //console.log("synProductRes", synProductRes)
    res.status(httpStatus.OK).send({ msg: "Product publish in progress" });
  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(!!e?.response ? {
      statusText: e.response.statusText,
      data: e.response.data
    } : e);
  }
})

const syncOrderToZoho = catchAsync(async (req, res) => {
  try {
    if (!req.query.organization_id) res.status(httpStatus.BAD_REQUEST).send({ msg: 'organization_id is required' });
    //await ZOHOController.postCreateOrder(req);
    await syncToZohoFromGeneric(req, 'createOrders');
    res.status(httpStatus.OK).send({ msg: 'Order sync in progress' });
  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(!!e?.response ? {
      statusText: e.response.statusText,
      data: e.response.data
    } : e);
  }
})

const fetchOrderByOrderId = async (req, res) => {
  try {
    if (!req.query.licenceNumber || !req.query.orderId) {
      return res.status(httpStatus.OK).send({ msg: 'Invalid param pass' });
    }

    const licence = await licenceService.findOne({ _id: ObjectId(req.query.licenceNumber) });
    if (licence) {
      req.user = req.user || {};
      req.user['_id'] = licence?.userId;
    }
    else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ msg: 'Invalid License Number' });
    }

    const WooCommerce = new WooCommerceRestApi({
      url: licence.storeUrl,
      consumerKey: licence.WPKey,
      consumerSecret: licence.WPSecret,
      version: 'wc/v3'
    });

    const order = await WooCommerce.get(`orders/${req.query.orderId}`)
    if (order.data) {
      // console.log("add orders", order.data);
      const createdOrder = await wordPressService.createOrder(req, [order.data]);
      if (createdOrder?.result?.ok === 1 && createdOrder.result.nMatched > 0) {
        const orderDetails = await WordPressModel.findOne({ licenceNumber: licence._id, id: { $eq: order.data.id } });
        if (orderDetails) {
          for (const orderItem of orderDetails.data.line_items) {
          //  console.log("order.data.line_items[0].product_id}", licence._id, orderItem.product_id)
            const wordPressProductItem = await wordPressProduct.findOne({ licenceNumber: licence._id, id: orderItem.product_id }).lean(true);
         //   console.log("wordPressProductItem", wordPressProductItem)
            if (wordPressProductItem) {
              if (wordPressProductItem.id === orderItem.product_id) {
                console.log("wordPressProductItem", wordPressProductItem.data.stock_quantity, orderItem.quantity)
              }
            }
          }
        }
      }
      res.status(httpStatus.OK).send({ msg: 'Order sync in progress' });
    }
    else {
      res.status(httpStatus.OK).send({ msg: 'Order not found' });
    }

  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(!!e?.response ? {
      statusText: e.response.statusText,
      data: e.response.data
    } : e);
  }
}

module.exports = {
  syncOrders,
  linkLicence,
  getOrders,
  syncCustomer,
  syncCustomerToZoho,
  syncProduct,
  syncProductToZoho,
  syncOrderToZoho,
  getProduct,
  getCustomer,
  fetchOrderByOrderId
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
  try {
    {
      const serviceMap = {
        customers: wordPressService.createCustomer,
        products: wordPressService.createProduct,
      }
      const responseArray = [];
      const limit = 100;
      for (let i = 1; ; i++) {
        console.log(i, limit);
        const orders = await WooCommerce.get(getWhat, {
          per_page: limit,
          page: i,
          exclude: IdsToExclude.map((ele) => ele.id)
        });
        if (orders.status === httpStatus.OK) {
          console.log(orders.data);
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
  } catch (e) {
    console.log(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
    throw e;
  }
}

const syncToZohoFromGeneric = async (req, getWhat = 'customers') => {
  try {
    const serviceMap = {
      customers: wordPressService.findCustomer,
      createCustomers: wordPressService.findCustomer,
      bulkWritecreateCustomers: wordPressService.bulkWrite,
      products: wordPressService.findProduct,
      createProducts: wordPressService.findProduct,
      createOrders: wordPressService.findOrder,
      bulkWritecreateProducts: wordPressService.bulkWriteItems,
      bulkWritecreateOrders: wordPressService.bulkWriteOrders,
    }
    const countMap = {
      customers: wordPressService.getCustomerCount,
      createProducts: wordPressService.getProductCount,
      createCustomers: wordPressService.getCustomerCount,
      createOrders: wordPressService.getOrderCount,
    }
    const ZohoserviceMap = {
      customers: wordPressService.findCustomer,
      createCustomers: ZOHOController.postCreateContact,
      createProducts: ZOHOController.postCreateItem,
      createOrders: ZOHOController.postCreateOrder,
    }
    console.log("befor count call");
    const count = await countMap[getWhat]({ licenceNumber: ObjectId(req.query.licenceNumber), isSyncedToZoho: { $exists: false } });
    console.log("count", count)
    const limit = 500;
    let responseArray = [];
    let errorArray = []
    for (let i = 1; i < count / limit + 1; i++) {
      let data = await serviceMap[getWhat](
        { licenceNumber: ObjectId(req.query.licenceNumber), isSyncedToZoho: { $exists: false } },
        true,
        {},
        { skip: (i - 1) * limit, limit: limit });
      //   console.log("email: data?.billing?.email", data.billing)

      let transformData = await ZOHOController.transformData(req, data, getWhat)
      console.log("transformData", transformData);
      for (let j = 0; j < transformData.length; ++j) {
        req.body = transformData[j];
        const response = await ZohoserviceMap[getWhat](req);
        if (response && response.status >= 200 && response.status < 300) {
          let UpdateObject = {
            updateOne:
            {
              "filter": { _id: data[j]._id },
              "update": {
                $set: {
                  isSyncedToZoho: true
                }
              }
            }
          }
          switch (getWhat) {
            case "createCustomers":
              UpdateObject.updateOne.update.$set.contact_id = response?.data?.contact?.contact_id;
              UpdateObject.updateOne.update.$set.email = response?.data?.contact?.email;
              break;
            case "createProducts":
              UpdateObject.updateOne.update.$set.item_id = response?.data?.item.item_id;
              break;
            case "createOrders":
              UpdateObject.updateOne.update.$set.salesorder_id = response?.data?.salesorder?.salesorder_id;
          }
          responseArray.push(
            UpdateObject
          )
        } else {
          errorArray.push(response);
        }
        console.log(responseArray);
      }
    }
    let d = await serviceMap[`bulkWrite${getWhat}`](responseArray);
  } catch (e) {
    console.log(e);
    throw e;
  }
}
