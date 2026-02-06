const https = require('https');

const data = JSON.stringify({
  username: 't',
  password: 't'
});

const options = {
  hostname: 'chic-choux-ccbf20h.netlify.app',
  port: 443,
  path: '/api/users/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log("Attempting login to https://chic-choux-ccbf20h.netlify.app/api/users/login with user 't'...");

const req = https.request(options, res => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let responseBody = '';

  res.on('data', d => {
    responseBody += d;
  });

  res.on('end', () => {
    console.log('Response Body:', responseBody);
  });
});

req.on('error', error => {
  console.error('Error:', error);
});

req.write(data);
req.end();
