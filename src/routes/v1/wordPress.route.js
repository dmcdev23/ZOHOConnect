const express = require('express');
const authController = require('../../controllers/auth.controller');
const wordPressController = require('../../controllers/wordPress.controller');
const ZOHOController = require('../../controllers/ZOHO.controller');
const validate = require('../../middlewares/validate');
const wordPressValidation = require('../../validations/wordPress.validation');
const auth = require('../../middlewares/auth');
const { licenceValidator } = require('../../middlewares/licenceValidator');

const router = express.Router();
router
  .route('/syncOrders')
  .get(auth('user'), validate(wordPressValidation.syncOrders), licenceValidator, wordPressController.syncOrders);

router
  .route('/syncProduct')
  .get(auth('user'), validate(wordPressValidation.syncOrders), licenceValidator, wordPressController.syncProduct);

router
  .route('/getOrders')
  .get(auth('user'), validate(wordPressValidation.getOrders), licenceValidator, wordPressController.getOrders);

router.route('/getProduct').get(auth('user'), validate(wordPressValidation.getProducts), wordPressController.getProduct);

router
  .route('/getCustomer')
  .get(auth('user'), validate(wordPressValidation.getOrders), licenceValidator, wordPressController.getCustomer);

router
  .route('/syncCustomer')
  .get(auth('user'), validate(wordPressValidation.syncContacts), wordPressController.syncCustomer);

router
  .route('/syncCustomerToZoho')
  .get(auth('user'), validate(wordPressValidation.syncContacts), licenceValidator, wordPressController.syncCustomerToZoho);

router
  .route('/syncProductToZoho')
  .get(auth('user'), validate(wordPressValidation.syncContacts), licenceValidator, wordPressController.syncProductToZoho);

router
  .route('/syncOrderToZoho')
  .get(auth('user'), validate(wordPressValidation.syncContacts), ZOHOController.postCreateOrder);

router
  .route('/linkLicence')
  .post(validate(wordPressValidation.updateLicence, { allowUnknown: true }), wordPressController.linkLicence);

router.get('/', authController.recieveToken);

router.route('/fetchOrderByOrderId').get(wordPressController.fetchOrderByOrderId);

router.route('/syncOrderToZohoByOrderId').get(auth('user'), licenceValidator, wordPressController.syncOrderToZohoByOrderId);

router.route('/getSyncHistory').get(auth('user'), wordPressController.getSyncHistory);

router
  .route('/syncProductToZohoByProductId')
  .get(auth('user'), licenceValidator, wordPressController.syncProductToZohoByProductId);

router.route('/blockProducts').post(auth('user'), wordPressController.blockProducts);

router
  .route('/syncProductById')
  .get(auth('user'), licenceValidator, wordPressController.syncProductById);

module.exports = router;
