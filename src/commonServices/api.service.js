const { post } = require('./axios.service');

const refreshToken = async (data) => {
  try {
    const config = {
      endpoint: 'token',
      data,
    };
    return await post(config);
  } catch (error) {
    console.error(error);
    throw error;
  }
};
module.exports = { refreshToken };
