const cron = require('node-cron');
const syncService = require('../services/schedulers.service'); 

// Define a method to initialize and start the cron job with a given cron expression
exports.CreateCronJob = (req, res) => {
  //cron.schedule(cronExpression, syncService.runSyncJob);
  syncService.runSyncJob(req, res);
  console.log(`Cron job scheduled to run with expression: ${cronExpression}`);
};
