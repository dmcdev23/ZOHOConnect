const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { wooCommerceListLimit } = require('../config/config');
const { licenceService, wordPressService, syncHistoryService } = require('../services');
const { post, put, getDynamic, get } = require('../commonServices/axios.service');
const mongoose = require('mongoose');
const { response } = require('express');
const ZOHOController = require('./ZOHO.controller');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const ObjectId = mongoose.Types.ObjectId;
const { wordPressProduct, WordPressModel, wordPressCustomer, ItemSyncSetup } = require('../models');
const axios = require('axios');

const syncOrders = catchAsync(async (req, res) => {
  try {
    const licence = await licenceService.findOne({ _id: ObjectId(req.query.licenceNumber) });
    const WooCommerce = new WooCommerceRestApi({
      url: licence.storeUrl,
      consumerKey: licence.WPKey,
      consumerSecret: licence.WPSecret,
      version: 'wc/v3',
    });

    const IdsToExclude = await wordPressService.findOrder(
      {
        userId: req.user._id,
        _id: ObjectId(req.query.licenceNumber),
      },
      true,
      { id: 1, _id: 0 }
    );
    await fetchFromOrder(WooCommerce, IdsToExclude, req);

    res.status(httpStatus.OK).send({ msg: 'Order sync in progress' });
  } catch (e) {
    console.error(e);
    // res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(
    //   !!e?.response
    //     ? {
    //         statusText: e.response.statusText,
    //         data: e.response.data,
    //       }
    //     : e
    // );
  }
});

const syncProduct = catchAsync(async (req, res) => {
  try {
    const { licenceNumber } = req.query;
    const [licence] = await licenceService.aggregate([
      { $match: { _id: ObjectId(licenceNumber) } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
    ]);

    if (!licence) {
      return res.status(httpStatus.NOT_FOUND).send({ msg: 'Licence not found' });
    }

    const WooCommerce = new WooCommerceRestApi({
      url: licence.storeUrl,
      consumerKey: licence.WPKey,
      consumerSecret: licence.WPSecret,
      version: 'wc/v3',
    });

    await fetchFromGenericWithPagination(WooCommerce, [], req, 'products', res);
    res.status(httpStatus.OK).send({ msg: `Product sync in progress` });
  } catch (e) {
    console.error(e);
    // res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
  }
});

const getOrders = catchAsync(async (req, res) => {
  try {
    console.log('req.query.licenceNumber', req.query.licenceNumber);
    const licence = await wordPressService.findOrder(
      { licenceNumber: ObjectId(req.query.licenceNumber) },
      true,
      {},
      { page: req.query.page, limit: req.query.limit }
    );
    res.status(httpStatus.OK).send(licence);
  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(
      !!e?.response
        ? {
            statusText: e.response.statusText,
            data: e.response.data,
          }
        : e
    );
  }
});

const getProduct = catchAsync(async (req, res) => {
  try {
    let orderSyncDetail = await ItemSyncSetup.findOne({ licenseNumber: ObjectId(req.query.licenceNumber) });
    console.log('orderSyncDetail', orderSyncDetail);
    if (!orderSyncDetail) {
      orderSyncDetail = { syncParametersFirst: null };
    }
    const licence = await wordPressService.findProduct(
      { licenceNumber: ObjectId(req.query.licenceNumber) },
      true,
      {},
      { page: req.query.page, limit: req.query.limit },
      orderSyncDetail
    );
    res.status(httpStatus.OK).send(licence);
  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(
      !!e?.response
        ? {
            statusText: e.response.statusText,
            data: e.response.data,
          }
        : e
    );
  }
});

const getCustomer = catchAsync(async (req, res) => {
  try {
    const licence = await wordPressService.findCustomer(
      { licenceNumber: ObjectId(req.query.licenceNumber) },
      true,
      {},
      { page: req.query.page, limit: req.query.limit }
    );
    res.status(httpStatus.OK).send(licence);
  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(
      !!e?.response
        ? {
            statusText: e.response.statusText,
            data: e.response.data,
          }
        : e
    );
  }
});

const linkLicence = catchAsync(async (req, res) => {
  try {
    const { body } = req;
    if (body.email && body.licenceNumber && body.storeUrl) {
      const [licence] = await licenceService.aggregate([
        {
          $match: {
            _id: ObjectId(body.licenceNumber),
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: '$user',
        },
      ]);
      if (licence?.user?.email == body.email) {
        const data = await licenceService.updateOne({ _id: ObjectId(body.licenceNumber) }, { storeUrl: body.storeUrl });
        res.status(httpStatus.OK).send(data);
      }
    } else if (body.user_id && body.consumer_key && body.consumer_secret) {
      const data = await licenceService.updateOne(
        { _id: ObjectId(body.user_id) },
        {
          WPKey: body.consumer_key,
          WPSecret: body.consumer_secret,
        }
      );
      res.status(httpStatus.OK).send(data);
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ msg: 'Invalid Parameter' });
    }
  } catch (e) {
    console.error(e);
    res.status(e?.response.status || httpStatus.INTERNAL_SERVER_ERROR).send(
      !!e?.response
        ? {
            statusText: e.response.statusText,
            data: e.response.data,
          }
        : e
    );
  }
});

