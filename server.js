const express = require('express');
const app = express();

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.get('/register', function (req, res) {
  res.sendFile(__dirname + '/register.html');
});
app.get('/sign_in', function (req, res) {
  res.sendFile(__dirname + '/sign_in.html');
});



app.use(express.static('assets'));

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
