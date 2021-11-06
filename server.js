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
  const formData = {
    username: req.body.username,
    password: req.body.password,
  };

  if (type == 'register') {
    const password_confirm = req.body.password_confirm;
    let isMatch = false;
    if (formData.password.length < 8) {
      console.log('Password is shorter than 8 characters!');
      return res.json({ status: 'error', msg: 'Password is shorter than 8 characters!'});
    }
    else if (formData.password.toUpperCase() == formData.password) {
      console.log('Password is does not contain lowercase character!');
      return res.json({ status: 'error', msg: 'Password is does not contain lowercase character!'});
    }
    else if (formData.password.toLowerCase() == formData.password) {
      console.log('Password is does not contain uppercase character!');
      return res.json({ status: 'error', msg: 'Password is does not contain uppercase character!'});
    }
    else if (formData.password.search(/\d/) == -1) {
      console.log('Password is does not contain numeric character!');
      return res.json({ status: 'error', msg: 'Password is does not contain numeric character!'});
    }

    try {
      const hashPassword = await bcrypt.hash(formData.password, saltRounds);
      isMatch = await bcrypt.compare(password_confirm, hashPassword);
    } catch (error) {
      console.log(error);
    }
      if (isMatch) {
        fs.readFile('assets/json/register.json', 'utf8', function(err, data) {
          var jsonData = JSON.parse(data);
          for (var i = 0; i < jsonData.normalusers.length; i++) {
            if (jsonData.normalusers[i].username == formData.username) {
              console.log('User already exists!');
              return res.json({ status: 'error', msg: 'User already exists!'});
            }
          }
          for (var i = 0; i < jsonData.adminusers.length; i++) {
            if (jsonData.adminusers[i].username == formData.username) {
              console.log('User already exists!');
              return res.json({ status: 'error', msg: 'User already exists!'});
            }
          }
          formData.password = hashPassword;
          jsonData.normalusers.push(formData);
          const parsed = JSON.stringify(jsonData, null, 2);
          fs.writeFile('assets/json/register.json', parsed, (err) => {
            if(err) console.log(err);
            console.log('User added!');
            return res.json({ status: 'ok', msg: 'User added!'});
          });
        });
      }
      else {
        console.log('Not matching passwords!');
        return res.json({ status: 'error', msg: 'Not matching passwords!'});
      }
  }
  else {
    fs.readFile('assets/json/register.json', 'utf8', async function(err, data) {
      var jsonData = JSON.parse(data);
      var isMatch = false;

      var i = 0;
      while ( i < jsonData.normalusers.length) {
        try {
          isMatch = await bcrypt.compare(formData.password ,jsonData.normalusers[i].password)
        } catch (error) {
          console.log(error);
        }
        if (jsonData.normalusers[i].username == formData.username && isMatch) {
          console.log('Signed in as normal user!');
          return res.json({ status: 'ok', msg: 'Signed in as normal user!'});
        }
        i++;
      }
      i = 0;
      isMatch = false;
      while ( i < jsonData.adminusers.length) {
        try {
          isMatch = await bcrypt.compare(formData.password ,jsonData.adminusers[i].password)
        } catch (error) {
          console.log(error);
        }
        if (jsonData.adminusers[i].username == formData.username && isMatch) {
          console.log('Signed in as admin user!');
          return res.json({ status: 'ok', msg: 'Signed in as admin user!'});
        }
        i++;
      }
      console.log('Sign in failed!');
      return res.json({ status: 'ok', msg: 'Sign in failed!'});
    });
  }
});


app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