const syncCustomer = catchAsync(async (req, res) => {
  try {
    const licence = await licenceService.findOne({ _id: ObjectId(req.query.licenceNumber) });
    const WooCommerce = new WooCommerceRestApi({
      url: licence.storeUrl,
      consumerKey: licence.WPKey,
      consumerSecret: licence.WPSecret,
      version: 'wc/v3',
    });
    const IdsToExclude = await wordPressService.findCustomer(
      {
        userId: req.user._id,
        _id: ObjectId(req.query.licenceNumber),
      },
      true,
      { id: 1, _id: 0 }
    );
    await fetchFromGeneric(WooCommerce, IdsToExclude, req, 'customers', res);
    res.status(httpStatus.OK).send({ msg: 'Customer sync in progress' });
  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(
      !!e?.response
        ? {
            statusText: e.response.statusText,
            data: e.response.data,
          }
        : { data: e.message }
    );
  }
});

const syncCustomerToZoho = catchAsync(async (req, res) => {
  try {
    if (!req.query.organization_id) res.status(httpStatus.BAD_REQUEST).send({ msg: 'organization_id is required' });
    await syncToZohoFromGeneric(req, 'createCustomers');
    res.status(httpStatus.OK).send({ msg: 'Customer sync in progress' });
  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(
      !!e?.response
        ? {
            statusText: e.response.statusText,
            data: e.response.data,
          }
        : e
    );
  }
});

const syncProductToZoho = catchAsync(async (req, res) => {
  try {
    if (!req.query.organization_id) res.status(httpStatus.BAD_REQUEST).send({ msg: 'organization_id is required' });
    await ZOHOController.syncProductsToZoho(req, res);
    //console.log("synProductRes", synProductRes)
    res.status(httpStatus.OK).send({ msg: 'Product publish in progress' });
  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(
      !!e?.response
        ? {
            statusText: e.response.statusText,
            data: e.response.data,
          }
        : e
    );
  }
});

const syncOrderToZoho = catchAsync(async (req, res) => {
  try {
    if (!req.query.organization_id) res.status(httpStatus.BAD_REQUEST).send({ msg: 'organization_id is required' });
    //await ZOHOController.postCreateOrder(req);
    await syncToZohoFromGeneric(req, 'createOrders');
    res.status(httpStatus.OK).send({ msg: 'Order sync in progress' });
  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(
      !!e?.response
        ? {
            statusText: e.response.statusText,
            data: e.response.data,
          }
        : e
    );
  }
});

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
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ msg: 'Invalid License Number' });
    }
    //console.log("req.query", req.query)
    const WooCommerce = new WooCommerceRestApi({
      url: licence.storeUrl,
      consumerKey: licence.WPKey,
      consumerSecret: licence.WPSecret,
      version: 'wc/v3',
    });

    const order = await WooCommerce.get(`orders/${req.query.orderId}`);
    if (order.data) {
      console.log('add orders', licence._id, licence.userId, order.data);
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
            isSyncedToZoho: false,
            isReadyForSync: true,
          },
        },
        { upsert: true, new: true }
      );

      const customer = await wordPressCustomer
        .findOne({
          licenceNumber: licence._id,
          'data.email': createdOrder.data.billing.email,
        })
        .lean(true);

      //console.log("customer", customer);

      if (!customer) {
        await getCustomerFromZoho(licence, createdOrder);
      }

      // console.log("reqZohoAPI", reqZohoAPI)
      if (createdOrder) {
        //  const orderDetails = await WordPressModel.findOne({ licenceNumber: licence._id, id: { $eq: order.data.id } });
        //   if (orderDetails) {
        //  await CreateOrderInZoho(licence, createdOrder);
        for (const orderItem of createdOrder.data.line_items) {
          // console.log("order.data.line_items[0].product_id}", licence._id, orderItem.product_id)
          const filterProductParam = { syncMethod: 'ITEM' }; // enum: ['ITEM', 'SKU', 'BARCODE']
          let productFilter;

          switch (filterProductParam.syncMethod) {
            case 'ITEM':
              productFilter = { licenceNumber: licence._id, id: orderItem.product_id }; // Add id if syncMethod is 'ITEM'
              break;
            case 'SKU':
              productFilter = { licenceNumber: licence._id, sku: orderItem.sku }; // Add sku if orderItem.sku is available
              break;
            case 'BARCODE':
              // console.log('BARCODE');
              productFilter = { licenceNumber: licence._id, barcode: orderItem.barcode }; // Add barcode if orderItem.barcode is available
              break;
            default:
              // Optional: Handle default case if needed
              break;
          }

          // console.log('productFilter', productFilter);
          const wordPressProductItem = await wordPressProduct.findOne(productFilter).lean(true);
          //   console.log('wordPressProductItem', wordPressProductItem);
          if (wordPressProductItem) {
            // console.log("call end ZOHOController");
            if (wordPressProductItem.id === orderItem.product_id) {
              //  console.log("wordPressProductItem", wordPressProductItem.id,orderItem.product_id, wordPressProductItem.data.stock_quantity, orderItem.quantity)

              let updatedStockQuantity = wordPressProductItem.data.stock_quantity;

              switch (createdOrder.data.status) {
                case 'processing':
                  updatedStockQuantity -= orderItem.quantity; // Subtract when order is completed
                  break;
                case 'cancelled':
                  updatedStockQuantity += orderItem.quantity; // Add back when order is cancelled or refunded
                  break;
                case 'refunded':
                  updatedStockQuantity += orderItem.quantity; // Add back when order is cancelled or refunded
                  break;
                // You can add additional conditions for other statuses if needed.
                default:
                  // No change in stock for statuses like 'pending', 'processing', etc.
                  break;
              }

              let updatedWordPressProduct = await wordPressProduct.findByIdAndUpdate(
                { _id: wordPressProductItem._id },
                {
                  $set: {
                    // "data.stock_quantity": wordPressProductItem.data.stock_quantity - orderItem.quantity
                    'data.stock_quantity': updatedStockQuantity,
                  },
                },
                { new: true }
              );
              // console.log("updatedWordPressProduct", updatedWordPressProduct)
              // return res.status(httpStatus.OK).send({ msg: `Updated quantity ${updatedWordPressProduct.data.stock_quantity}` });
            }
          } else {
            console.error('Product not found:', createdOrder.id);
            await createdOrder.addErrorToOrder(
              createdOrder.id,
              'Product not found',
              `Product with the provided ID does not exist ${filterProductParam}.`
            );
          }
          // return res.status(httpStatus.NOT_FOUND).send({ msg: 'ProductItem not found in Order sync' });

          // }
          //return res.status(httpStatus.OK).send({ msg: 'Order sync successfully' });
        }
        return res.status(httpStatus.OK).send({ msg: 'Order sync successfully' });
        // return res.status(httpStatus.NOT_FOUND).send({ msg: 'Requested Order not found in Order sync' });
      }
      return res.status(httpStatus.NOT_FOUND).send({ msg: 'Some thing went wrong in createdOrder Order sync' });
    } else {
      res.status(httpStatus.OK).send({ msg: 'Order not found' });
    }
  } catch (e) {
    console.error(e);

    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(
      !!e?.response
        ? {
            statusText: e.response.statusText,
            data: e.response.data,
          }
        : e
    );
  }
};

