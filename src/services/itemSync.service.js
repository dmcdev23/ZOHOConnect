const { ItemSyncSetup } = require('../models');

// Create new item sync configuration
exports.createItemSync = async (data) => {
  console.log("call createItemSync services")
  try{
  const itemSyncSetup = new ItemSyncSetup(data);
  return await itemSyncSetup.save();
  }catch(err){
    console.log("error", err)
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
