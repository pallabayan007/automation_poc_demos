/**
 * New node file for Automation process rule engine
 * This node file is for executing the rules defined in nools file based on facts provided by the caller.
 * Based on given facts and the rules defined in nools file, this js  confirms 
 * whether alert process automation is required to start or skip.
 * @author : Supal k chowdhury
 */

var nools = require("nools");


var ruleFilePath = __dirname + "/AutomationProcessRules.nools";
var flow = nools.compile(__dirname + "/AutomationProcessRules.nools");


var Alert = flow.getDefined("Alert");
var ProcessAlertForAutomation = flow.getDefined("ProcessAlertForAutomation");

var NO_DECISION = -1;

var AutomationProcessRules = function() {
	
	var self = this;

	/**
	 * This function is for executing the rule engine for given facts
	 * @param crt - current alert raised time received from monitoring system of an alert
	 * @param alrt - most recent raised time obtained from Audit log repository of an alert
	 * @param stat -status of the alert
	 * @param st -state of the alert
	 * @param callback - callback for invoker to get the return value.
	 */
	this.executeRule = function (crt, alrt, stat, st, callback)
	{
		//Convert all empty/null parameters to null for easing rule-engine to evaluate rules.
		//Convert all non-empty parameters to be trimed 
		crt = (crt === '' || crt === null)?null : crt.trim();
		alrt = (alrt === '' || alrt === null)?null : alrt.trim();
		st = (st === '' || st === null)?null : st.trim();
		
		//Convert  empty status to null and non-empty status  to be trimed and uppercaseed for execute the rules properly
		stat = (stat === '' || stat === null)?null : stat.trim().toUpperCase(); 
		
		var startTime = new Date();
		var myResult = new ProcessAlertForAutomation();
		var mySession = flow.getSession(new Alert({status : stat, state : st, currRaisedTime : crt, auditLoggedRaisedTime : alrt}), myResult);
		
		mySession.match().then(
				
				function (err) {
					var elapsedTime=  (new Date()) - startTime;
					if(err)
					{
						//throw new Error("Rule-engine encounters error while executed ---->" + err );
						callback(new Error("Rule-engine encounters error while executed ---->" + err), myResult.value,elapsedTime);
					}
					//No rules get matched, so result value did not changed.
					else if (myResult.value === NO_DECISION)
					{
						//throw new Error("Rule-engine not able to come up with resolution. Please recheck the rules you have defined." );
						callback(new Error("Rule-engine not able to come up with resolution. Please recheck the rules you have defined."), myResult.value,elapsedTime);
					}
					else {
						callback(null, myResult.value, elapsedTime);
					}	
				}
		);
		
		mySession.dispose();
		return;
	}//executeRule
	
	return this;
}


module.exports = AutomationProcessRules;

////UNIT TEST ZONE
//
//
//	//Current Alert raised time  received from monitoring system
//	var crt = '12:11:12 2-aug-2015'; 
//	
//	//most recent alert raised time retrieved from Audit log
//	var alrt = '12:11:12 2-aug-2015 ss';
//	
//	//Alert status
//	var stat = 'jkjxkzjx   ';
//	
//	//Alert state
//	var st = 'AutomationDone ' ;
//	
//	
//	executeRule(crt, alrt, stat, st, function( err, response1, response2)
//	{
//			if(err)
//				{
//				console.log("%s ", err);
//				}
//			console.log("%s [%dms]", "Rule-engine returns value  ---->" + response1 + " with elapsed time:",response2);
//	});
		
	




