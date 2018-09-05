
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var applications = new Schema({  
    applicationName: { type: String, required: true },
    applicationShortDesc: { type: String, required: false },
    applicationSupportLevel: { type: String, required: false },
    applicationSupportStartDate: { type: String, required: false },
    appContractType: { type: String, required: false },
    applicationTechStack: { type: String, required: false },
    applicationAppServer: { type: String, required: false },
    applicationInterfacingApps: { type: String, required: false },
    accountID: { type: String, required: true },
    updateTimestamp : { type: Date}, 
	updatedByUserId : {type: String},
	updateComment : {type: String},
	trashed: {type: String},
    //alerts: [alerts]
});


module.exports = applications;