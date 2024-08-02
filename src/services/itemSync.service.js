const { ItemSyncSetup } = require('../models');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const { licenceService } = require('../services');

// Get all ItemSyncSetup 
exports.getItemSyncs = async (req, res) => {
  const orderSyncs = await ItemSyncSetup.find();
  return orderSyncs;
};

// Get a single Item Sync by ID
exports.getItemSyncById = async (req, res) => {
  const orderSync = await ItemSyncSetup.findOne({ "userId": ObjectId(req?.params?.id) });
  return orderSync;
};

// Create new item sync configuration
exports.createItemSync = async (data) => {
  let { licenseNumber } = data;
  if (licenseNumber) {
    try {
      const license = await licenceService.findOne({ _id: ObjectId(licenseNumber) });
      if (license) {
        return await ItemSyncSetup.findByIdAndUpdate(
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

// Update existing item sync configuration
exports.updateItemSync = async (id, data) => {
  return await ItemSyncSetup.findByIdAndUpdate(id, data, { new: true });
};

// Delete item sync configuration
exports.deleteItemSync = async (id) => {
  return await ItemSyncSetup.findByIdAndDelete(id);
};
