const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { OrderSyncController } = require('../../controllers');



// Routes for ItemSync
router.post('/', OrderSyncController.createItemSync);
router.put('/:id', OrderSyncController.updateItemSync);
router.delete('/:id', OrderSyncController.deleteItemSync);
//router.get('/', OrderSyncController.getItemSyncs);
router.get('/:id', OrderSyncController.getItemSyncById);

module.exports = router;
