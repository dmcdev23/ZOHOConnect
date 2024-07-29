const { ItemSyncSetup } = require('../models');


// Get all ItemSyncSetup 
exports.getItemSyncs = async (req, res) => {
    const orderSyncs = await ItemSyncSetup.find();
    return orderSyncs;
};

// Get a single Item Sync by ID
exports.getItemSyncById = async (req, res) => {
    const orderSync = await ItemSyncSetup.findById(req?.params?.id);
    return orderSync;
};

// Create new item sync configuration
exports.createItemSync = async (data) => {
  const itemSyncSetup = new ItemSyncSetup(data);
  return await itemSyncSetup.save();
};

// Update existing item sync configuration
exports.updateItemSync = async (id, data) => {
  return await ItemSyncSetup.findByIdAndUpdate(id, data, { new: true });
};

// Delete item sync configuration
exports.deleteItemSync = async (id) => {
  return await ItemSyncSetup.findByIdAndDelete(id);
};
