var tweetpipe = require('tweet-pipe');
var Twit  = require('twit');
var websocket = require('websocket-stream');
var OAuth = require('oauth').OAuth;
var WebSocketReceiver = require('./wsreceiver');
var option = {
	consumer_key:'lNfU4NLZyQDOLCRUsUU7EEyxx',
	consumer_secret:'JHQ5W76gVt1v4gJ6qYnyxVQ12UF5CMGr57NFIW3L7uCul02ywk',
	callback_url : 'https://web.waftter.jp/'
}

var ws = websocket.createServer({host:"192.168.1.6",port:3000},function(stream){
	var twit_conf = [
		option.consumer_key,
		option.consumer_secret,
		undefined,
		undefined
	];
	var tp;
	var twit;
	var receiver = new WebSocketReceiver();
	receiver.onmessage = function(data){
		if(data.type == 'Get OAuth Token'){
			var oa = new OAuth(
				"https://api.twitter.com/oauth/request_token",
				"https://api.twitter.com/oauth/access_token",
				option.consumer_key,
				option.consumer_secret,
				"1.0",
				option.callback_url,
				"HMAC-SHA1"
			);
			oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
				if (error) {
					console.log(error);
					return;
				} else {
					console.log(oauth_token);
					console.log(oauth_token_secret);
					receiver.send({
						type:data.type,
						data:{
							oauth_token:oauth_token,
							oauth_token_secret:oauth_token_secret
						}
					});
				}
			});
		}
		if(twit_conf[0] === undefined || twit_conf[1] === undefined) return;
		if(data.type == 'Authenticate'){
			tp = new tweetpipe({
				consumer_key:		twit_conf[0],
				consumer_secret:	twit_conf[1],
				token:				twit_conf[2],
				token_secret:		twit_conf[3]
			});
			twit = new Twit({
				consumer_key:			twit_conf[0],
				consumer_secret:		twit_conf[1],
				access_token:			twit_conf[2],
				access_token_secret:	twit_conf[3]
			});
		}
		if(data.type == 'GET'){
			twit.get(data.data.path,data.data.params,function(err,data,res){
				receiver.send(data);
			});
		}
		if(data.type == 'POST'){
			twit.post(data.data.path,data.data.params,function(err,data,res){
				receiver.send(data);
			});
		}
		if(data.type == 'Stream'){
			var streaming = tp.stream(data.data.path,data.data.params,function(stream){
				stream.on('all',function(data){
					stream.emit('data',data);
				});
			}).pipe(tp.stringify());
			
			// Debug
			streaming.pipe(process.stdout);
		
			// UserStream -> WebSocket
			streaming.pipe(stream);
		}
		console.log(data);
		
	}

	// Define UserStream (readable stream)
	/*var tp = new tweetpipe({
		consumer_key:'cEGSdcbGtZ5SHrUnPYrdQr2Qe',
		consumer_secret:'WG2zx3XXJw5LEumig4qe6LHO3IonVhrmyOS4OVCD0Pxlaox3c7',
		token:'105786117-EYmLJst71u2HBc8NrEqDoV0OQvdWubpL31aGswMz',
		token_secret:'FDVaWjyP3Rk2jpijdubCxVcTnsiKKNzGVmjfDQTaBdEhG'
	});*/

	// WebSocket -> receiver
	stream.pipe(receiver);
	receiver.pipe(stream);
});
