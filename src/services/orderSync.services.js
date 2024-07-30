const { OrderSyncSetup } = require('../models');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Get all OrderSync 
exports.OrderSyncs = async (req, res) => {
  const orderSyncs = await OrderSyncSetup.find();
  return orderSyncs;
};

// Get a single Order Sync by ID
exports.getOrderSyncById = async (req, res) => {
  const orderSync = await OrderSyncSetup.findOne({ "userId": ObjectId(req?.params?.id )});
  return orderSync;
};

// Create new oder sync configuration
exports.createOrderSync = async (data) => {
  const orderSync = new OrderSyncSetup(data);
  return await orderSync.save();
};

// Update existing order sync configuration
exports.updateOrderSync = async (id, data) => {
  return await OrderSyncSetup.findByIdAndUpdate(id, data, { new: true });
};

// Delete order sync configuration
exports.deleteOrderSync = async (id) => {
  return await OrderSyncSetup.findByIdAndDelete(id);
};
