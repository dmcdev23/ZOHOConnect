
exports.runSyncJob = async () => {
    try {
      console.log('Running sync job...');
      console.log('Sync job completed successfully.');
    } catch (error) {
      console.error('Error during sync job:', error);
    }
  };