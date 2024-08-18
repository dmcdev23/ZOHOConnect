const express = require('express');
const authController = require('../../controllers/auth.controller');
const ZOHOController = require('../../controllers/ZOHO.controller');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const ZohoValidation = require('../../validations/zoho.validation');
const auth = require('../../middlewares/auth');
const { licenceValidator } = require('../../middlewares/licenceValidator');

const router = express.Router();
router
  .route('/getOrganizations')
  .get(auth('user'), validate(userValidation.getOrganizations), licenceValidator, ZOHOController.getOrganizations);
router.post('/generateAuthToken', authController.generateToken);
router.route('/linkZOHO').get(auth('linkZOHO'), validate(userValidation.linkZOHO), authController.linkZOHO);
router
  .route('/createLicence')
  .post(auth('createLicence'), validate(userValidation.createLicence), authController.createLicence);
router
  .route('/createOrganizations')
  .post(auth('user'), validate(ZohoValidation.createOrganization), licenceValidator, ZOHOController.createOrganizations);
router
  .route('/updateOrganizations')
  .post(auth('user'), validate(ZohoValidation.updateOrganization), licenceValidator, ZOHOController.updateOrganizations);
router
  .route('/createItem')
  .post(auth('user'), validate(ZohoValidation.createItem), licenceValidator, ZOHOController.createItem);
router.route('/getItem').get(auth('user'), validate(ZohoValidation.getItems), licenceValidator, ZOHOController.getItems);
router
  .route('/updateItem')
  .post(auth('user'), validate(ZohoValidation.updateItem), licenceValidator, ZOHOController.updateItems);

router
  .route('/createSale')
  .post(auth('user'), validate(ZohoValidation.createSale), licenceValidator, ZOHOController.createSale);

router
  .route('/updateSale')
  .put(auth('user'), validate(ZohoValidation.updateSale), licenceValidator, ZOHOController.updateSale);

router.route('/getSale').get(auth('user'), validate(ZohoValidation.getSale), licenceValidator, ZOHOController.getSale);

router
  .route('/createContact')
  .post(auth('user'), validate(ZohoValidation.createContact), licenceValidator, ZOHOController.createContact);

router
  .route('/updateContact')
  .put(auth('user'), validate(ZohoValidation.updateContact), licenceValidator, ZOHOController.updateContact);

router
  .route('/getContact')
  .get(auth('user'), validate(ZohoValidation.getContact), licenceValidator, ZOHOController.getContacts);

router.route('/getLicence').get(auth('user'), ZOHOController.getLicence);

router.get('/', authController.recieveToken);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: ZOHO
 *   description: ZOHO_ROUTERS
 */

/**
 * @swagger
 * /bg_prod/linkZOHO:
 *  get:
 *     summary: Link ZOHO Account
 *     description: Need to pass client Id and client Secret in this API.
 *     tags: [ZOHO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: client_id
 *         schema:
 *           type: string
 *         description: Client Id
 *       - in: query
 *         name: client_secret
 *         schema:
 *           type: string
 *         description: Client Secret
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 totalResults:
 *                   type: integer
 *                   example: 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */
