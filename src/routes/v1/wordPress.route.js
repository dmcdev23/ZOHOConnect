const express = require('express');
const authController = require('../../controllers/auth.controller');
const wordPressController = require('../../controllers/wordPress.controller');
const validate = require('../../middlewares/validate');
const wordPressValidaation = require('../../validations/wordPress.validation');
const auth = require('../../middlewares/auth');
const { licenceValidator } = require('../../middlewares/licenceValidator');

const router = express.Router();
router.route('/syncOrders').get(auth('user'), validate(wordPressValidaation.syncOrders), wordPressController.syncOrders);

router.route('/getOrders').get(auth('user'), validate(wordPressValidaation.getOrders), wordPressController.getOrders);

router
  .route('/syncCustomer')
  .get(auth('user'), validate(wordPressValidaation.syncContacts), wordPressController.syncCustomer);

router
  .route('/syncCustomerToZoho')
  .get(auth('user'), validate(wordPressValidaation.syncContacts), licenceValidator, wordPressController.syncCustomerToZoho);

router
  .route('/linkLicence')
  .post(validate(wordPressValidaation.updateLicence, { allowUnknown: true }), wordPressController.linkLicence);

router.get('/', authController.recieveToken);

module.exports = router;
