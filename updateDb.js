const { SeatCategory } = require('./src/models');

async function run() {
  await SeatCategory.update(
    { name: 'VIP Recliner Lounges' },
    { where: { name: 'Upper Promenade Balcony' } }
  );
  console.log('Updated category name successfully.');
  process.exit(0);
}
run().catch(console.error);
