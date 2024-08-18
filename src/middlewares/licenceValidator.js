const FormData = require('form-data');
const API_SERVICE = require('../commonServices/api.service');
const { licenceService } = require('../services');
const httpStatus = require('http-status');
const axios = require('axios');


const licenceValidator = async (req, res, next) => {
try{

  const newRefreshToken= await refreshToken(req.user?.licence[req.query.licenceNumber]);
 // console.log("newRefreshToken", newRefreshToken)
  req.user.licence[req.query.licenceNumber] = newRefreshToken?.licenceNumber;
  req.user.licence[req.query.licenceNumber].accessToken = newRefreshToken.accessToken;


  if (req.user.licence[req.query.licenceNumber]?.isLicenceExpired) {
    throw 'Licence Expired';
  }else if(req.user?.licence[req.query.licenceNumber].isExpired){
    req.user.licence[req.query.licenceNumber] = await refreshToken(req.user?.licence[req.query.licenceNumber]);
    req.user.licence[req.query.licenceNumber].isExpired = false;
    //need to refresh token in case of token expiery
  }else if(!req.user?.licence || !req.query.licenceNumber){
    throw 'Licence is required to perform this operation';
  }
  next();
}catch (e) {
  res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
}
};
const refreshToken = async (licence)=>{
  console.log("res.hello ", licence)
  
try{

  //  const authUrl = 'https://accounts.zoho.in/oauth/v2/token?refresh_token=1000.537a73d127f12c7bc1037c380ac634f2.395a68c6a414bf76303b22eff77ff45f&client_id=`${licence.clientId}`&client_secret=fb50fc6fc382a95d48dd769850f4d5c3e30e5d4dcb&grant_type=refresh_token';
    
   console.log("licence.licenceNumber", licence.licenceNumber)
   switch (licence.licenceNumber){
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
      'Cookie': '_zcsr_tmp=af9ccf44-21bf-498c-843a-3ec22b8a1533; iamcsr=af9ccf44-21bf-498c-843a-3ec22b8a1533; zalb_6e73717622=dea4bb29906843a6fbdf3bd5c0e43d1d',
      'Content-Type': 'multipart/form-data', // if you're using formData
    },
    data: new FormData(), // Add your form data here
  };

  try {
    let response = await axios(config);
    // Check if the response is successful
    if (response.status >= 200 && response.status < 300) {
      // Proceed to the next step
       console.log('Request successful:', response.data.access_token);
       const now = new Date();
       now.setMinutes(now.getMinutes() + 55);
      licence = await licenceService.findOneAndUpdate( licence._id, {accessToken: response.data.access_token, expireAt: now});
      return licence._doc;
    } else {
      console.error('Request failed with status:', response.status);
      // Handle the failure case
    }
  } catch (error) {
    console.error('Error making request:', error.message);
  }

  // let data = new FormData();
  // data.append('client_id', licence.clientId);
  // data.append('client_secret', licence.clientSecret);
  // data.append('refresh_token', licence.refreshToken);
  // data.append('grant_type', 'refresh_token');
  // const res = await API_SERVICE.refreshToken(data);
  // const now = new Date();
  // now.setMinutes(now.getMinutes() + 55);
  // console.log("res.access_token data", data)

  
   
  // licence = await licenceService.findOneAndUpdate( licence._id, {accessToken: zohoToken.access_token, expireAt: now});
  // return licence._doc;
}catch (e) {
  throw e;
}
}

module.exports = { licenceValidator };
