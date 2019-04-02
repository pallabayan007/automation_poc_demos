var events = require("events");
var underscore = require("underscore");
var eventEmitter = new events.EventEmitter();



var SocketManager = function(){

	var self = this;

	this._s = [];

	this.add = function(socket){
		console.log ("connect socket : " + socket.id);
		self._s.push(socket);
		eventEmitter.emit("add", socket);
	}

	this.emit = function(event, data){
		for(var i = 0 ; i < self._s.length; i++){
			try{
				self._s[i].emit(event, data);
				console.log("Emit Message...");
			}  catch(e){
				console.log(e);
			}
		}
	}

	this.registerEvent = function(event_name, caller){
		eventEmitter.on(event_name, caller);
	}


}

global.SocketManager = new SocketManager();
