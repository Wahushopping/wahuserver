// Determine affiliate level from order count
function getLevelByOrders(orderCount) {
  if (orderCount >= 4096) return "Diamond";
  if (orderCount >= 1024) return "Platinum";
  if (orderCount >= 256) return "Gold";
  if (orderCount >= 64) return "Silver";
  if (orderCount >= 16) return "Bronze";
  return "Newbie";
}

// Determine commission amount based on level
function getCommissionByLevel(level) {
  switch (level) {
    case "Diamond":
      return 86;
    case "Platinum":
      return 54;
    case "Gold":
      return 36;
    case "Silver":
      return 24;
    case "Bronze":
    default:
      return 16;
  }
}

module.exports = {
  getLevelByOrders,
  getCommissionByLevel
};
