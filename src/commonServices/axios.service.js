const axios = require('axios');
const { zohoBaseURL, zohoAuthBaseURL } = require('../config/config');
const { zohoEndPoint } = require('../utils/constant');

const post = async (data, region = 'in') => {
  try {
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: zohoEndPoint[region] + data.endpoint,
      headers: {
        Authorization: `Bearer ${data.accessToken}`,
        'content-type': 'application/json',
      },
      data: data.data,
    };
    return await axios.request(config);
  } catch (error) {
    //console.log("Some thing wen wrong on ZHO API!!", error.response);
    return error;
  }
};
const authPost = async (data, region) => {
  try {
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: zohoBaseURL[region] + data.endpoint,
      headers: { 'Content-Type': 'multipart/form-data;' },
      data: data.data,
    };
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    console.log(error);
    return error;
  }
};
const get = async (accessToken, endPoint) => {
  try {
   // console.log("user.accessToken", accessToken)
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: endPoint,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const put = async ({ accessToken, endpoint, data,region }) => {
  try {
    const config = {
      method: 'put',
      maxBodyLength: Infinity,
      url: zohoEndPoint[region] + endpoint,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      data,
    };
    return await axios.request(config);
  } catch (error) {
    console.error(error);
    return error;
   // throw error;
  }
};

const getDynamic = async ({ accessToken, endpoint, data },region) => {
  try {
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: zohoEndPoint[region] + endpoint,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
    };
    return await axios.request(config);
  } catch (error) {
    console.error(error);
    return error;
   // throw error;
  }
};

module.exports = { post, authPost, get, put, getDynamic };
