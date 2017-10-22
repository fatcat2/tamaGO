const http = require('http');
const express = require('express');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const language  = require('@google-cloud/language');


const app = express();
var bodyParser = require('body-parser');
var client = new language.LanguageServiceClient();
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
	var document = {
		content: incoming_msg,
		type: 'PLAIN_TEXT'
	}
	client.analyzeEntities({document: document})
		.then(responses => {
			var response = responses[0];
			console.log(response);
		})
	twiml.message("Are you in a group? (yes/no)");
	console.log(incoming_msg);
	res.writeHead(200, {'Content-Type': 'text/xml'});
	res.end(twiml.toString());
});

http.createServer(app).listen(1337, () => {
	console.log('Express server listening on port 1337');
});