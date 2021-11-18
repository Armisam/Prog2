const express = require('express');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

app.use('/home', express.static(path.join(__dirname, '')));
app.use(express.json());

app.get('/register', function(req, res) {
  res.sendFile(path.join(__dirname, '/assets/views/register.html'));
});

app.get('/sign_in', function(req, res) {
  res.sendFile(path.join(__dirname, '/assets/views/sign_in.html'));
});

app.post('/registry', async function (req, res){
  const saltRounds = 10;
  const formData = {
    username: req.body.username,
    password: req.body.password,
    password_confirm: req.body.password_confirm
  };
  let isMatch = false;
  let hashPassword;
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
    hashPassword = await bcrypt.hash(formData.password, saltRounds);
    isMatch = await bcrypt.compare(formData.password_confirm, hashPassword);
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

        const registeredUser = {
          username: req.body.username,
          password: hashPassword,
          cart:[]
        };
        jsonData.normalusers.push(registeredUser);
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
});

var signedIn_Users = [];
app.post('/signing_in', function (req, res){
  fs.readFile('assets/json/register.json', 'utf8', async function(err, data) {
    var jsonData = JSON.parse(data);
    var isMatch = false;
    const formData = {
      username: req.body.username,
      password: req.body.password
    };

    var i = 0;
    while ( i < jsonData.normalusers.length) {
      try {
        isMatch = await bcrypt.compare(formData.password ,jsonData.normalusers[i].password)
      } catch (error) {
        console.log(error);
      }
      if (jsonData.normalusers[i].username == formData.username && isMatch) {
        if (!signedIn_Users.includes(formData.username)) {
          signedIn_Users.push(formData.username);
          console.log('Signed in as normal user!');
          return res.json({ status: 'ok', msg: 'Signed in as normal user!', username: formData.username});
        }
        else {
          console.log('User already signed in!');
          return res.json({ status: 'error;', msg: 'User already signed in!'});
        }
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
        if (!signedIn_Users.includes(formData.username)) {
          signedIn_Users.push(formData.username);
          console.log('Signed in as admin user!');
          return res.json({ status: 'ok', msg: 'Signed in as admin user!', username: formData.username});
        }
        else {
          console.log('User already signed in!');
          return res.json({ status: 'error;', msg: 'User already signed in!'});
        }
      }
      i++;
    }
    console.log('Sign in failed!');
    return res.json({ status: 'error', msg: 'Sign in failed!'});
  });
});

app.post('/signing_out', function (req, res){
  var signed_out = false;

  for( var i = 0; i < signedIn_Users.length; i++){
        if (signedIn_Users[i] == req.body.username) {
            signedIn_Users.splice(i, 1);
            signed_out = true;
        }
    }
    if (signed_out) {
      return res.json({ status: 'ok', msg: 'Signing out was succesful!'});
    }
    else {
      return res.json({ status: 'error', msg: 'Signing out was not succesful!'});
    }
});

class item {
  constructor(product_name, price, description, picture_source) {
    this.product_name = product_name;
    this.price = price;
    this.description = description;
    this.picture_source = picture_source;
  }
}

app.post('/load', function (req, res){
  fs.readFile('assets/json/register.json', 'utf8', function(err, data){
    const jsonData = JSON.parse(data);
    for (var i = 0; i < jsonData.adminusers.length; i++) {
      if (jsonData.adminusers[i].username == req.body.username) {
        return res.json(true);
      }
    }
    return res.json(false);
  });
});