async function getCustomerFromZoho(licence, createdOrder) {
  try {
    console.log('call getCustomerFromZoho');
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://www.zohoapis.in/inventory/v1/contacts?organization_id=${licence.zohoOrganizationId}&email=${createdOrder?.data?.billing?.email}`,
      headers: {
        Authorization: `Bearer ${licence.accessToken}`,
      },
    };

    const customer = await axios.request(config);
    //  console.log("zohoResponse customer", customer)
    if (customer.data.contacts.length == 0) {
      // console.log(createdOrder?.data?.billing);
      const customerZohoPayload = {
        contact_name: createdOrder?.data?.billing?.first_name + ' ' + createdOrder?.data?.billing?.last_name,
        company_name: '',
        contact_type: 'customer',
        currency_id: '1944648000000000064',
        payment_terms: 0,
        payment_terms_label: 'Due on Receipt',
        credit_limit: 0,
        billing_address: {},
        billing_address: {
          attention: createdOrder?.data?.billing?.first_name + createdOrder?.data?.billing?.last_name,
          address: createdOrder?.data?.billing?.address_1,
          street2: createdOrder?.data?.billing?.address_2,
          city: createdOrder?.data?.billing?.city,
          state: createdOrder?.data?.billing?.state,
          zip: createdOrder?.data?.billing?.postcode,
          country: createdOrder?.data?.billing?.country,
        },
        shipping_address: {},
        contact_persons: [],
        contact_persons: [
          {
            salutation: 'Mr',
            first_name: createdOrder?.data?.billing?.first_name,
            last_name: createdOrder?.data?.billing?.last_name,
            email: createdOrder?.data?.billing?.email,
            phone: createdOrder?.data?.billing?.phone,
            mobile: createdOrder?.data?.billing?.mobile,
            is_primary_contact: true,
          },
        ],
        default_templates: {},
        language_code: 'en',
        tags: [],
        customer_sub_type: 'business',
        documents: [],
        msme_type: '',
        udyam_reg_no: '',
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
      // console.log("zohoResponse", zohoResponse.data)
      if (zohoResponse.data.code == 0 && zohoResponse.data.message == 'The contact has been added.') {
        //  console.log('addCustomer Axios call response:', zohoResponse.data);
        return wordPressCustomer.findOneAndUpdate(
          { contact_id: zohoResponse.data.contact.contact_id, userId: licence?.userId }, // Filter
          {
            $set: {
              data: {
                first_name: zohoResponse.data.contact.first_name,
                last_name: zohoResponse.data.contact.last_name,
                billing: zohoResponse.data.contact.billing,
                shipping: zohoResponse.data.contact.shipping,
                email: zohoResponse.data.contact.email,
              },
              isSyncedToZoho: true,
              id: zohoResponse.data.contact.id,
              licenceNumber: licence._id,
              userId: licence?.userId,
            },
          },
          { upsert: true, returnDocument: 'after' } // Options: upsert and return the updated document
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
}

async function CreateOrderInZoho(licence, order) {
  try {
    // Ensure we have the order and line_items array
    if (!order || !order.data.line_items || order.data.line_items.length === 0) {
      throw new Error('No line items found in the order');
    }

    // Fetch Customer Info
    const customer = await wordPressCustomer
      .findOne({
        licenceNumber: licence._id,
        'data.email': order.data.billing.email,
      })
      .lean(true);

    if (!customer) {
      throw new Error('Customer not found');
    }
    //console.log("customer", customer)
    const contact_id = customer.contact_id;

    let zohoOrderStatus = '';
    // Prepare an array to hold all line items for Zoho payload
    const lineItems = await Promise.all(
      order.data.line_items.map(async (lineItem, index) => {
        const wordPressProductItem = await wordPressProduct
          .findOne({
            licenceNumber: licence._id,
            id: lineItem.product_id, // Fetching product for each line item
          })
          .lean(true);

        if (!wordPressProductItem) {
          throw new Error(`Product not found for product_id: ${lineItem.product_id}`);
        }

        switch (lineItem.status) {
          case 'processing':
            zohoOrderStatus = 'fulfilled';
            break;
          case 'completed':
            zohoOrderStatus = 'Confirmed';
            break;
          case 'cancelled':
            zohoOrderStatus = 'Void';
            break;
          case 'refunded':
            zohoOrderStatus = 'Refunded';
            break;
          case 'processing':
            zohoOrderStatus = 'Processing';
            break;
          case 'on-hold':
            zohoOrderStatus = 'On Hold';
            break;
          default:
            zohoOrderStatus = 'Draft';
            break;
        }

        // Return the formatted line item for the Zoho payload
        return {
          item_order: index + 1, // Dynamically set item order based on index
          item_id: wordPressProductItem.item_id,
          rate: lineItem.price.toFixed(2),
          name: lineItem.name,
          description: wordPressProductItem?.data?.wp_data?.description,
          quantity: lineItem.quantity,
          quantity_invoiced: lineItem.quantity,
          quantity_packed: lineItem.quantity,
          quantity_shipped: lineItem.quantity,
          discount: lineItem.discount_total,
          tax_id: order.data.tax_lines[0].id,
          tax_name: order.data.tax_lines[0].rate_code,
          tax_percentage: order.data.tax_lines[0].rate_percent,
          tags: [],
          item_custom_fields: [],
          unit: 'g', // Modify as needed
        };
      })
    );

    // Create Zoho order payload
    const orderItem = {
      customer_id: contact_id,
      salesorder_number: 'SO-' + order.id,
      status: zohoOrderStatus,
      date: order.data.date_created.split('T')[0],
      shipment_date: '',
      custom_fields: [],
      is_inclusive_tax: false,
      line_items: lineItems, // Use the mapped line items array here
      notes: '',
      terms: '',
      discount: 0,
      is_discount_before_tax: true,
      discount_type: 'entity_level',
      adjustment_description: 'Adjustment',
      pricebook_id: '',
      template_id: '1944648000000000239', // Static template id
      documents: [],
      payment_terms: 0,
      payment_terms_label: 'Due on Receipt',
      is_adv_tracking_in_package: false,
      is_tcs_amount_in_percent: true,
    };

    //  console.log("orderItem", orderItem);
    // Zoho API headers
    const zohoHeaders = {
      endpoint: 'salesorders' + `?organization_id=${licence.zohoOrganizationId}`,
      accessToken: licence?.accessToken,
      data: JSON.stringify(orderItem), // Use the order payload
    };

    // Post to Zoho
    const zohoResponse = await post(zohoHeaders);

    const { status, statusText, headers, config, data } = zohoResponse.response;

    console.log('zohoResponse', data);
    // Handle Zoho API Response
    if (data == 200) {
      await WordPressModel.findOneAndUpdate(
        { _id: order._id },
        {
          $set: {
            isSyncedToZoho: true,
            zohoResponse: {
              config: config,
              response: data,
            },
          },
        }
      );
    } else {
      await WordPressModel.findOneAndUpdate(
        { _id: order._id },
        {
          $set: {
            isSyncedToZoho: false,
            zohoResponse: {
              config: config,
              response: data,
            },
          },
        }
      );
    }
  } catch (e) {
    console.error(e);
    //throw e; // Handle error appropriately
  }
}

const syncOrderToZohoByOrderId = catchAsync(async (req, res) => {
  try {
    console.log('req.query', req.query);
    if (!req.query.licenceNumber || !req.query.orderId) {
      return res.status(httpStatus.OK).send({ msg: 'Invalid param pass' });
    }

    const licence = await licenceService.findOne({ _id: ObjectId(req.query.licenceNumber) });
    if (licence) {
      req.user = req.user || {};
      req.user['_id'] = licence?.userId;
      req.query.licenceNumber = licence._id;
      req.query.organization_id = licence.zohoOrganizationId;
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ msg: 'Invalid License Number' });
    }

    const order = await WordPressModel.findOne({
      licenceNumber: licence._id,
      id: { $eq: req.query.orderId },
      isSyncedToZoho: false,
    });
    if (!order) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ msg: 'Invalid Order Id' });
    }

    await CreateOrderInZoho(licence, order);

    res.status(httpStatus.OK).send({ msg: 'Order sync in progress' });
  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(
      !!e?.response
        ? {
            statusText: e.response.statusText,
            data: e.response.data,
          }
        : e
    );
  }
});

