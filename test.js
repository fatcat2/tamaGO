// Twilio Credentials
const accountSid = process.env.twilio_sid;
const authToken = process.env.twilio_auth;

// require the Twilio module and create a REST client
const client = require('twilio')(accountSid, authToken);

client.messages
  .create({
    to: '+14087755735',
    from: '+17656370247',
    body: 'This is the ship that made the Kessel Run in fourteen parsecs?',
  })
  .then((message) => console.log(message.sid));