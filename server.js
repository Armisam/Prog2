const express = require('express');
const app = express();
const path = require('path');

app.use('/', express.static(path.join(__dirname, '')));
app.use(express.json());

app.post('/', function(req, res){
  console.log('Received!');
  console.log(req.body.type);
  console.log(req.body.username);
  console.log(req.body.password);
  console.log(req.body.password_confirm);
});


app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
