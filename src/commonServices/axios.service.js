const axios = require('axios');
const { zohoBaseURL, zohoAuthBaseURL } = require('../config/config');

const post = async (data) => {
  try {
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: zohoBaseURL + data.endpoint,
      headers: {
        Authorization: `Bearer ${data.accessToken}`,
        'content-type': 'application/json',
      },
      data: data.data,
    };
    return await axios.request(config);
  } catch (error) {
    console.error(error);
    throw error;
  }
};
const authPost = async (data) => {
  try {
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: zohoAuthBaseURL + data.endpoint,
      headers: { 'Content-Type': 'multipart/form-data;' },
      data: data.data,
    };
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    console.log(error);
  }
};
const get = async (user, endPoint) => {
  try {
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: endPoint,
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
      },
    };
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

const put = async ({ accessToken, endpoint, data }) => {
  try {
    const config = {
      method: 'put',
      maxBodyLength: Infinity,
      url: zohoBaseURL + endpoint,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      data,
    };
    return await axios.request(config);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = { post, authPost, get, put };