app.get('/load', function (req, res){
  fs.readFile('assets/json/items.json', 'utf8', function(err, data){

    var resArray = [];
    const jsonData = JSON.parse(data);
    const total_length = Math.max(jsonData.Cameras_Photo.length,
                       jsonData.Cellphones_Accesories.length,
                       jsonData.Computers_Tablets.length,
                       jsonData.TV_Audio_Surveilance.length,
                       jsonData.Vechile_Electronics_GPS.length,
                       jsonData.Video_Games_Consoles.length);

    for (var i = 0; i < total_length; i++) {
      if (i < jsonData.Cameras_Photo.length) {
        resArray.push(new item(
          jsonData.Cameras_Photo[i].product_name,
          jsonData.Cameras_Photo[i].price,
          jsonData.Cameras_Photo[i].description,
          jsonData.Cameras_Photo[i].picture_source
        ));
        resArray[i];
      } if (i < jsonData.Cellphones_Accesories.length) {
        resArray.push(new item(
          jsonData.Cellphones_Accesories[i].product_name,
          jsonData.Cellphones_Accesories[i].price,
          jsonData.Cellphones_Accesories[i].description,
          jsonData.Cellphones_Accesories[i].picture_source
        ));
      }
      if (i < jsonData.Computers_Tablets.length) {
        resArray.push(new item(
          jsonData.Computers_Tablets[i].product_name,
          jsonData.Computers_Tablets[i].price,
          jsonData.Computers_Tablets[i].description,
          jsonData.Computers_Tablets[i].picture_source
        ));
       }
      if (i < jsonData.TV_Audio_Surveilance.length) {
         resArray.push(new item(
           jsonData.TV_Audio_Surveilance[i].product_name,
           jsonData.TV_Audio_Surveilance[i].price,
           jsonData.TV_Audio_Surveilance[i].description,
           jsonData.TV_Audio_Surveilance[i].picture_source
         ));
       }
       if (i < jsonData.Vechile_Electronics_GPS.length) {
         resArray.push(new item(
           jsonData.Vechile_Electronics_GPS[i].product_name,
           jsonData.Vechile_Electronics_GPS[i].price,
           jsonData.Vechile_Electronics_GPS[i].description,
           jsonData.Vechile_Electronics_GPS[i].picture_source
         ));
       }
       if (i < jsonData.Video_Games_Consoles.length) {
         resArray.push(new item(
           jsonData.Video_Games_Consoles[i].product_name,
           jsonData.Video_Games_Consoles[i].price,
           jsonData.Video_Games_Consoles[i].description,
           jsonData.Video_Games_Consoles[i].picture_source
         ));
       }
    }
    resArray.sort((a, b) => {
    let fa = a.product_name.toLowerCase(),
        fb = b.product_name.toLowerCase();

    if (fa < fb) {
        return -1;
    }
    if (fa > fb) {
        return 1;
    }
    return 0;
    });

    return res.json(resArray);
  });
});

