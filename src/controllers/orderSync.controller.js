const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const { validationResult } = require('express-validator');
const { OrderSyncService } = require('../services');
const httpStatus = require('http-status');
const CronJobScheduler = require('../utils/scheduler')
const { wordPressProduct, Licence } = require('../models');
const { post, put, getDynamic, get } = require('../commonServices/axios.service');
const axios = require('axios');
const { refreshToken } = require('../middlewares/licenceValidator')

// Get all order sync configuration 
exports.getOrderSyncs = async (req, res) => {
  try {
    const OrderSyncs = await OrderSyncService.OrderSyncs(req, res);
    res.status(httpStatus.OK).send(OrderSyncs);
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(err);
  }
};

// Get a single order sync configuration by ID
exports.getOrderSyncById = async (req, res) => {
  try {
    const orderSync = await OrderSyncService.getOrderSyncById(req, res);
    if (!orderSync) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ error: 'OrderSync not found' });
    }
    res.status(httpStatus.OK).send(orderSync);
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(err);
  }
}

// Create new order sync configuration
exports.createOrderSync = async (req, res) => {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(httpStatus.BAD_REQUEST).send({ error: errors });
  // }
  try {
    const savedOrderSync = await OrderSyncService.createOrderSync(req.body);
    res.status(httpStatus.OK).send(savedOrderSync);
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(err);
  }
};

// Update existing order sync configuration
exports.updateOrderSync = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: errors });
  }

  try {
    const updatedOrderSync = await OrderSyncService.updateOrderSync(req.params.id, req.body);
    if (!updatedOrderSync) {
      // return res.status(404).json({ error: 'OrderSync not found' });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ error: 'OrderSync not found' });
    }
    res.status(httpStatus.OK).send(updatedOrderSync);
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(err);
  }
};

// Delete order sync configuration
exports.deleteOrderSync = async (req, res) => {
  try {
    const deletedOrderSync = await OrderSyncService.deleteOrderSync(req.params.id);
    if (!deletedOrderSync) {
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'OrderSync not found' });
    }
    res.status(httpStatus.OK).send(deletedOrderSync);
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(err);
  }
};

exports.createCronJobForSyncOrder = async (req, res) => {
  try {
    //CronJobScheduler.CreateCronJob('*/5 * * * *')
    CronJobScheduler.createCronJobForSyncOrder(req, res);
    console.log("createCronJobForSyncOrder done")
    res.status(httpStatus.OK).send({ msg: 'Order  sync in progress' });
    // res.status(httpStatus.OK).send("Job scheduled successfully!!");
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(err);
  }
}


exports.createCronJobForSyncItemInventory = async (req, res) => {
  try {
    console.log("call createCronJobForSyncItemInventory", req.query.licenceNumber)

    // const startOfDay = new Date();
    // startOfDay.setHours(0, 0, 0, 0);

    // const endOfDay = new Date();
    // endOfDay.setHours(23, 59, 59, 999);

    // const startOfDayUTC = new Date(startOfDay.toISOString());
    // const endOfDayUTC = new Date(endOfDay.toISOString());
    // console.log("startOfDayUTC, endOfDayUTC", startOfDayUTC, endOfDayUTC)
    //await saveCurrentIterationForSyncItem("", null, false, false, true, "call  createCronJobForSyncItemInventory", { startOfDayUTC, endOfDayUTC });

    const licenses = await Licence.find({ _id: ObjectId(req.query.licenceNumber)
      // expireAt: {
      //   $gte: endOfDayUTC
      // //  $lt: endOfDayUTC
      // }
    });

    console.log("licenses", licenses.length);
    /// await saveCurrentIterationForSyncItem("", null, false, false, true, "fetch licenses", licenses);
    if (licenses) {
      for (const license of licenses) {
        if (license.zohoOrganizationId) {
         // console.log("license", license)
          const newRefreshToken = await refreshToken(license);
          //  const orderSyncZoho = await postOrderInZoho(newRefreshToken._id, newRefreshToken.zohoOrganizationId);
          //console.log("newRefreshToken", newRefreshToken)
          if (newRefreshToken) {
          //  console.log("newRefreshToken", newRefreshToken)
            let config = {
              method: 'get',
              maxBodyLength: Infinity,
              url: `https://www.zohoapis.in/inventory/v1/items?organization_id=${license.zohoOrganizationId}`,
              headers: {
                'Authorization': `Bearer ${newRefreshToken.accessToken}`
              }
            };
            // console.log("config", config);
            const zohoResponse = await axios.request(config);
            //  await saveCurrentIterationForSyncItem(license._id, null, false, false, true, "fetch item Zoho", zohoResponse.data.message);
           // console.log("zohoResponse", zohoResponse.data.message);
            if (zohoResponse.data.items.length) {
              for (const item of zohoResponse.data.items) {
               // console.log("item", item)
                const wordPressProductItem = await wordPressProduct.findOne({ item_id: item.item_id }).lean(true);
                if (wordPressProductItem) {
                  //  await saveCurrentIterationForSyncItem(license._id, null, false, false, true, "fetch item", wordPressProductItem.data);
                   console.log(item.stock_on_hand, wordPressProductItem.data.stock_quantity)
                  if (item.stock_on_hand != wordPressProductItem.data.stock_quantity) {
                    console.log(wordPressProductItem._id, item.stock_on_hand, wordPressProductItem.data.stock_quantity)
                    await wordPressProduct.findOneAndUpdate(
                      {
                        _id: wordPressProductItem._id,
                      },
                      {
                        $set: {
                          "data.stock_quantity": item.stock_on_hand
                        },
                      }
                    );
                  }
                }

              }
            }
          }
        }
      }
    }

    console.log("createCronJobForSyncItemInventory done")
    res.status(httpStatus.OK).send({ msg: 'Item  sync in progress' });
    // res.status(httpStatus.OK).send("Job scheduled successfully!!");
  } catch (error) {
    console.log("getting Error :", error.response ? error.response.data : error.message);

    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
  }
}


