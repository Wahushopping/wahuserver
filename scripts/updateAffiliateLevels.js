// scripts/updateAffiliateLevels.js
const mongoose = require("mongoose");
const Affiliate = require("../models/Affiliate");
const { getLevelByOrders } = require("../utils/affiliateUtils");

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const all = await Affiliate.find();
  for (const aff of all) {
    const newLevel = getLevelByOrders(aff.orders || 0);
    if (aff.level !== newLevel) {
      aff.level = newLevel;
      await aff.save();
      console.log(`Updated ${aff.affiliateId} -> ${newLevel}`);
    }
  }

  console.log("Done");
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
