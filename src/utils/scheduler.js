const cron = require('node-cron');
const syncService = require('../services/schedulers.service'); 

// Define a method to initialize and start the cron job with a given cron expression
exports.CreateCronJob = (cronExpression) => {
  cron.schedule(cronExpression, syncService.runSyncJob);
  console.log(`Cron job scheduled to run with expression: ${cronExpression}`);
};
