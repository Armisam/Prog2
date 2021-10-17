const express = require('express');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

app.use('/', express.static(path.join(__dirname, '')));
app.use(express.json());

app.post('/', async function (req, res){
  const saltRounds = 10;
  const type = req.body.type;
  const username = req.body.username;
  const password = req.body.password;
  const password_confirm = req.body.password_confirm;

  try {
    const hashPassword = await bcrypt.hash(password, saltRounds);
    const isMatch = await bcrypt.compare(password_confirm, hashPassword)

    if (isMatch) {
      const reg_json = JSON.stringify(
        {
          username: username,
          password: hashPassword
        }, null, '\t');

      fs.appendFile('assets/json/register.json', reg_json, err => {
        if (err) {
          console.log(err);
        }
        console.log('User added: ' + username);
      });
      fs.appendFile('assets/json/register.json', '\n', err => {if(err){console.log(err);}})
    return res.json({ status: 'OK', msg: 'User added! ' + username});
    }
    else {
      console.log('Not matching password!');
      return res.json({ status: 'error', msg: 'Not matching password!'});
    }

  } catch (error) {
    console.log(error);
  }
});


app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