const syncProductToZohoByProductId = catchAsync(async (req, res) => {
  try {
    console.log('req.query', req.query);
    if (!req.query.licenceNumber || !req.query.productId) {
      return res.status(httpStatus.OK).send({ msg: 'Invalid param pass' });
    }

    const licence = await licenceService.findOne({ _id: ObjectId(req.query.licenceNumber) });
    if (licence) {
      req.user = req.user || {};
      req.user['_id'] = licence?.userId;
      req.query.licenceNumber = licence._id;
      req.query.organization_id = licence.zohoOrganizationId;
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ msg: 'Invalid License Number' });
    }

    const product = await wordPressProduct.findOne({
      licenceNumber: licence._id,
      id: { $eq: req.query.productId },
      isSyncedToZoho: false,
      isActive: true,
    });
    if (!product) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ msg: 'Invalid Product Id OR Blocked Product For Zoho' });
    }
    //  console.log("product", product)
    if (product) {
      const productZohoPayload = {
        name: product?.data?.name,
        rate: parseFloat(product?.data?.price),
        account_id: '1944648000000000486',
        tax_id: '',
        tags: [],
        custom_fields: [],
        purchase_rate: parseFloat(product?.data?.price),
        purchase_account_id: '1944648000000000567',
        item_type: 'inventory',
        product_type: 'goods',
        inventory_account_id: '1944648000000000626',
        initial_stock: product?.data?.stock_quantity,
        initial_stock_rate: product?.data?.stock_quantity,
        is_returnable: true,
        package_details: {
          weight_unit: 'kg',
          dimension_unit: 'cm',
        },
        unit: 'qty',
        sku: product?.data?.sku,
      };
      const zohoHeaders = {
        endpoint: 'items' + `?organization_id=${licence.zohoOrganizationId}`,
        accessToken: licence?.accessToken,
        data: JSON.stringify(productZohoPayload),
      };

      // Post to Zoho
      const zohoResponse = await post(zohoHeaders);
      //  console.log("zohoResponse", zohoResponse)
      let status, statusText, headers, config, data;

      if (zohoResponse?.response) {
        // Failed response
        ({ status, statusText, headers, config, data } = zohoResponse.response);
      } else {
        // Success response
        ({ status, statusText, headers, config, data } = zohoResponse);
      }
      //  console.log(status, statusText, headers, config, data);
      // Handle Zoho API Response
      if (data?.code == 0) {
        await wordPressProduct.findOneAndUpdate(
          { _id: product._id },
          {
            $set: {
              isSyncedToZoho: true,
              isActive: true,
              zohoResponse: {
                config: config,
                response: data,
              },
            },
          }
        );
      } else {
        await wordPressProduct.findOneAndUpdate(
          { _id: product._id },
          {
            $set: {
              isSyncedToZoho: false,
              isActive: false,
              zohoResponse: {
                config: config,
                response: data,
              },
            },
          }
        );
      }
    }

    res.status(httpStatus.OK).send({ msg: 'Product publish in progress' });
  } catch (e) {
    console.error(e);
    res.status(e?.response?.status || httpStatus.INTERNAL_SERVER_ERROR).send(
      !!e?.response
        ? {
            statusText: e.response.statusText,
            data: e.response.data,
          }
        : e
    );
  }
});

