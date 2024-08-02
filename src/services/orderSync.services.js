const { OrderSyncSetup } = require('../models');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const { licenceService } = require('../services');

// Get all OrderSync 
exports.OrderSyncs = async (req, res) => {
  const orderSyncs = await OrderSyncSetup.find();
  return orderSyncs;
};

// Get a single Order Sync by ID
exports.getOrderSyncById = async (req, res) => {
  const orderSync = await OrderSyncSetup.findOne({ "userId": ObjectId(req?.params?.id) });
  return orderSync;
};

// Create or update item sync configuration
exports.createOrderSync = async (data) => {
  let { licenseNumber } = data;
  if (licenseNumber) {
    try {
      const license = await licenceService.findOne({ _id: ObjectId(licenseNumber) });
      if (license) {
        return await OrderSyncSetup.findByIdAndUpdate(
          licenseNumber,
          data,
          { new: true, upsert: true }
        );
      } else {
        return "Invalid License Number";
      }
    } catch (error) {
      // Handle potential errors, such as database issues
      console.error('Error:', error);
      return "An error occurred while processing the request";
    }
  } else {
    return "License number is required";
  }
};

// Update existing order sync configuration
exports.updateOrderSync = async (id, data) => {
  return await OrderSyncSetup.findByIdAndUpdate(id, data, { new: true });
};

// Delete order sync configuration
exports.deleteOrderSync = async (id) => {
  return await OrderSyncSetup.findByIdAndDelete(id);
};
