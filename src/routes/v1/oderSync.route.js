const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { OrderSyncController } = require('../../controllers');



// Routes for OrderSync
router.post('/', OrderSyncController.createOrderSync);
router.post('/createCronJobForSyncOrder', OrderSyncController.createCronJobForSyncOrder);
router.get('/createCronJobForSyncItemInventory', OrderSyncController.createCronJobForSyncItemInventory);
//router.put('/:id', OrderSyncController.updateOrderSync);
router.delete('/:id', OrderSyncController.deleteOrderSync);
//router.get('/', OrderSyncController.getItemSyncs);
router.get('/:id', OrderSyncController.getOrderSyncById);


module.exports = router;
