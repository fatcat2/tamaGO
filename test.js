const twilio_number = '+17656370247';
var twilio_sid = process.env.twilio_sid;
var twilio_auth = process.env.twilio_auth;
const client = require('twilio')(twilio_sid, twilio_auth);

client.calls.create({
  url: 'http://demo.twilio.com/docs/voice.xml',
  to: '+14087755735',
  from: twilio_number,
})
.then((call) => process.stdout.write(call.sid));