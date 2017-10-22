const http = require('http');
const express = require('express');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const language  = require('@google-cloud/language');
const MongoClient = require('mongodb').MongoClient;
const randomstring = require("randomstring");
var url = process.env.mongo_uri;

const twilio_number = '+17656370247';
var twilio_sid = process.env.twilio_sid;
var twilio_auth = process.env.twilio_auth;
const twilio = require('twilio');
const client = new twilio(twilio_sid, twilio_auth);

const app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({	extended: true }));

app.post('/record', (req,res) => {
	const twiml = new VoiceResponse();
	twiml.say('Hello, please record your plea for help after the beep.');

	twiml.record({transcribe: true, maxLength: 30});

	twiml.hangup();
	res.type('text/xml');
	res.send(twiml.toString());

	console.log(twiml.toString());
})

app.post('/message', (req, res) => {
	const twiml = new MessagingResponse();
	var incoming_msg = req.body.Body;
	console.log(req.body);
	if(incoming_msg == 'squadup!'){
		var str = randomstring.generate({
			length: 4,
			charset: 'alphanumeric',
			capitalization: 'uppercase'
		});
		var document = {
			number: req.body.From,
			squadID: str,
			leader: 1
		}
		MongoClient.connect(url, function(err, db){
			if(err) throw err;
			db.collection("users").insertOne(document, function(err, res){
				if (err) throw err;
				console.log("Created a new squad");
				db.close();
			});
		});
		twiml.message("Give your friends this code: " + str);
	}else if(incoming_msg.length == 4){
		//code!
		var document = {
			number: req.body.From,
			squadID: incoming_msg,
			leader: 0
		}
		MongoClient.connect(url, function(err, db){
			if(err) throw err;
			db.collection("users").insertOne(document, function(err, res){
				if (err) throw err;
				console.log("Added a squad member!");
				db.close();
			});
		});
	}else if(incoming_msg == '!leave'){
		//text everyone it's time to leave
		MongoClient.connect(url, function(err, db){
			if(err) throw err;
			var find_params = {
				number: req.body.From,
				leader: 1
			}
			db.collection("users").findOne(find_params, function(err, result){
				if(err) throw err;
				console.log(result.squadID);
				var find_all = {
					squadID: result.squadID,
					leader: 0
				}
				db.collection("users").find(find_all).toArray(function(err, result){
					for(x of result){
						console.log(x.number);
						client.messages.create({
							to: x.number,
							from: twilio_number,
							body: "Your squad leader has indicated that it is time to leave.\nIf you'd like to leave, reply Y. If not, reply N."
						})
						.then((message) => console.log(message.sid));
					}
				});
			});
		});
	}else if(incoming_msg.charAt(0) == '!'){
		MongoClient.connect(url, function(err, db){
			if(err) throw err;
			var find_params = {
				number: req.body.From,
				leader: 1
			}
			db.collection("users").findOne(find_params, function(err, result){
				if(err) throw err;
				console.log(result.squadID);
				var find_all = {
					squadID: result.squadID,
					leader: 0
				}
				db.collection("users").find(find_all).toArray(function(err, result){
					for(x of result){
						console.log(x.number);
						client.messages.create({
							to: x.number,
							from: twilio_number,
							body: incoming_msg
						})
						.then((message) => console.log(message.sid));
					}
				});
			});
		});
	}
	res.writeHead(200, {'Content-Type': 'text/xml'});
	res.end(twiml.toString());
});

http.createServer(app).listen(1337, () => {
	console.log('Express server listening on port 1337');
});