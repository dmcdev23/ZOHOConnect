const express = require('express');
const authController = require('../../controllers/auth.controller');
const ZOHOController = require('../../controllers/ZOHO.controller');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const auth = require('../../middlewares/auth');
const { licenceValidator } = require('../../middlewares/licenceValidator');

const router = express.Router();

router.get('/', authController.recieveToken);
router.post('/generateAuthToken', authController.generateToken);
router.route('/linkZOHO').post(auth('linkZOHO'), validate(userValidation.linkZOHO), authController.linkZOHO);
router
  .route('/createLicence')
  .post(auth('createLicence'), validate(userValidation.createLicence), authController.createLicence);
router.get('/getOrganizations').post(auth('user'), validate(userValidation.getOrganizations),licenceValidator, ZOHOController.getOrganizations);

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