app.get('/Cameras_Photo', function (req, res){
  fs.readFile('assets/json/items.json', 'utf8', function(err, data){
    const jsonData = JSON.parse(data);
    var resArray = [];
    for (var i = 0; i < jsonData.Cameras_Photo.length; i++) {
      resArray.push(new item(
        jsonData.Cameras_Photo[i].product_name,
        jsonData.Cameras_Photo[i].price,
        jsonData.Cameras_Photo[i].description,
        jsonData.Cameras_Photo[i].picture_source
      ));
    }
    resArray.sort((a, b) => {
    let fa = a.product_name.toLowerCase(),
        fb = b.product_name.toLowerCase();

    if (fa < fb) {
        return -1;
    }
    if (fa > fb) {
        return 1;
    }
    return 0;
    });

    return res.json(resArray);
  });
});
app.get('/Cellphones_Accesories', function (req, res){
  fs.readFile('assets/json/items.json', 'utf8', function(err, data){
    const jsonData = JSON.parse(data);
    var resArray = [];
    for (var i = 0; i < jsonData.Cellphones_Accesories.length; i++) {
      resArray.push(new item(
        jsonData.Cellphones_Accesories[i].product_name,
        jsonData.Cellphones_Accesories[i].price,
        jsonData.Cellphones_Accesories[i].description,
        jsonData.Cellphones_Accesories[i].picture_source
      ));
    }
    resArray.sort((a, b) => {
    let fa = a.product_name.toLowerCase(),
        fb = b.product_name.toLowerCase();

    if (fa < fb) {
        return -1;
    }
    if (fa > fb) {
        return 1;
    }
    return 0;
    });

    return res.json(resArray);
  });
});
app.get('/Computers_Tablets', function (req, res){
  fs.readFile('assets/json/items.json', 'utf8', function(err, data){
    const jsonData = JSON.parse(data);
    var resArray = [];
    for (var i = 0; i < jsonData.Computers_Tablets.length; i++) {
      resArray.push(new item(
        jsonData.Computers_Tablets[i].product_name,
        jsonData.Computers_Tablets[i].price,
        jsonData.Computers_Tablets[i].description,
        jsonData.Computers_Tablets[i].picture_source
      ));
    }
    resArray.sort((a, b) => {
    let fa = a.product_name.toLowerCase(),
        fb = b.product_name.toLowerCase();

    if (fa < fb) {
        return -1;
    }
    if (fa > fb) {
        return 1;
    }
    return 0;
    });

    return res.json(resArray);
  });
});
app.get('/TV_Audio_Surveilance', function (req, res){
  fs.readFile('assets/json/items.json', 'utf8', function(err, data){
    const jsonData = JSON.parse(data);
    var resArray = [];
    for (var i = 0; i < jsonData.TV_Audio_Surveilance.length; i++) {
      resArray.push(new item(
        jsonData.TV_Audio_Surveilance[i].product_name,
        jsonData.TV_Audio_Surveilance[i].price,
        jsonData.TV_Audio_Surveilance[i].description,
        jsonData.TV_Audio_Surveilance[i].picture_source
      ));
    }
    resArray.sort((a, b) => {
    let fa = a.product_name.toLowerCase(),
        fb = b.product_name.toLowerCase();

    if (fa < fb) {
        return -1;
    }
    if (fa > fb) {
        return 1;
    }
    return 0;
    });

    return res.json(resArray);
  });
});
app.get('/Vechile_Electronics_GPS', function (req, res){
  fs.readFile('assets/json/items.json', 'utf8', function(err, data){
    const jsonData = JSON.parse(data);
    var resArray = [];
    for (var i = 0; i < jsonData.Vechile_Electronics_GPS.length; i++) {
      resArray.push(new item(
        jsonData.Vechile_Electronics_GPS[i].product_name,
        jsonData.Vechile_Electronics_GPS[i].price,
        jsonData.Vechile_Electronics_GPS[i].description,
        jsonData.Vechile_Electronics_GPS[i].picture_source
      ));
    }
    resArray.sort((a, b) => {
    let fa = a.product_name.toLowerCase(),
        fb = b.product_name.toLowerCase();

    if (fa < fb) {
        return -1;
    }
    if (fa > fb) {
        return 1;
    }
    return 0;
    });

    return res.json(resArray);
  });
});
app.get('/Video_Games_Consoles', function (req, res){
  fs.readFile('assets/json/items.json', 'utf8', function(err, data){
    const jsonData = JSON.parse(data);
    var resArray = [];
    for (var i = 0; i < jsonData.Video_Games_Consoles.length; i++) {
      resArray.push(new item(
        jsonData.Video_Games_Consoles[i].product_name,
        jsonData.Video_Games_Consoles[i].price,
        jsonData.Video_Games_Consoles[i].description,
        jsonData.Video_Games_Consoles[i].picture_source
      ));
    }
    resArray.sort((a, b) => {
    let fa = a.product_name.toLowerCase(),
        fb = b.product_name.toLowerCase();

    if (fa < fb) {
        return -1;
    }
    if (fa > fb) {
        return 1;
    }
    return 0;
    });

    return res.json(resArray);
  });
});

app.post('/itemadd', function (req, res){
  fs.readFile('assets/json/items.json', 'utf8', function(err, data){
    const jsonData = JSON.parse(data);
    const addedItem = {
      product_name: req.body.product_name,
      picture_source: req.body.picture_source,
      price: req.body.price,
      description: req.body.description,
      category: req.body.category
    }

    switch (addedItem.category) {
      case 'Cameras_Photo':
        jsonData.Cameras_Photo.push(addedItem);
        break;
      case 'Cellphones_Accesories':
        jsonData.Cellphones_Accesories.push(addedItem);
        break;
      case 'Computers_Tablets':
        jsonData.Computers_Tablets.push(addedItem);
        break;
      case 'TV_Audio_Surveilance':
        jsonData.TV_Audio_Surveilance.push(addedItem);
        break;
      case 'Vechile_Electronics_GPS':
        jsonData.Vechile_Electronics_GPS.push(addedItem);
        break;

      default:
      jsonData.Video_Games_Consoles.push(addedItem);
    }

    const parsed = JSON.stringify(jsonData, null, 2);
    fs.writeFile('assets/json/items.json', parsed, (err) => {
      if(err) console.log(err);
      console.log('Item added!');
      return res.json({ status: 'ok', msg: 'Item added!'});
    });
  });
});

