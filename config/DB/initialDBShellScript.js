//create the madMen database and connect to it
var db = connect('127.0.0.1:27017/test1');

print('** Drop all the collections first.');

//var globalArray=[];
var accountid,applicationid;
// Get all the collection name in the variable array.
var allMadMen = db.getCollectionNames();
print(allMadMen);

for(var i=0;i<allMadMen.length;i++)
{
	//Drop all the collection one by one in a loop
		var collectionname=allMadMen[i];
	 print('value of i >'+i+'  collectionname >> '+collectionname);
	 if(collectionname!='system.indexes')
	db[collectionname].drop();
}

//create the initial collection and add documents to it
db.clients.insert({'clientName' : 'SAP001','trashed':'n','updateTimestamp':new Date(),'__v':0});
db.accounts.insert({'accountName' : 'SAP Account','clientName':'SAP001','trashed':'n','updateTimestamp':new Date(),'__v':0});

//search for the account details"
db.accounts.find().forEach( function(thisDoc) {
	accountid=thisDoc._id;
	print('* Updated document: ' + accountid);
});
var tempStr=accountid.toString();
var accountidString=tempStr.substring(tempStr.lastIndexOf("(")+2,tempStr.lastIndexOf(")")-1);
print(accountidString);
db.applications.insert({'applicationName' : 'ISU','trashed':'n','updateTimestamp':new Date(),'__v':0,'accountID':accountidString});

//search for the application details"
db.applications.find().forEach( function(thisDoc) {
	applicationid=thisDoc._id;
	print('* Updated app document: ' + applicationid);
});

db.roles.insert({'roleName' : 'Virtual System Engineer','capabilityNameList':'SopEdtr-Add|Upd|Del|VW','trashed':'n','updateTimestamp':new Date(),'__v':0});
db.roles.insert({'roleName' : 'DEFAULT','capabilityNameList':'','trashed':'n','updateTimestamp':new Date(),'__v':0});
db.capabilities.insert({'capName' : 'SopEdtr-Add|Upd|Del|VW','capRegStr':'^SopEdtr-Add|Upd|Del|VW(Add|Update,Delete,View)','accessPanel':'sopeditor','trashed':'n','updateTimestamp':new Date(),'__v':0});
db.usercredentials.insert({'userName' : 'sauser','trashed':'n','updateTimestamp':new Date(),'__v':0,'password' : '$2a$10$oiTMd8m6xTe6O.uIxMMrBOwcVlJkK6iXF6sJsByhuO1Cr4Buemb12'});


print('*** Account Details shown');


var account = [];
//var applicationIdList=[];
var jsonObj={};
jsonObj.accountId=accountid;
jsonObj.applicationIdList=[applicationid];
//jsonObj..applicationIdList.push(applicationid);
account.push(jsonObj);

print(account);
db.users.insert({'userName' : 'Super Admin','userID':'sauser','roleName':'Virtual System Engineer','type':'SuperAdmin','active':'Y','account':account,'trashed':'n','updateTimestamp':new Date(),'__v':0});

print('* Documents created');