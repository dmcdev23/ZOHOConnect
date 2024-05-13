/**
 * Prints the logs in case of developement env.
 * @param {Object} object
 * @param {string[]} keys
 * @returns {Object}
 */
const log = (...args) => {
  console.log(args);
};
const exportObj = { log };
if (process.env.NODE_ENV === 'production') {
  Object.keys(exportObj).forEach((element) => {
    exportObj[element] = () => {};
  });
}
module.exports = exportObj;
