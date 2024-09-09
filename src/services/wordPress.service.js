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

const findOrderAggregate = async (filter, lean = true, project = {}, options = { page: 1, limit: 10 }) => {
  const data = await WordPressModel.aggregate([
    {
      $match: filter,
    },
    {
      $lookup: {
        from: 'wordpresscustomers',
        localField: 'data.billing.email',
        foreignField: 'data.email',
        as: 'customer',
      },
    },
    {
      $unwind: '$customer',
    },
    {
      $unwind: '$data.line_items',
    },
    {
      $lookup: {
        from: 'wordpressproducts',
        localField: 'data.line_items.sku',
        foreignField: 'data.sku',
        as: 'product',
      },
    },
    {
      $unwind: '$product',
    },
    {
      $match: {
        $expr: {
          $eq: ['$data.line_items.product_id', '$product.id'],
        },
      },
    },
    {
      $project: {
        customer_id: '$customer.contact_id',
        date: '$data.date_created',
        shipment_date: '$data.date_completed_gmt',
        line_items: {
          item_id: '$product.item_id',
          name: '$data.line_items.name',
          rate: '$data.line_items.subtotal',
          quantity: '$data.line_items.quantity',
          unit: 'qty',
          tax_percentage: {
            $multiply: [
              { $divide: [{ $toDouble: '$data.line_items.total_tax' }, { $toDouble: '$data.line_items.total' }] },
              100,
            ],
          },
          item_total: '$data.line_items.total',
        },
        notes: '$data.customer_note',
        discount: { $multiply: [{ $divide: [{ $toDouble: '$data.discount_total' }, { $toDouble: '$data.total' }] }, 100] },
        is_discount_before_tax: true,
        discount_type: 'entity_level',
        exchange_rate: 1,
      },
    },
    {
      $match: {
        customer_id: {
          $exists: true,
        },
        'line_items.item_id': {
          $exists: true,
        },
      },
    },
    {
      $group: {
        _id: '$_id',
        customer_id: { $first: '$customer_id' },
        date: { $first: '$date' },
        shipment_date: { $first: '$shipment_date' },
        notes: { $first: '$notes' },
        discount: { $first: '$discount' },
        is_discount_before_tax: { $first: '$is_discount_before_tax' },
        discount_type: { $first: '$discount_type' },
        exchange_rate: { $first: '$exchange_rate' },
        line_items: { $push: '$line_items' },
      },
    },
  ]);
  return data;
};

const findCustomer = async (filter, lean = true, project = {}, options = {}) => {
  const data = await wordPressCustomer.find(filter, project, options).lean(lean);
  return data;
};

const findProduct = async (filter, lean = true, project = {}, options = {}) => {
  const data = await wordPressProduct.find(filter, project, options).populate('userId').lean(lean);
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
  data = data.map((ele) => {
    return {
      updateOne: {
        filter: {
          userId: ObjectId(req.user._id),
          id: ele.id,
        },
        update: {
          $set: {
            data: ele,
            userId: req.user._id,
            id: ele.id,
            licenceNumber: ObjectId(req.query.licenceNumber),
            isSyncedToZoho: false,
          },
        },
        upsert: true,
      },
    };
  });
  return await WordPressModel.bulkWrite(data);
};

const createCustomer = async (req, data) => {
  data = data.map((ele) => ({
    updateOne: {
      filter: {
        userId: ObjectId(req.user._id),
        id: ele.id,
      },
      update: {
        $set: {
          data: {
            first_name: ele.first_name,
            last_name: ele.last_name,
            billing: ele.billing,
            shipping: ele.shipping,
            email: ele.email,
          },
          userId: req.user._id,
          id: ele.id,
          licenceNumber: ObjectId(req.query.licenceNumber),
        },
      },
      upsert: true,
    },
  }));
  await wordPressCustomer.bulkWrite(data);
};

const createProduct = async (req, data) => {
  const productData = data.map((ele) => ({
    updateOne: {
      filter: {
        userId: req.user._id,
        id: ele.id,
      },
      update: {
        $set: {
          data: {
            name: ele.name,
            price: Number(ele.price),
            stock_quantity: ele.stock_quantity,
            sku: ele.sku,
            categories: ele.categories,
            images: ele.images,
            wp_data: ele,
          },
          userId: req.user._id,
          id: ele.id,
          licenceNumber: ObjectId(req.query.licenceNumber),
        },
      },
      upsert: true,
    },
  }));

  await wordPressProduct.bulkWrite(productData);
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
  const [data] = await WordPressModel.aggregate([
    {
      $match: filter,
    },
    {
      $lookup: {
        from: 'wordpresscustomers',
        localField: 'data.billing.email',
        foreignField: 'data.email',
        as: 'customer',
      },
    },
    {
      $unwind: '$customer',
    },
    {
      $unwind: '$data.line_items',
    },
    {
      $lookup: {
        from: 'wordpressproducts',
        localField: 'data.line_items.sku',
        foreignField: 'data.sku',
        as: 'product',
      },
    },
    {
      $unwind: '$product',
    },
    {
      $match: {
        $expr: {
          $eq: ['$data.line_items.product_id', '$product.id'],
        },
      },
    },
    {
      $project: {
        customer_id: '$customer.contact_id',
        date: '$data.date_created',
        shipment_date: '$data.date_completed_gmt',
        line_items: {
          item_id: '$product.item_id',
          name: '$data.line_items.name',
          rate: '$data.line_items.subtotal',
          quantity: '$data.line_items.quantity',
          unit: 'qty',
          tax_percentage: {
            $multiply: [
              { $divide: [{ $toDouble: '$data.line_items.total_tax' }, { $toDouble: '$data.line_items.total' }] },
              100,
            ],
          },
          item_total: '$data.line_items.total',
        },
        notes: '$data.customer_note',
        discount: { $multiply: [{ $divide: [{ $toDouble: '$data.discount_total' }, { $toDouble: '$data.total' }] }, 100] },
        is_discount_before_tax: true,
        discount_type: 'entity_level',
        exchange_rate: 1,
      },
    },
    {
      $match: {
        customer_id: {
          $exists: true,
        },
        'line_items.item_id': {
          $exists: true,
        },
      },
    },
    {
      $group: {
        _id: '$_id',
        customer_id: { $first: '$customer_id' },
        date: { $first: '$date' },
        shipment_date: { $first: '$shipment_date' },
        notes: { $first: '$notes' },
        discount: { $first: '$discount' },
        is_discount_before_tax: { $first: '$is_discount_before_tax' },
        discount_type: { $first: '$discount_type' },
        exchange_rate: { $first: '$exchange_rate' },
        line_items: { $push: '$line_items' },
      },
    },
    {
      $count: 'count',
    },
  ]);
  return data.count;
};

const getOrderCount = async (filter) => {
  const data = await WordPressModel.count(filter);
  return data;
};

const bulkDeleteByLicenseNumber = async (licenceNumber) => {
  if (!ObjectId.isValid(licenceNumber)) {
    throw new Error('Invalid ObjectId');
  }

  const result = await wordPressProduct.deleteMany({
    licenceNumber: ObjectId(licenceNumber),
  });
  return result;
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
  bulkWriteOrders,
  findOrderAggregate,
  getOrderCount,
  bulkDeleteByLicenseNumber,
};
