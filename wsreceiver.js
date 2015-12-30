var util = require('util');
var stream = require('stream');

// WebSocketからの指示を受け取るWritable Stream
function WebSocketReceiver(){
        this.writable = true;
		this.readable = true;
        this.onmessage = function(data){};
		this.piped = false;
}

util.inherits(WebSocketReceiver,stream.Stream);

WebSocketReceiver.prototype.send = function(data){
		this.emit('data',data);
}

WebSocketReceiver.prototype.end = function(data){
        if(data) this.write(data);
        this.writable = false;
}

WebSocketReceiver.prototype.write = function(data){
        var data = data.toString().trim();
        this.onmessage(JSON.parse(data));
        return true;
}

WebSocketReceiver.prototype.resume = function(){};
WebSocketReceiver.prototype.pause = function(){};
WebSocketReceiver.prototype.pipe = function(dest){
	this.piped = true;
	this.on('data',function(data){
		dest.write(data);
	});
}
WebSocketReceiver.prototype.setEncoding = function(encoding){};
WebSocketReceiver.prototype.destroy = function() {};
WebSocketReceiver.prototype.destroySoon = function() {};

module.exports = WebSocketReceiver;

