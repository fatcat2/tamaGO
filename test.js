const twilio_number = '+17656370247';
var twilio_sid = process.env.twilio_sid;
var twilio_auth = process.env.twilio_auth;
const client = require('twilio')(accountSid, authToken);

client.calls.create({
  url: 'http://demo.twilio.com/docs/voice.xml',
  to: '+4087755735',
  from: twilio_number,
})
.then((call) => process.stdout.write(call.sid));