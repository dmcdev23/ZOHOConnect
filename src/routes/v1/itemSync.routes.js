const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const itemSyncController = require('../../controllers/itemSync.controller');

const validateItemSync = [
  check('syncMethod')
    .isIn(['ITEM', 'SKU', 'BARCODE'])
    .withMessage('syncMethod must be one of ITEM, SKU, or BARCODE'),
  check('itemSyncSource')
    .isIn(['ZOHO', 'WOOCOMMERCE'])
    .withMessage('itemSyncSource must be one of ZOHO or WOOCOMMERCE'),
  check('itemSyncIntermediateDestination')
    .isIn(['PHYGITAL_COMMERCE'])
    .withMessage('itemSyncIntermediateDestination must be PHYGITAL_COMMERCE'),
  check('itemSyncFinalDestination')
    .isIn(['ZOHO', 'WOOCOMMERCE'])
    .withMessage('itemSyncFinalDestination must be one of ZOHO or WOOCOMMERCE'),
  check('syncParameters')
    .isArray()
    .withMessage('syncParameters must be an array')
    .custom((value) => {
      const validParams = ['PARAMETER_1', 'PARAMETER_2', 'PARAMETER_3'];
      for (let param of value) {
        if (!validParams.includes(param)) {
          throw new Error(`Invalid syncParameter: ${param}`);
        }
      }
      return true;
    }),
  check('syncFrequency')
    .isObject()
    .withMessage('syncFrequency must be an object')
    .custom((value) => {
      const validKeys = ['forAll', 'forItem', 'forPrice', 'forInventory'];
      for (let key in value) {
        if (!validKeys.includes(key) || typeof value[key] !== 'boolean') {
          throw new Error(`Invalid syncFrequency key or value: ${key}`);
        }
      }
      return true;
    }),
  check('manualSync')
    .isObject()
    .withMessage('manualSync must be an object')
    .custom((value) => {
      const validKeys = ['overrideAll', 'incrementalSync'];
      for (let key in value) {
        if (!validKeys.includes(key) || typeof value[key] !== 'boolean') {
          throw new Error(`Invalid manualSync key or value: ${key}`);
        }
      }
      return true;
    })
];

// Routes for ItemSync
router.post('/', validateItemSync, itemSyncController.createItemSync);
router.put('/:id', validateItemSync, itemSyncController.updateItemSync);
router.delete('/:id', itemSyncController.deleteItemSync);

module.exports = router;
