const axios = require('axios');
const { zohoBaseURL, zohoAuthBaseURL } = require('../config/config');

const post = async (data) => {
  try {
    const configs = {
      method: 'post',
      maxBodyLength: Infinity,
      url: zohoBaseURL + data.endpoint,
      headers: {},
    };
    const response = await axios.request(config);
    return response;
  } catch (error) {
    console.log(error);
  }
};
const authPost = async (data) => {
  try {
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: zohoAuthBaseURL + data.endpoint,
      headers: { 'Content-Type': 'multipart/form-data;' },
    };
    const response = await axios.request(config);
    return response;
  } catch (error) {
    console.log(error);
  }
};
module.exports = { post, authPost };
