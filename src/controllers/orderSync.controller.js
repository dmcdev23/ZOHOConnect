const { validationResult } = require('express-validator');
const { OrderSyncService } = require('../services');
const httpStatus = require('http-status');
const  CronJobScheduler = require('../utils/scheduler')

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

exports.createCronJobForSyncOrder = async(req, res) =>{
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


exports.createCronJobForSyncItemInventory = async(req, res) =>{
  try {
    //CronJobScheduler.CreateCronJob('*/5 * * * *')
    CronJobScheduler.createCronJobForSyncItemInventory(req, res);
    console.log("createCronJobForSyncItemInventory done")
    res.status(httpStatus.OK).send({ msg: 'Item  sync in progress' });
   // res.status(httpStatus.OK).send("Job scheduled successfully!!");
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(err);
  }
}