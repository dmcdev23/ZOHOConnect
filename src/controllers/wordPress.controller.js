const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { licenceService, wordPressService } = require('../services');
const { post, put, getDynamic, get } = require('../commonServices/axios.service');
const mongoose = require('mongoose');
const { response } = require('express');
const ZOHOController = require('./ZOHO.controller');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const ObjectId = mongoose.Types.ObjectId;
const { wordPressProduct, WordPressModel, wordPressCustomer } = require('../models');
const axios = require('axios');

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
      req.query.licenceNumber = licence._id;
      req.query.organization_id = licence.zohoOrganizationId;
    }
    else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ msg: 'Invalid License Number' });
    }
    console.log("req.query", req.query)
    const WooCommerce = new WooCommerceRestApi({
      url: licence.storeUrl,
      consumerKey: licence.WPKey,
      consumerSecret: licence.WPSecret,
      version: 'wc/v3'
    });

    const order = await WooCommerce.get(`orders/${req.query.orderId}`)
    if (order.data) {
     //  console.log("add orders",licence._id, licence.userId, order.data);
       const createdOrder = await WordPressModel.findOneAndUpdate(
        {
          userId: licence.userId,
          id: order.data.id,
        },
        {
          $set: {
            data: order.data,
            userId: licence.userId,
            id: order.data.id,
            licenceNumber: licence._id,
            isSyncedToZoho: false
          },
        },
        { upsert: true, new: true }
      );
      
      await getCustomerFromZoho(licence, createdOrder);
      // console.log("reqZohoAPI", reqZohoAPI)
      if (createdOrder) {
        const orderDetails = await WordPressModel.findOne({ licenceNumber: licence._id, id: { $eq: order.data.id } });
        if (orderDetails) {
          for (const orderItem of orderDetails.data.line_items) {
           // console.log("order.data.line_items[0].product_id}", licence._id, orderItem.product_id)
            const wordPressProductItem = await wordPressProduct.findOne({ licenceNumber: licence._id, id: orderItem.product_id }).lean(true);
          //  console.log("wordPressProductItem", wordPressProductItem)
            if (wordPressProductItem) {
               await CreateOrderInZoho(licence, createdOrder);
               console.log("call end ZOHOController");
              if (wordPressProductItem.id === orderItem.product_id) {
              //  console.log("wordPressProductItem", wordPressProductItem.id,orderItem.product_id, wordPressProductItem.data.stock_quantity, orderItem.quantity)
                let updatedWordPressProduct = await wordPressProduct.findByIdAndUpdate(
                  { _id: wordPressProductItem._id },
                  {
                    $set: {
                      "data.stock_quantity": wordPressProductItem.data.stock_quantity - orderItem.quantity
                    }
                  },
                  { new: true }
                );
               // console.log("updatedWordPressProduct", updatedWordPressProduct)
               // return res.status(httpStatus.OK).send({ msg: `Updated quantity ${updatedWordPressProduct.data.stock_quantity}` });
              }
            }
           // return res.status(httpStatus.NOT_FOUND).send({ msg: 'ProductItem not found in Order sync' });

          }
          return res.status(httpStatus.OK).send({ msg: 'Order sync successfully' });
        }
        return res.status(httpStatus.NOT_FOUND).send({ msg: 'Requested Order not found in Order sync' });
      }
      return res.status(httpStatus.NOT_FOUND).send({ msg: 'Some thing went wrong in createdOrder Order sync' });

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

async function getCustomerFromZoho(licence, createdOrder) {
  try {
    console.log("call getCustomerFromZoho")
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://www.zohoapis.in/inventory/v1/contacts?organization_id=${licence.zohoOrganizationId}&email=${createdOrder?.data?.billing?.email}`,
      headers: { 
        'Authorization': `Bearer ${licence.accessToken}`
      }
    };

    const customer = await axios.request(config);
  //  console.log("zohoResponse customer", customer)
    if (customer.data.contacts.length == 0) {
     // console.log(createdOrder?.data?.billing);
      const customerZohoPayload = {
        "contact_name": createdOrder?.data?.billing?.first_name + " " + createdOrder?.data?.billing?.last_name,
        "company_name": "",
        "contact_type": "customer",
        "currency_id": "1944648000000000064",
        "payment_terms": 0,
        "payment_terms_label": "Due on Receipt",
        "credit_limit": 0,
        "billing_address":{},
        "billing_address": {
          "attention": createdOrder?.data?.billing?.first_name + createdOrder?.data?.billing?.last_name,
          "address": createdOrder?.data?.billing?.address_1,
          "street2": createdOrder?.data?.billing?.address_2,
          "city": createdOrder?.data?.billing?.city,
          "state": createdOrder?.data?.billing?.state,
          "zip": createdOrder?.data?.billing?.postcode,
          "country": createdOrder?.data?.billing?.country
        },
        "shipping_address": {},
        "contact_persons":[],
        "contact_persons": [
          {
            "salutation": "Mr",
            "first_name": createdOrder?.data?.billing?.first_name,
            "last_name": createdOrder?.data?.billing?.last_name,
            "email": createdOrder?.data?.billing?.email,
            "phone": createdOrder?.data?.billing?.phone,
            "mobile": createdOrder?.data?.billing?.mobile,
            "is_primary_contact": true
          }
        ],
        "default_templates": {},
        "language_code": "en",
        "tags": [],
        "customer_sub_type": "business",
        "documents": [],
        "msme_type": "",
        "udyam_reg_no": ""
      };
   

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `https://www.zohoapis.in/inventory/v1/contacts?organization_id=${licence.zohoOrganizationId}`,
        headers: {
          Authorization: `Bearer ${licence.accessToken}`,
          'content-type': 'application/json',
        },
        data: JSON.stringify(customerZohoPayload),
      };
      
      const zohoResponse = await axios.request(config);
      console.log("zohoResponse", zohoResponse)
      if(zohoResponse.data.code == 0 && zohoResponse.data.message == 'The contact has been added.'){
       // console.log('addCustomer Axios call response:', zohoResponse.data);
        return wordPressCustomer.findOneAndUpdate(
          { contact_id: zohoResponse.data.contact.contact_id, userId: licence?.userId },  // Filter
          { 
            $set: {
              data: {
                first_name: zohoResponse.data.contact.first_name,
                last_name: zohoResponse.data.contact.last_name,
                billing: zohoResponse.data.contact.billing,
                shipping: zohoResponse.data.contact.shipping,
                email: zohoResponse.data.contact.email
              },
              isSyncedToZoho: true,
              id: zohoResponse.data.contact.id,
              licenceNumber:licence._id,
              userId: licence?.userId,
            }
          },
          { upsert: true, returnDocument: 'after' }  // Options: upsert and return the updated document
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
}

async function CreateOrderInZoho(licence, order) {
  try {
  //  console.log("call CreateOrderInZoho", order)
    let orderItem;
    // console.log("postCreateOrder");
   // const res_token = await licenceService.findOne({ _id: new ObjectId(req.query.licenceNumber) });
  //  const orders = await wordPressService.findOrder({ licenceNumber: ObjectId(req.query.licenceNumber), isSyncedToZoho: false });
    // console.log("orders", orders.length)
    if (order) {
    //  for (const item of createdOrder) {
        // console.log("item",item.id)

        const wordPressProductItem = await wordPressProduct.findOne({ licenceNumber: licence._id, id: order.data.line_items[0].product_id }).lean(true);
        // console.log("wordPressProduct", wordPressProductItem)
        const customer = await wordPressCustomer.findOne({ licenceNumber: licence._id, "data.email": order.data.billing.email }).lean(true);
        if (customer) {
          //console.log("customer", customer.contact_id, "SO-" + item.id);
          let contact_id = customer.contact_id;
          orderItem = {
            "customer_id": contact_id,
            "salesorder_number": "SO-" + order.id,
            "date": order.data.date_created.split('T')[0],
            "shipment_date": "",
            "custom_fields": [],
            "is_inclusive_tax": false,
           // "ignore_auto_number_generation" : false,
            "line_items": [
              {
                "item_order": 1,//will changes with lineItem index 
                "item_id": wordPressProductItem?.item_id,
                "rate": order.data.line_items[0].price.toFixed(2),
                "name": order.data.line_items[0].name,
                "description":
                  "Test Item",
                "quantity": order.data.line_items[0].quantity,
                "quantity_invoiced": order.data.line_items[0].quantity,
                "quantity_packed": order.data.line_items[0].quantity,
                "quantity_shipped": order.data.line_items[0].quantity,
                "discount": "0%",
                "tax_id": "",
                "tax_name": "IN-TAX-1",
                "tax_percentage": 18, //will changes dynamically later 
                "tags": [],
                "item_custom_fields": [],
                "unit": "g"
              }],
            "notes": "",
            "terms": "",
            "discount": 0,
            "is_discount_before_tax": true,
            "discount_type": "entity_level",
            "adjustment_description": "Adjustment",
            "pricebook_id": "",
            "template_id": "1944648000000000239",
            "documents": [],
            // "shipping_address_id": "1944648000000039384", 
            // "billing_address_id": "1944648000000039382", 
            //    "zcrm_potential_id": "", 
            // "zcrm_potential_name": "",
            "payment_terms": 0,
            "payment_terms_label": "Due on Receipt",
            "is_adv_tracking_in_package": false,
            "is_tcs_amount_in_percent": true
          };
          //  console.log("orderItem", orderItem)
          const zohoHeaders = {
            endpoint: 'salesorders' + `?organization_id=${licence.zohoOrganizationId}`,
            accessToken: licence?.accessToken,
            data: JSON.stringify(orderItem), // Use orderItem instead of order
          };
          //    console.log("data", data)
          let zohoResponse = await post(zohoHeaders);
         // console.log("response API", zohoResponse.response.data.code );
         const { 
          status, 
          statusText, 
          headers, 
          config, 
          data 
        } = zohoResponse;

       //  console.log("data", data)
          if (data == 200) {
            await WordPressModel.findOneAndUpdate(
              {
                _id: order._id,
              },
              {
                $set: {
                  isSyncedToZoho: true
                },
              }
            );
          } else {
            await WordPressModel.findOneAndUpdate(
              {
                _id: order._id,
              },
              {
                $set: {
                  zohoResponse:{
                    config: config,
                    response: data
                  }
                },
              }
            );
          }
        }
      }
   // }
   // res.status(httpStatus.OK).send({ msg: 'Order  sync in progress' });

  } catch (e) {
    console.error(e);
    return e;
  }
};


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
