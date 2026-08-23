const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');

const secretPath = '../client_secret_989140602013-nu51sssd0qln6d96ahmccaps6tlgc5e6.apps.googleusercontent.com.json';

if (!fs.existsSync(secretPath)) {
  console.error('Error: Could not find ' + secretPath);
  process.exit(1);
}

const keys = JSON.parse(fs.readFileSync(secretPath, 'utf8'));
const client_id = keys.web.client_id;
const client_secret = keys.web.client_secret;
const redirect_uris = keys.web.redirect_uris;

const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://mail.google.com/'],
});

console.log('\nVisit this URL to authorize the app:\n' + authUrl + '\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Enter the code from that page here: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\nAdd these to your .env file:');
    console.log('GOOGLE_CLIENT_ID=' + client_id);
    console.log('GOOGLE_CLIENT_SECRET=' + client_secret);
    console.log('GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
  } catch (err) {
    console.error('Error getting token:', err);
  }
  rl.close();
});