app.post('/addToCart', function (req, res){
var category = '';
  fs.readFile('assets/json/items.json', 'utf8', function(err, data){
    const jsonData = JSON.parse(data);
    const itemToSplice = req.body.product_name;
    const total_length = Math.max(jsonData.Cameras_Photo.length,
                       jsonData.Cellphones_Accesories.length,
                       jsonData.Computers_Tablets.length,
                       jsonData.TV_Audio_Surveilance.length,
                       jsonData.Vechile_Electronics_GPS.length,
                       jsonData.Video_Games_Consoles.length);

    for (var i = 0; i < total_length; i++) {
      if (i < jsonData.Cameras_Photo.length &&
      itemToSplice == jsonData.Cameras_Photo[i].product_name) {
        category = 'Cameras_Photo';
        jsonData.Cameras_Photo.splice(i, 1);
        i = total_length;
      } else if (i < jsonData.Cellphones_Accesories.length &&
      itemToSplice == jsonData.Cellphones_Accesories[i].product_name) {
        category = 'Cellphones_Accesories';
        jsonData.Cellphones_Accesories.splice(i, 1);
        i = total_length;
      } else if (i < jsonData.Computers_Tablets.length &&
      itemToSplice == jsonData.Computers_Tablets[i].product_name) {
        category = 'Computers_Tablets';
        jsonData.Computers_Tablets.splice(i, 1);
        i = total_length;
      } else if (i < jsonData.TV_Audio_Surveilance.length &&
      itemToSplice == jsonData.TV_Audio_Surveilance[i].product_name) {
        category = 'TV_Audio_Surveilance';
        jsonData.TV_Audio_Surveilance.splice(i, 1);
        i = total_length;
      } else if (i < jsonData.Vechile_Electronics_GPS.length &&
      itemToSplice == jsonData.Vechile_Electronics_GPS[i].product_name) {
        category = 'Vechile_Electronics_GPS';
        jsonData.Vechile_Electronics_GPS.splice(i, 1);
        i = total_length;
      } else if (i < jsonData.Video_Games_Consoles.length &&
      itemToSplice == jsonData.Video_Games_Consoles[i].product_name) {
        category = 'Video_Games_Consoles';
        jsonData.Video_Games_Consoles.splice(i, 1);
        i = total_length;
      }
    }

    const parsed = JSON.stringify(jsonData, null, 2);
    fs.writeFile('assets/json/items.json', parsed, (err) => {
      if(err) console.log(err);
    });

    fs.readFile('assets/json/register.json', 'utf8', function(err, data){
      const jsonData = JSON.parse(data);
      const username = req.body.username;
      const total_length = Math.max(jsonData.normalusers.length,
                         jsonData.adminusers.length);


      for (var i = 0; i < total_length; i++) {
        if (i < jsonData.normalusers.length &&
        username == jsonData.normalusers[i].username) {
          jsonData.normalusers[i].cart.push(JSON.parse(JSON.stringify({product_name: req.body.product_name,
          price: req.body.price, description: req.body.description, picture_source: req.body.picture_source, category: category})));
        } else if (i < jsonData.adminusers.length &&
        username == jsonData.adminusers[i].username) {
          jsonData.adminusers[i].cart.push(JSON.parse(JSON.stringify({product_name: req.body.product_name,
          price: req.body.price, description: req.body.description, picture_source: req.body.picture_source, category: category})));
        }
      }


      const parsed = JSON.stringify(jsonData, null, 2);
      fs.writeFile('assets/json/register.json', parsed, (err) => {
        if(err) console.log(err);
          console.log('Item added to cart!');
          return res.json({ status: 'ok', msg: 'Item added to cart!'});
      });
    });
  });
});

app.post('/showCart', function (req,res){
  fs.readFile('assets/json/register.json', 'utf8', function(err, data){

    var resArray = [];
    const jsonData = JSON.parse(data);

    const username = req.body.username;
    const total_length = Math.max(jsonData.normalusers.length,
                       jsonData.adminusers.length);

    for (var i = 0; i < total_length; i++) {
      if (i < jsonData.normalusers.length &&
      username == jsonData.normalusers[i].username) {
        const cart = jsonData.normalusers[i].cart;
        if (cart.length == 0) {
          return res.json({ status: 'error', msg: 'Your cart is empty!'});
        }
        for (var j = 0; j < cart.length; j++) {
          resArray.push(cart[j]);
        }
      } else if (i < jsonData.adminusers.length &&
      username == jsonData.adminusers[i].username) {
        const cart = jsonData.adminusers[i].cart;
        if (cart.length == 0) {
          return res.json({ status: 'error', msg: 'Your cart is empty!'});
        }
        for (var j = 0; j < cart.length; j++) {
          resArray.push(cart[j]);
        }
      }
    }
      return res.json(resArray);
  });
});

