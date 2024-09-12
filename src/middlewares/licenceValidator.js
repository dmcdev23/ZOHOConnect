const FormData = require('form-data');
const API_SERVICE = require('../commonServices/api.service');
const { licenceService } = require('../services');
const httpStatus = require('http-status');
const axios = require('axios');

const licenceValidator = async (req, res, next) => {
  try {
    if (req.user?.licence[req.query.licenceNumber]) {
      const newRefreshToken = await refreshToken(req.user?.licence[req.query.licenceNumber]);
      req.user.licence[req.query.licenceNumber] = newRefreshToken?.licenceNumber;
      req.user.licence[req.query.licenceNumber].accessToken = newRefreshToken.accessToken;
      if (req.user.licence[req.query.licenceNumber]?.isLicenceExpired) {
        throw 'Licence Expired';
      } else if (req.user?.licence[req.query.licenceNumber].isExpired) {
        req.user.licence[req.query.licenceNumber] = await refreshToken(req.user?.licence[req.query.licenceNumber]);
        req.user.licence[req.query.licenceNumber].isExpired = false;
      } else if (!req.user?.licence || !req.query.licenceNumber) {
        throw 'Licence is required to perform this operation';
      }
      next();
    } else {
      throw 'Valid Licence is required to perform this operation';
    }
  } catch (e) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
  }
};
const refreshToken = async (licence) => {
  try {
    switch (licence.licenceNumber) {
      case 'in':
        url = `https://accounts.zoho.in/oauth/v2/token?refresh_token=${licence.refreshToken}&client_id=${licence.clientId}&client_secret=${licence.clientSecret}&grant_type=refresh_token`;
        break;
      case 'us':
        url = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${licence.refreshToken}&client_id=${licence.clientId}&client_secret=${licence.clientSecret}&grant_type=refresh_token`;
        break;
      case 'eu':
        url = `https://accounts.zoho.eu/oauth/v2/token?refresh_token=${licence.refreshToken}&client_id=${licence.clientId}&client_secret=${licence.clientSecret}&grant_type=refresh_token`;
        break;
      case 'au':
        url = `https://accounts.zoho.com.au/oauth/v2/token?refresh_token=${licence.refreshToken}&client_id=${licence.clientId}&client_secret=${licence.clientSecret}&grant_type=refresh_token`;
        break;
      case 'ca':
        url = `https://accounts.zohocloud.ca/oauth/v2/token?refresh_token=${licence.refreshToken}&client_id=${licence.clientId}&client_secret=${licence.clientSecret}&grant_type=refresh_token`;
        break;
      default:
        url = `https://accounts.zoho.in/oauth/v2/token?refresh_token=${licence.refreshToken}&client_id=${licence.clientId}&client_secret=${licence.clientSecret}&grant_type=refresh_token`;
    }

    const config = {
      method: 'post',
      url: url,
      headers: {
        Cookie:
          '_zcsr_tmp=af9ccf44-21bf-498c-843a-3ec22b8a1533; iamcsr=af9ccf44-21bf-498c-843a-3ec22b8a1533; zalb_6e73717622=dea4bb29906843a6fbdf3bd5c0e43d1d',
        'Content-Type': 'multipart/form-data', // if you're using formData
      },
      data: new FormData(), // Add your form data here
    };

    try {
      let response = await axios(config);
      if (response.status >= 200 && response.status < 300) {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 55);
        licence = await licenceService.findOneAndUpdate(licence._id, {
          accessToken: response.data.access_token,
          expireAt: now,
        });
        return licence._doc;
      } else {
        console.error('Request failed with status:', response.status);
      }
    } catch (error) {
      console.error('Error making request:', error.message);
    }
  } catch (e) {
    throw e;
  }
};

module.exports = { licenceValidator, refreshToken };
