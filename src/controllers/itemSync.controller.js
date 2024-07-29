const { validationResult } = require('express-validator');
const { ItemSyncService } = require('../services');

// Create new item sync configuration
exports.createItemSync = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const savedItemSync = await ItemSyncService.createItemSync(req.body);
    res.status(201).json(savedItemSync);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update existing item sync configuration
exports.updateItemSync = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const updatedItemSync = await ItemSyncService.updateItemSync(req.params.id, req.body);
    if (!updatedItemSync) {
      return res.status(404).json({ error: 'ItemSync not found' });
    }
    res.status(200).json(updatedItemSync);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete item sync configuration
exports.deleteItemSync = async (req, res) => {
  try {
    const deletedItemSync = await ItemSyncService.deleteItemSync(req.params.id);
    if (!deletedItemSync) {
      return res.status(404).json({ error: 'ItemSync not found' });
    }
    res.status(200).json({ message: 'ItemSync deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
