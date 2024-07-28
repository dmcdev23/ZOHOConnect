const { ItemSyncSetup } = require('../models');

// Create new item sync configuration
exports.createItemSync = async (data) => {
  const itemSyncSetupSetup = new ItemSyncSetupSetup(data);
  return await ItemSyncSetup.save();
};

// Update existing item sync configuration
exports.updateItemSync = async (id, data) => {
  return await ItemSyncSetup.findByIdAndUpdate(id, data, { new: true });
};

// Delete item sync configuration
exports.deleteItemSync = async (id) => {
  return await ItemSyncSetup.findByIdAndDelete(id);
};
