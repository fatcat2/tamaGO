const twilio_number = '+17656370247';
var twilio_sid = process.env.twilio_sid;
var twilio_auth = process.env.twilio_auth;
const client = require('twilio')(twilio_sid, twilio_auth);

client.calls.create({
  url: 'https://handler.twilio.com/twiml/EHb4eebdcb8f5f7a35efb023551586619e',
  to: '+14087755735',
  from: twilio_number,
})
.then((call) => process.stdout.write(call.sid));