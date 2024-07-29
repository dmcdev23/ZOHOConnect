const { validationResult } = require('express-validator');
const { ItemSyncService } = require('../services');
const httpStatus = require('http-status');


// Get all item sync configuration 
exports.getItemSyncs = async (req, res) => {
  try {
    const itemSyncs = await ItemSyncService.getItemSyncs(req, res);
    res.status(httpStatus.OK).send(itemSyncs);
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(err);
  }
};

// Get a single item sync configuration by ID
exports.getItemSyncById = async (req, res) => {
  try {
    const orderSync = await ItemSyncService.getItemSyncById(req, res);
    if (!orderSync) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ error: 'OrderSync not found' });
    }
    res.status(httpStatus.OK).send(orderSync);
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(err);
  }
}

// Create new item sync configuration
exports.createItemSync = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: errors});
  }
  try {
    const savedItemSync = await ItemSyncService.createItemSync(req.body);
    res.status(httpStatus.OK).send(savedItemSync);
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(err);
  }
};

// Update existing item sync configuration
exports.updateItemSync = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: errors});
  }

  try {
    const updatedItemSync = await ItemSyncService.updateItemSync(req.params.id, req.body);
    if (!updatedItemSync) {
     // return res.status(404).json({ error: 'ItemSync not found' });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ error: 'ItemSync not found' });
    }
    res.status(httpStatus.OK).send(updatedItemSync);
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(err);
  }
};

// Delete item sync configuration
exports.deleteItemSync = async (req, res) => {
  try {
    const deletedItemSync = await ItemSyncService.deleteItemSync(req.params.id);
    if (!deletedItemSync) {
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'ItemSync not found' });
    }
    res.status(httpStatus.OK).send(deletedItemSync);
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(err);
  }
};