const fetchFromOrder = async (WooCommerce, IdsToExclude, req) => {
  const responseArray = [];
  const limit = 100;
  for (let i = 1; ; i++) {
    const orders = await WooCommerce.get('orders', {
      per_page: limit,
      page: i,
      exclude: IdsToExclude.map((ele) => ele.id),
    });
    console.log('orders.data', orders.data);
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
};

const updateSyncHistory = async (licenceNumber, status, syncedCount, totalCount = undefined) => {
  console.log('call updateSyncHistory');
  const data = await syncHistoryService.createOrUpdateSyncHistory(ObjectId(licenceNumber), {
    status,
    syncedCount,
    ...(totalCount && { totalCount }),
  });
};

const fetchFromGenericWithPagination = async (WooCommerce, IdsToExclude, req, getWhat = 'customers', res) => {
  try {
    const serviceMap = {
      customers: wordPressService.createCustomer,
      products: wordPressService.createProduct,
    };
    const responseArray = [];
    const itemsPerPage = 20;
    let sendResponse = true;
    //console.log("IdsToExclude", IdsToExclude)
    // const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    let productCount = 10;
    for (let i = 1; i <= productCount; i++) {
      // console.log("product loop i", i, productCount)
      const offset = (i - 1) * itemsPerPage + 1;
      //   console.log("offset", offset)
      const products = await WooCommerce.get(getWhat, {
        per_page: itemsPerPage,
        page: i,
        offset: offset,
        // exclude: IdsToExclude.map((ele) => ele.id),
      });
      //  console.log("sync products woocom res", products?.status, products?.statusText, products.data.length);
      productCount = products.headers['x-wp-total'];
      if (products?.status === httpStatus.OK) {
        productCount = products.headers['x-wp-total'];
        //   console.log("productCount", productCount)
        responseArray.push(...products.data);
        await updateSyncHistory(req.query.licenceNumber, 'inProgress', responseArray.length, products.headers['x-wp-total']);
        if (sendResponse) {
          //res.status(httpStatus.OK).send({ msg: `${getWhat.charAt(0).toUpperCase() + getWhat.slice(1)} sync in progress` });
          sendResponse = false;
        }
      } else {
        responseArray.push(...products.data);
      }

      if (i == itemsPerPage) {
        await updateSyncHistory(req.query.licenceNumber, 'completed', responseArray.length);
        break;
      }
      // if (i < itemsPerPage) {
      //   console.log(`Sleeping for 1 seconds before fetching the next page...`);
      //   await sleep(1000); // 10-second delay
      // }
    }
    console.log('responseArray length', responseArray.length);
    await serviceMap[getWhat](req, responseArray);
  } catch (e) {
    await updateSyncHistory(req.query.licenceNumber, 'failed', 0);
    console.log('error fetchFromGeneric', e);
    // throw e;
  }
};

const fetchFromGeneric = async (WooCommerce, IdsToExclude, req, getWhat = 'customers') => {
  try {
    {
      const serviceMap = {
        customers: wordPressService.createCustomer,
        products: wordPressService.createProduct,
      };
      const responseArray = [];
      const limit = 100;
      for (let i = 1; ; i++) {
        console.log(i, limit);
        const orders = await WooCommerce.get(getWhat, {
          per_page: limit,
          page: i,
          exclude: IdsToExclude.map((ele) => ele.id),
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
    throw e;
  }
};

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
    };
    const countMap = {
      customers: wordPressService.getCustomerCount,
      createProducts: wordPressService.getProductCount,
      createCustomers: wordPressService.getCustomerCount,
      createOrders: wordPressService.getOrderCount,
    };
    const ZohoserviceMap = {
      customers: wordPressService.findCustomer,
      createCustomers: ZOHOController.postCreateContact,
      createProducts: ZOHOController.postCreateItem,
      createOrders: ZOHOController.postCreateOrder,
    };
    //console.log("befor count call", req.query.licenceNumber);
    const count = await countMap[getWhat]({
      licenceNumber: ObjectId(req.query.licenceNumber),
      isSyncedToZoho: { $in: [false, null] },
    });
    //console.log("count", count)
    const limit = 500;
    let responseArray = [];
    let errorArray = [];
    for (let i = 1; i < count / limit + 1; i++) {
      let syncData = await serviceMap[getWhat](
        {
          licenceNumber: ObjectId(req.query.licenceNumber),
          isSyncedToZoho: { $in: [false, null] },
          isActive: { $in: [false, null] },
        },
        true,
        {},
        { skip: (i - 1) * limit, limit: limit }
      );
      //  console.log("syncData", syncData)

      let transformData = await ZOHOController.transformData(req, syncData, getWhat);
      // console.log("transformData", transformData);
      for (let j = 0; j < transformData.length; ++j) {
        req.body = transformData[j];
        const response = await ZohoserviceMap[getWhat](req);
        //  console.log("syncData", syncItem, response.response)
        if (response && response.status >= 200 && response.status < 300) {
          let UpdateObject = {
            updateOne: {
              filter: { _id: syncData[j]._id },
              update: {
                $set: {
                  isSyncedToZoho: true,
                },
              },
            },
          };
          switch (getWhat) {
            case 'createCustomers':
              UpdateObject.updateOne.update.$set.contact_id = response?.data?.contact?.contact_id;
              UpdateObject.updateOne.update.$set.email = response?.data?.contact?.email;
              break;
            case 'createProducts':
              //   UpdateObject.updateOne.update.$set.item_id = response?.data?.item.item_id;
              UpdateObject.updateOne.update.$set = {
                item_id: response?.data?.item?.item_id,
                zohoResponse: {
                  config: response?.config,
                  response: response?.data,
                },
              };

              break;
            case 'createOrders':
              UpdateObject.updateOne.update.$set.salesorder_id = response?.data?.salesorder?.salesorder_id;
          }
          responseArray.push(UpdateObject);
        } else {
          //errorArray.push(response);
          //  console.log("getWhat",getWhat)
          if (getWhat == 'createProducts') {
            const productId = syncData._id;
            const { status, statusText, headers, config, data } = response.response;
            // console.log("data._id", syncItem, data)
            const updateItem = await wordPressProduct.findOneAndUpdate(
              {
                _id: syncData[j]._id,
              },
              {
                $set: {
                  zohoResponse: {
                    config: config,
                    response: data,
                  },
                },
              }
            );
            console.log('updateItem', updateItem);
          }
        }
        console.log(responseArray);
      }
    }
    if (responseArray) {
      await serviceMap[`bulkWrite${getWhat}`](responseArray);
    }
  } catch (e) {
    console.log(e);
    throw e;
  }
};

const getSyncHistory = async (req, res) => {
  const syncHistory = await syncHistoryService.getSyncHistory(req.query.licenceNumber);
  res.status(httpStatus.OK).send({ syncHistory });
};

const blockProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
    const product = await wordPressProduct.updateMany({ _id: { $in: productIds } }, { $set: { isActive: false } });
    if (product) {
      res.status(httpStatus.OK).send({ msg: 'Products blocked successfully' });
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ msg: 'Error blocking products' });
    }
  } catch (e) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ msg: 'Error blocking products', error: e.message });
    throw e;
  }
};

const unblockProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
    const product = await wordPressProduct.updateMany({ _id: { $in: productIds } }, { $set: { isActive: true } });
    if (product) {
      res.status(httpStatus.OK).send({ msg: 'Products unblocked successfully' });
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ msg: 'Error unblocking products' });
    }
  } catch (e) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ msg: 'Error unblocking products', error: e.message });
    throw e;
  }
};

const syncProductById = catchAsync(async (req, res) => {
  try {
    if (!req.query.licenceNumber || !req.body) {
      return res.status(httpStatus.OK).send({ msg: 'Invalid param pass' });
    }
    const { productIds } = req.body;
    const { licenceNumber } = req.query;
    const [licence] = await licenceService.aggregate([
      { $match: { _id: ObjectId(licenceNumber) } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
    ]);

    if (!licence) {
      return res.status(httpStatus.NOT_FOUND).send({ msg: 'Licence not found' });
    }

    req.user._id = licence.user._id;

    const WooCommerce = new WooCommerceRestApi({
      url: licence.storeUrl,
      consumerKey: licence.WPKey,
      consumerSecret: licence.WPSecret,
      version: 'wc/v3',
    });

    //  productIds.forEach(productId => {
    // const product = await WooCommerce.get(`products/${productId}`);
    // if(product){
    //   //console.log("product", JSON.stringify(product.data))

    //   if (product.status === httpStatus.OK) {
    //     await wordPressService.createProduct(req, product.data);
    //   }
    // }
    // });

    for (const productId of productIds) {
      const product = await WooCommerce.get(`products/${productId}`);

      if (product && product.status === httpStatus.OK) {
        //   console.log("productId found", product.data)
        let productInserts = [];

        const sanitizedData = sanitizeKeys(product.data);

        // Insert the parent product
        productInserts.push({
          insertOne: {
            document: {
              data: {
                name: sanitizedData.name,
                price: Number(sanitizedData.price),
                stock_quantity: sanitizedData.stock_quantity,
                sku: sanitizedData.sku,
                categories: sanitizedData.categories,
                images: sanitizedData.images,
                wp_data: sanitizedData, // Assuming it contains nested data
              },
              userId: req.user._id,
              id: sanitizedData.id,
              licenceNumber: ObjectId(req.query.licenceNumber),
              isSyncedToZoho: false,
              parentId: '', // Parent product, no parentId
              isActive: true,
            },
          },
        });

        // Insert each product variation, if any
        if (sanitizedData.product_variations && sanitizedData.product_variations.length > 0) {
          sanitizedData.product_variations.forEach((variation) => {
            productInserts.push({
              insertOne: {
                document: {
                  data: {
                    name: variation?.name || `${sanitizedData.name} - Variation`,
                    price: Number(variation?.sale_price),
                    stock_quantity: variation?.stock,
                    sku: variation?.sku,
                    categories: variation?.categories || sanitizedData.categories,
                    images: variation?.images || sanitizedData.images,
                    wp_data: variation, // Assuming each variation contains nested data
                  },
                  userId: req.user._id,
                  id: variation?.id,
                  licenceNumber: ObjectId(req.query.licenceNumber),
                  isSyncedToZoho: false,
                  parentId: sanitizedData.id, // Link to parent product
                  isActive: true,
                },
              },
            });
          });
        }
        // Clear previous products
        await wordPressProduct.deleteMany({
          userId: req.user._id,
          licenceNumber: ObjectId(req.query.licenceNumber),
          $or: [{ id: productId }, { parentId: productId }],
        });

        // Bulk insert for the current chunk
        try {
          if (productInserts.length > 0) {
            // Ensure productInserts is not empty
            const wordPressProductBulkInsert = await wordPressProduct.bulkWrite(productInserts);
            // console.log('Bulk insert result:', wordPressProductBulkInsert);
          }
        } catch (error) {
          console.error('Bulk insert error:', error);
          if (error.writeErrors) {
            error.writeErrors.forEach((writeError) => {
              console.error('Failed operation:', writeError.err);
            });
          }
        }
      }
    }

    res.status(httpStatus.OK).send({ msg: `Product sync in progress` });
  } catch (e) {
    console.error(e);
    // res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
  }
});

const sanitizeKeys = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeKeys);
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const sanitizedKey = key.replace(/\./g, '_'); // Replace periods with underscores
      acc[sanitizedKey] = sanitizeKeys(value);
      return acc;
    }, {});
  }
  return obj;
};

