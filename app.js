require('dotenv').config();
var express = require("express");
var path = require('path');
//var fs = require('fs');
var app = express();
var session = require('express-session');

const cookeParser = require('cookie-parser');
const bodyParser = require('body-parser');

var nodemailer = require('nodemailer');

const expressValidator = require('express-validator');

app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookeParser());
app.use(session({ secret: 'abcChitkara', resave: false, saveUninitialized: true, }));
app.use(expressValidator());


//Connect with db
var mongoose = require('mongoose');
var mongoDB = 'mongodb://localhost/web';

mongoose.connect(mongoDB);

mongoose.connection.on('error', (err) => {
  console.log('DB connection Error');
});

mongoose.connection.on('connected', (err) => {
  console.log('DB connected');
});


var userSchema = new mongoose.Schema({
  Name: String,
  Email: String,
  Password: String,
  Gender: String,
  Phone: Number,
  City: String,
  Role: String,
  DOB: Date,
  Status: String
});

var users = mongoose.model('users', userSchema);
var user = new Object;

//var loggedIn = 0;
//var login = require('./routes/login');


var authenticate = function (req, res, next) {
  if (req.session.isLogin) {
    //console.log("Logged In");
    next();
  }
  else {
    console.log('User Not Logged in');
    return res.redirect('/');
  }
}

app.get('/', (req, res) => {
  if(req.session.isLogin)
    res.redirect('/profile');
  else
    res.render('loginform');
});

app.post('/login', function (req, res) {
  //console.log(req.body);
  users.find({ Email: req.body.username, Password: req.body.password }, (err, data) => {
    if (data.length == 1) {
      //console.log(data);
      user.Name = data[0].Name;
      user.Email = data[0].Email;
      user.Password = data[0].Password;
      user.Gender = data[0].Gender;
      user.Phone = data[0].Phone;
      user.City = data[0].City;
      user.valid = 1;
      //console.log(user);
      res.send(user);
    }
    else{
      user.valid = 0;
      res.send(user);
    }
  }); 
});

app.get('/session',(req, res) => {
  if (req.session.isLogin) {
    console.log("Already Logged in");
  }
  else {
    console.log("New LOGIN");
    req.session.isLogin = 1;
    req.session.username = req.body.username;
  }
  res.redirect('/profile')
  //res.render('home', { data: user });
});

app.get('/profile', authenticate, function (req, res) {
  //console.log(user);
  res.render('home', { data: user });
});

var exists = 0;     // 0: Does Not Exist ,   1: Exists ,   2: Created Successfully
app.get('/adduser', authenticate, function (req, res) {
  //console.log('exists = '+ exists);
  res.render('adduser', {exists: exists});
});

app.post('/admin/adduser', function (req, res) {
  //console.log(req.body);
  exists = 0;
  users.find({ Email: req.body.username}, (err, data) => {
    if (data.length != 0) {
      console.log("User already exists");
      //console.log(data);
      exists = 1;
      res.redirect('/adduser');
      //exists = 0;
    }
    else{
      var obj = new Object;
      obj.Name = req.body.fullname;
      obj.Email = req.body.username.toLowerCase();
      obj.Password = req.body.password;
      obj.Phone = req.body.phone;
      obj.Gender = "Male";
      obj.City = req.body.city;
      obj.Role = req.body.roleoptions;
      users.create(obj, function (err, res) {
        if (err) {
          res.send(err);
          throw err;
        }
        console.log("User Inserted");
        exists = 2;
      });
      res.redirect('/adduser');
    }
    
  });
  //alert("User Created Successfully!!");
  
});

app.get('/admin/userlist',(req,res)=>{
  res.render('userlist');
});

app.get('/admin/profile', authenticate, function (req, res) {
  //console.log(user);
  res.render('home', { data: user });
});

//    CHANGE PASSWORD     //  
var passFlag = 0;   // 0: Dont Show any alerts ,  1: Password Changed ,  2: Incorrect Password
app.get('/changepassword', authenticate, function (req, res) {
  //console.log(passFlag);
  passFlag = 0;
  res.render('changepassword',{ flag: passFlag });
});

app.post('/user/changepassword',(req,res)=>{
  //console.log(req.body);
  passFlag = 0;
  if(req.body.oldPassword == user.Password){
    var query = { Password: user.Password, Email: user.Email };
    var newValues = { $set: { Password: req.body.newPassword } };
    users.updateOne(query,newValues, function(err,res){
      if(err){
        console.log(err);
        throw err;
      }
      passFlag = 1;
      console.log("Updated");
    });
    passFlag = 1;
  }
  else{
    console.log("Invalid Password");
    passFlag = 2;
  }
  res.redirect('/changepassword');
});

/////////////////////////////



/////////////////////////////
//        NODEMAILER       //

app.get('/sendMail', authenticate, (req, res) => {
  //console.log(user.Email);
  res.render('sendMail', { reciever: user });
});

app.post('/send', (req, res) => {    // route was /admin/send
  //console.log(req.body);
  const output = `
      <h2>Hi! ${req.body.name} This Is a Mail from app.js</h2><br>
      <h4>Sent Message: <h4>
      <p>${req.body.message}</p>
    `;
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD
    }
  });
  /*
      transporter.set('oauth2_provision_cb', (user, renew, callback) => {
          let accessToken = userTokens[user];
          if (!accessToken) {
              return callback(new Error('Unknown user'));
          } else {
              return callback(null, accessToken);
          }
      });*/
  //console.log('"NODEMAILER👻" <' + process.env.EMAIL + '>');

  transporter.sendMail({
    from: '"NODEMAILER👻" <'+process.env.EMAIL+'>', // sender address
    to: user.Email, // list of receivers
    subject: req.body.subject, // Subject line
    html: output // html body
  }, function (err, res) {
    if (err)
      console.log(err);
    else {
      console.log("Email Sent");
    }
  });

  res.redirect('/profile');
});

/////////////////////////////////////////

//          USERLIST            //


app.post('/getusers',authenticate,(req,res)=>{
  users.find({},(err,data)=>{
    if(err){
      console.log(err);
      throw err;
    }
    else{
      console.log(data);
      res.send("CHECK CONSOLE");
    }
  });
});











/////////////////////////////////////////

app.get('/logout', authenticate, (req, res, next) => {
  req.session.destroy();
  console.log('Logged Out');
  res.redirect('/');
});


const PORT = 2020;
app.listen(PORT, function () {
  console.log("Server running on port " + PORT);
});
