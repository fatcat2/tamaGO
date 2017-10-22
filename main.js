const http = require('http');
const express = require('express');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const MongoClient = require('mongodb').MongoClient;
const randomstring = require("randomstring");

var twilio_sid = process.env.twilio_sid;
var twilio_auth = process.env.twilio_auth;
const twilio = require('twilio');
const client = new twilio(twilio_sid, twilio_auth);

var url = process.env.mongo_uri;
var twilio_sid = process.env.twilio_sid;
var twilio_auth = process.env.twilio_auth;

const twilio_number = '+17656370247';

const app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({	extended: true }));

app.post('/message', (req, res) => {
	const twiml = new MessagingResponse();
	var incoming_msg = req.body.Body;
	// console.log(req.body);
	if(incoming_msg == 'tamago!'){
		var str = randomstring.generate({
			length: 4,
			charset: 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789',
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
	}else if(incoming_msg == '!end'){
		MongoClient.connect(url, function(err, db){
			if (err) throw err;
			var find_params = {
				number: req.body.From,
				leader: 1
			}
			db.collection("users").findOne(find_params, function(err, result){
				if (err) throw err;
				sqID = result.squadID;
				var document = {
					number: req.body.From,
					squadID: sqID,
				}
				db.collection(sqID).find({}).toArray(function(err, res){
					var d = 0;
					var message = "";
					var yeses = 0;
					var nos = 0;
					for(x of res){
						d++;
						if(x.vote == 'Y'){
							yeses++;
						}else if(x.vote == 'N'){
							nos++;
						}
					}
					var total = yeses+nos;
					var yes_percentage = yeses/total;
					var no_percentage = 1 - yes_percentage;
					if(yes_percentage >= no_percentage){
						message = "Alright, let's wrap it up!";
					}else if(yes_percentage < no_percentage){
						message = "We're still on!";
					}
					for(x of res){
						client.messages.create({
							to: x.number,
							from: twilio_number,
							body: message
						})
					}
					console.log("inside" + message);
				});
			});
		});
	}else if(incoming_msg == '!recall'){
		console.log("recall");
		MongoClient.connect(url, function(err, db){
			if (err) throw err;
			var find_params = {
				number: req.body.From,
				leader: 1
			}
			db.collection("users").findOne(find_params, function(err, result){
				if (err) throw err;
				sqID = result.squadID;
				var document = {
					number: req.body.From,
					squadID: sqID,
				}
				db.collection(sqID).find({}).toArray(function(err, res){
					for(x of res){
						client.calls.create({
							url: 'https://handler.twilio.com/twiml/EHb4eebdcb8f5f7a35efb023551586619e',
							to: x.number,
							from: twilio_number
						})
					}
				});
			});
		});
	}else if(incoming_msg == 'Y' || incoming_msg == 'N'){
		//as results come in, compare size of temp collection to number of members in squad.
		//find squadID first
		MongoClient.connect(url, function(err, db){
			if (err) throw err;
			var sqID = "";
			var find_params = {
				number: req.body.From
			}
			db.collection("users").findOne(find_params, function(err, result){
				if (err) throw err;
				sqID = result.squadID;
				console.log(sqID);
				var document = {
					number: req.body.From,
					squadID: sqID,
					vote: incoming_msg
				}
				db.collection("squads").find({squadID: sqID}, {$exists: true}).toArray(function(err, res){
					if (err) throw err;
					console.log(res);
					if(res.length != 0){
						console.log(document);
						db.collection(sqID).insertOne(document, function(err, buf){
							if (err) throw err;
							console.log("Number " + req.body.From + " has responded!");
						});
					}else{
						twiml.message("Your squad's poll hasn't opened yet");
					}
				});
			});
		});
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
	}else if(incoming_msg == '!goodbye'){
		MongoClient.connect(url, function(err, db){
			if (err) throw err;
			var find_params = {
				number: req.body.From,
				leader: 1
			}
			db.collection("users").findOne(find_params, function(err, result){
				if (err) throw err;
				sqID = result.squadID;
				var document = {
					number: req.body.From,
					squadID: sqID,
				}
				db.collection('users').deleteMany({squadID: sqID}, function(err, res){
					if (err) throw err;
					console.log(res.result. n + " objects deleted");
				});
				db.collection('squads').deleteMany({squadID: sqID}, function(err, res){
					if (err) throw err;
					console.log(res.result.n + " objects deleted");
				});
				db.close();
			});
		});
	}else if(incoming_msg == '!leave'){
		//text everyone it's time to leave
		var squad_count = 1;
		var squad_ID_big = "";
		MongoClient.connect(url, function(err, db){
			if(err) throw err;
			var find_params = {
				number: req.body.From,
				leader: 1
			}
			db.collection("users").findOne(find_params, function(err, result){
				if(err) throw err;
				// console.log(result.squadID);
				squad_ID_big = result.squadID;
				var counter = 1;
				var find_all = {
					squadID: result.squadID,
					leader: 0
				}
				db.collection("users").find(find_all).toArray(function(err, res){
					for(x of res){
						// console.log(x.number);	
						counter = counter + 1;
						// console.log(counter);
						client.messages.create({
							to: x.number,
							from: twilio_number,
							body: "Your squad leader has indicated that it is time to leave.\nIf you'd like to leave, reply Y. If not, reply N."
						})
						// .then((message) => console.log(message.sid));
					}
					console.log("Poll started! Squad: " + squad_ID_big + " has " + counter + " members.");
					var x = {
						squadID: squad_ID_big,
						squadCount: counter
					}
					db.collection("squads").insertOne(x, function(err, res){
						if (err) throw err;
						// console.log(x);
						// console.log("Poll started! Squad: " + squad_info.squadID + " has " + squad_count + " members.");
					});
				});
				// squad
			});
		});
		//get number of members in squad and squadID
		var squad_info = {
			squadID: squad_ID_big,
			squadCount: squad_count
		}

		//add squadID and number of members in squad to squads collection
		MongoClient.connect(url, function(err, db){
			if (err) throw err;
			db.collection("squads").insertOne(squad_info, function(err, res){
				if (err) throw err;
				console.log(squad_info);
				// console.log("Poll started! Squad: " + squad_info.squadID + " has " + squad_count + " members.");
			});
		});
		//as results come in, compare size of temp collection to number of members in squad.
		//when the two are equal, calculate then report results through text
		//have leader be able to !callback remaining members
	}else if(incoming_msg.charAt(0) == '!'){
		MongoClient.connect(url, function(err, db){
			if(err) throw err;
			var find_params = {
				number: req.body.From,
				leader: 1
			}
			db.collection("users").findOne(find_params, function(err, result){
				if(err) throw err;
				// console.log(result.squadID);
				var find_all = {
					squadID: result.squadID
					// leader: 0
				}
				db.collection("users").find(find_all).toArray(function(err, result){
					// var len = incoming_msg.length;
					var msg = incoming_msg.substring(1)
					for(x of result){
						console.log(x.number);
						client.messages.create({
							to: x.number,
							from: twilio_number,
							body: msg
						})
					}
					// console.log("Sent following message to group " + result[0].squadID + ":\n" + incoming_msg + "\n---------\n");
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