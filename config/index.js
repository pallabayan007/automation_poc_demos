

var whitelist = ["http://localhost:3000"];


module.exports = {
	name : "Application Monitoring",

	ci_test_base : "https://208.43.108.6:1774", //https://208.43.108.6:1778

	ipsoft_base : "https://108.168.255.111",
	ipsoft_user : "tc1_user",
	ipsoft_pass : "ipsoft4YOU", //"GRn3U71a",
	ipsoft_client_id : "GBS",
	
//	solman_base : "https://eval-provide.castiron.com/env/Development/SP4/IPSoft",
//	solman_user : "admin@praspaul.ibm",
//	solman_pass : "changeIt!",
	
	solman_base : "http://inmbz2007.in.dst.ibm.com:8000",
	solman_user : "",
	solman_pass : "", //c25hbmR5OjFxYXpAV1NY
	
	/** FIXME: CRUD service locate at localhost **/
	crudservice_base : "http://localhost:3000/rest",
	
	
	/**  CORS **/
	corsOptions : {
		origin : function(origin, callback){
			var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
			callback(null, originIsWhitelisted);
		}
	}
}