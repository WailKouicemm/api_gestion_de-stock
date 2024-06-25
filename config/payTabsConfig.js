const paytabs = require('paytabs_pt2');
console.log(process.env.PAY_TABS_PROFILE_ID);
console.log(process.env.PAY_TABS_SERVER_KEY);

paytabs.setConfig( process.env.PAY_TABS_PROFILE_ID, process.env.PAY_TABS_SERVER_KEY, "SAU");

module.exports = paytabs;