const syncOrderFromZoho = async (req, res) => {
  console.log('call syncOrderFromZoho');
  // Check if licenceNumber exists and is not empty/undefined
  if (!req.params.licenceNumber?.trim()) {
    return res.status(httpStatus.BAD_REQUEST).send({ msg: 'licenceNumber is required in query parameters' });
  }

  // Check if body exists and is not empty
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(httpStatus.BAD_REQUEST).send({ msg: 'Request body is required' });
  }
  // console.log("req.params.licenceNumber", req.params.licenceNumber)
  const licence = await licenceService.findOne({ _id: ObjectId(req.params.licenceNumber) });
  // console.log("licence", licence)
  if (!licence) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ msg: 'Invalid License Number' });
  }

  const { salesorder } = req.body;

  if (!salesorder || !salesorder.salesorder_number) {
    return res.status(httpStatus.BAD_REQUEST).send({ msg: 'Missing salesorder_number in the request body' });
  }

  //console.log("req.body salesorder_number:", salesorder.salesorder_number);

  try {
    const orderData = {
      data: req.body,
      userId: licence.userId,
      id: salesorder.salesorder_number,
      licenceNumber: licence._id,
      isSyncedToZoho: false,
      isReadyForSync: true,
    };

    const order = await new WordPressModel(orderData).save();

    //console.log("Order created successfully:", order);

    return res.status(httpStatus.OK).send({ msg: 'Order created successfully' });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ msg: 'Error creating order', error: error.message });
  }
};
const syncProductFromZoho = async (req, res) => {
  console.log('call syncProductFromZoho');

  // Check if licenceNumber exists and is not empty/undefined
  if (!req.params.licenceNumber?.trim()) {
    return res.status(httpStatus.BAD_REQUEST).send({ msg: 'licenceNumber is required in query parameters' });
  }

  // Check if body exists and is not empty
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(httpStatus.BAD_REQUEST).send({ msg: 'Request body is required' });
  }

  const licence = await licenceService.findOne({ _id: ObjectId(req.params.licenceNumber) });

  if (!licence) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ msg: 'Invalid License Number' });
  }

  const { item } = req.body;

  if (!item || !item.item_id || !item.name || !item.sku) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .send({ msg: 'Missing required item details (item_id, name, sku) in the request body' });
  }

  try {
    // Check if product exists by item_id
    const existingProduct = await wordPressProduct.findOne({ item_id: item.item_id });
    console.log(existingProduct);
    const productData = {
      userId: licence.userId,
      id: item.item_id,
      data: req.body,
      licenceNumber: licence._id,
      isSyncedToZoho: false,
      item_id: item.item_id,
      zohoResponse: item,
    };

    let product;

    if (existingProduct) {
      // Update the existing product
      product = await wordPressProduct.findByIdAndUpdate(existingProduct._id, productData, { new: true });
      console.log('Product updated successfully:', product);
    } else {
      // Create a new product
      product = await new wordPressProduct(productData).save();
      console.log('Product created successfully:', product);
    }
    return res.status(httpStatus.OK).send(existingProduct);
    // .send({ msg: existingProduct ? 'Product updated successfully' : 'Product created successfully' });
  } catch (error) {
    console.error('Error creating or updating product:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send({ msg: 'Error creating or updating product', error: error.message });
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
  fetchOrderByOrderId,
  syncOrderToZohoByOrderId,
  syncProductToZohoByProductId,
  getSyncHistory,
  blockProducts,
  unblockProducts,
  syncProductById,
  syncOrderFromZoho,
  syncProductFromZoho,
};
