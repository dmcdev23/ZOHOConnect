const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { WordPressModel, wordPressCustomer, wordPressProduct, ItemSyncSetup } = require('../models');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const { ErrorTypes } = require('./constant');

const { ObjectId } = mongoose.Types;

const findOrder = async (filter, lean = true, project = {}, options = { page: 1, limit: 10 }) => {
  console.log('findOrder filter', filter);
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

const findProduct = async (filter, lean = true, project = {}, options = {}, orderSyncDetail) => {
  const { syncParametersFirst } = orderSyncDetail;

  const matchConditions =
    syncParametersFirst === 'id'
      ? [{ [`${syncParametersFirst}`]: { $exists: true, $ne: '' } }]
      : [{ [`data.${syncParametersFirst}`]: { $exists: true, $ne: '' } }];

  logger.debug('Primary match conditions:', matchConditions, filter);

  const primaryPipeline = [
    // { $match: { $and: matchConditions } },
    { $match: filter },
    { $match: { isActive: true } },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        metadata: [{ $count: 'totalRecords' }],
        data: [{ $skip: options.page * options.limit }, { $limit: options.limit || 5 }],
      },
    },
    {
      $project: {
        data: 1,
        total: { $ifNull: [{ $arrayElemAt: ['$metadata.totalRecords', 0] }, 0] },
      },
    },
  ];

  logger.debug('Primary pipeline:', JSON.stringify(primaryPipeline, null, 2));

  const [primaryResult] = await wordPressProduct.aggregate(primaryPipeline).exec();
  logger.debug('Primary result:', primaryResult);

  return lean ? primaryResult : primaryResult.data.map((doc) => doc.toObject());
};

const findProductForSyncItemZoho = async (filter, lean = true, project = {}, options = {}) => {
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
          isSyncedToZoho: false,
        },
      },
      upsert: true,
    },
  }));
  await wordPressCustomer.bulkWrite(data);
};

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

const createProduct = async (req, data) => {
  const chunkSize = 500; // Adjust this size as needed
  console.log('call createProduct', req.user._id, req.query.licenceNumber);

  // Clear previous products
  await wordPressProduct.deleteMany({
    userId: req.user._id,
    licenceNumber: ObjectId(req.query.licenceNumber),
  });

  for (let i = 0; i < data.length; i += chunkSize) {
    // Ensure productInserts is correctly initialized as an array
    let productInserts = [];

    const chunk = data.slice(i, i + chunkSize).flatMap((ele) => {
      // Sanitize the ele data before inserting
      const sanitizedData = sanitizeKeys(ele);

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
              wp_data: sanitizedData, // Assuming ele contains nested data
            },
            userId: req.user._id,
            id: sanitizedData.id,
            licenceNumber: ObjectId(req.query.licenceNumber),
            isSyncedToZoho: false,
            parentId: '',
            isActive: true,
          },
        },
      });

      // Insert each product variation
      if (sanitizedData.product_variations.length > 0) {
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

      return productInserts; // Return both parent and variations
    });

    // Bulk insert for the current chunk
    try {
      if (productInserts.length > 0) {
        // Ensure productInserts is not empty
        const wordPressProductBulkInsert = await wordPressProduct.bulkWrite(productInserts);
        console.log('Bulk insert result:', wordPressProductBulkInsert);
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

const transformItemForSyncProductInZoho = async (products) => {
  try {
    const transformMap = (element) => {
      return {
        name: element?.data?.name,
        rate: parseFloat(element?.data?.price),
        account_id: '1944648000000000486',
        tax_id: '',
        tags: [],
        custom_fields: [],
        purchase_rate: parseFloat(element?.data?.price),
        purchase_account_id: '1944648000000000567',
        item_type: 'inventory',
        product_type: 'goods',
        inventory_account_id: '1944648000000000626',
        initial_stock: element?.data?.stock_quantity,
        initial_stock_rate: element?.data?.stock_quantity,
        is_returnable: true,
        package_details: {
          weight_unit: 'kg',
          dimension_unit: 'cm',
        },
        unit: 'qty',
        sku: element?.data?.sku,
      };
    };

    return products.map((element) => transformMap(element));
  } catch (err) {
    console.log('err transformItemForSyncProductInZoho', err);
  }
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
  findProductForSyncItemZoho,
  transformItemForSyncProductInZoho,
};