app.post('/removeFromCart', function (req, res){
    fs.readFile('assets/json/register.json', 'utf8', function(err, data){
      const jsonData = JSON.parse(data);
      const username = req.body.username;
      const product_name = req.body.product_name;
      let category = '';
      const total_length = Math.max(jsonData.normalusers.length,
                         jsonData.adminusers.length);


      for (var i = 0; i < total_length; i++) {
         if (i < jsonData.normalusers.length &&
         username == jsonData.normalusers[i].username) {
           const cart = jsonData.normalusers[i].cart;
           if (cart.length == 0) {
             return res.json({ status: 'error', msg: 'Your cart is empty!'});
           }
           for (var j = 0; j < cart.length; j++) {
             if (cart[j].product_name == product_name) {
                 category = cart[j].category;
                jsonData.normalusers[i].cart.splice(j, 1);
                j = cart.length;
                i = total_length;
             }
           }
         } else if (i < jsonData.adminusers.length &&
           username == jsonData.adminusers[i].username) {
             const cart = jsonData.adminusers[i].cart;
             if (cart.length == 0) {
               return res.json({ status: 'error', msg: 'Your cart is empty!'});
             }
             for (var j = 0; j < cart.length; j++) {
               if (cart[j].product_name == product_name) {
                  category = cart[j].category;
                  jsonData.adminusers[i].cart.splice(j, 1);
                  j = cart.length;
                  i = total_length;
               }
             }
          }
       }


      const parsed = JSON.stringify(jsonData, null, 2);
      fs.writeFile('assets/json/register.json', parsed, (err) => {
        if(err) console.log(err);
      });

      fs.readFile('assets/json/items.json', 'utf8', function(err, data){
        const jsonData = JSON.parse(data);
        const itemToAdd = req.body.product_name;
        const total_length = Math.max(jsonData.Cameras_Photo.length,
                           jsonData.Cellphones_Accesories.length,
                           jsonData.Computers_Tablets.length,
                           jsonData.TV_Audio_Surveilance.length,
                           jsonData.Vechile_Electronics_GPS.length,
                           jsonData.Video_Games_Consoles.length);

        for (var i = 0; i < total_length; i++) {
          if (i < jsonData.Cameras_Photo.length && category == 'Cameras_Photo') {
            jsonData.Cameras_Photo.push(JSON.parse(JSON.stringify({product_name: req.body.product_name,
              price: req.body.price, description: req.body.description, picture_source: req.body.picture_source})));
            i = total_length;
          } else if (i < jsonData.Cellphones_Accesories.length && category == 'Cellphones_Accesories') {
            jsonData.Cellphones_Accesories.push(JSON.parse(JSON.stringify({product_name: req.body.product_name,
              price: req.body.price, description: req.body.description, picture_source: req.body.picture_source})));
            i = total_length;
          } else if (i < jsonData.Computers_Tablets.length && category == 'Cellphones_Accesories') {
            jsonData.Computers_Tablets.push(JSON.parse(JSON.stringify({product_name: req.body.product_name,
              price: req.body.price, description: req.body.description, picture_source: req.body.picture_source})));
            i = total_length;
          } else if (i < jsonData.TV_Audio_Surveilance.length && category == 'TV_Audio_Surveilance') {
            jsonData.TV_Audio_Surveilance.push(JSON.parse(JSON.stringify({product_name: req.body.product_name,
              price: req.body.price, description: req.body.description, picture_source: req.body.picture_source})));
            i = total_length;
            console.log(jsonData.product_name);
          } else if (i < jsonData.Vechile_Electronics_GPS.length && category == 'Vechile_Electronics_GPS') {
            jsonData.Vechile_Electronics_GPS.push(JSON.parse(JSON.stringify({product_name: req.body.product_name,
              price: req.body.price, description: req.body.description, picture_source: req.body.picture_source})));
            i = total_length;
          } else if (i < jsonData.Video_Games_Consoles.length && category == 'Video_Games_Consoles') {
            jsonData.Video_Games_Consoles.push(JSON.parse(JSON.stringify({product_name: req.body.product_name,
              price: req.body.price, description: req.body.description, picture_source: req.body.picture_source})));
            i = total_length;
          }
        }

      const parsed = JSON.stringify(jsonData, null, 2);
      fs.writeFile('assets/json/items.json', parsed, (err) => {
        if(err) console.log(err);
        console.log('Item removed from cart!');
        return res.json({ status: 'ok', msg: 'Item removed from cart!'});
      });
    });
  });
});

app.listen(3000, function () {
  console.log('Prog2 app listening on port 3000!');
});
