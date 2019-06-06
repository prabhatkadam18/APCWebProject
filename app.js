require('dotenv').config();
var express = require("express");
var path = require('path');
//var fs = require('fs');
var app = express();
var session = require('express-session');

const cookeParser = require('cookie-parser');
const bodyParser = require('body-parser');

var nodemailer = require('nodemailer');
var multer = require('multer');

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
  DOB: String,
  ProfilePic: String,
  Status: String,
  CommunitiesJoined: mongoose.Schema.Types.ObjectId,        // Array of ->   "ObjectId("...")"
  CommunitiesOwned: mongoose.Schema.Types.ObjectId,
  CommunitiesRequested: mongoose.Schema.Types.ObjectId
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
  if(req.session.isLogin){
    res.redirect('/profile');
  }
  else
    res.render('loginform');
});

app.post('/login', function (req, res) {
  //console.log(req.body);
  users.find({ Email: req.body.username, Password: req.body.password }, (err, data) => {
    if (data.length == 1) {
      //console.log(data);
      user._id = data[0]._id;
      user.Name = data[0].Name;
      user.Email = data[0].Email;
      user.Password = data[0].Password;
      user.Gender = data[0].Gender;
      user.Phone = data[0].Phone;
      user.City = data[0].City;
      user.Role = data[0].Role;
      user.DOB = data[0].DOB;
      user.ProfilePic = data[0].ProfilePic;
      user.Status = data[0].Status;
      user.CommunitiesJoined = data[0].CommunitiesJoined;
      if (user.Role == 'admin' || user.Role == 'superadmin' || user.Role == 'community builder')
        user.CommunitiesOwned = data[0].CommunitiesOwned;
      user.CommunitiesRequested = data[0].CommunitiesRequested;
      user.validate = 1;
      //console.log(user);
      res.send(user);
    }
    else{
      user.validate = 0;
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
  if(user.Role.toLowerCase() == 'user' || user.Role.toLowerCase()== 'community builder'){
    res.redirect('/community/communitypanel');
  }
  else
    res.redirect('/profile');
  //res.render('home', { data: user });
});

app.get('/profile', authenticate, function (req, res) {
  users.find()
  //console.log(user);
  res.render('home', { user: user });
});

var userExists = 0;     // 0: Does Not Exist ,   1: Exists ,   2: Created Successfully
app.get('/adduser', authenticate, function (req, res) {
  //console.log('exists = '+ exists);
  res.render('adduser', {exists: userExists, user: user});
});

app.post('/admin/adduser', function (req, res) {
  //console.log(req.body);
  userExists = 0;
  users.find({ Email: req.body.username}, (err, data) => {
    if (data.length != 0) {
      console.log("User already exists");
      //console.log(data);
      userExists = 1;
      res.redirect('/adduser');
      //exists = 0;
    }
    else{
      var obj = new Object;
      obj.Name = req.body.fullname;
      obj.Email = req.body.username.toLowerCase().trim();
      obj.Password = req.body.password;
      obj.Phone = req.body.phone;
      obj.Gender = "Male";
      obj.City = req.body.city.trim().toLowerCase();
      obj.Role = req.body.roleoptions.trim().toLowerCase();
      obj.DOB = "";
      obj.ProfilePic = "default.png";
      obj.Status = "Pending";
      obj.CommunitiesJoined = [];
      if(obj.Role == 'admin' || obj.Role == 'superadmin' || obj.Role == 'community builder')
        obj.CommunitiesOwned = [];
      obj.CommunitiesRequested = [];
      users.create(obj, function (err, res) {
        if (err) {
          res.send(err);
          throw err;
        }
        console.log("User Inserted");
        userExists = 2;
      });
      delete obj;
      res.redirect('/adduser');
    }
    
  });
  //alert("User Created Successfully!!");
  
});

app.get('/editprofile',authenticate,(req,res)=>{
  res.render('editprofile',{user: user});
});

app.get('/edituserprofile',authenticate,(req,res)=>{
  res.render('edituserprofile',{user: user});
})

app.get('/admin/profile', authenticate, function (req, res) {
  //console.log(user);
  res.render('home', { data: user });
});

//    CHANGE PASSWORD     //  
var passFlag = 0;   // 0: Dont Show any alerts ,  1: Password Changed ,  2: Incorrect Password
app.get('/changepassword', authenticate, function (req, res) {
  //console.log(passFlag);
  passFlag = 0;
  res.render('changepassword',{ flag: passFlag, user: user });
});

app.post('/user/changepassword',authenticate,(req,res)=>{
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
  res.render('sendMail', { sender: user });
});

app.post('/send', (req, res) => {    // route was /admin/send
  //console.log(req.body);
  const output = `
      <h2>Hi! This Is a Mail from ${req.body.name}</h2><br>
      <h4>Sent Message: </h4>
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
    from: `"NodeMailer"<${user.Email}>`, // sender address
    to: req.body.to, // list of receivers
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

app.get('/admin/userlist', authenticate,(req, res) => {
  res.render('userlist',{user: user});
  //console.log(obj);
});

app.post('/getusers',(req,res)=>{
  var obj = new Object;
  var arr = new Array;
  users.find((err,result)=>{
    if(err){
      console.log(err);
      throw err;
    }
    obj.recordsTotal = result.length;
    obj.recordsFiltered = result.length;
    //console.log(res);
    for(var i= 0;i<result.length; i++)
    {
      arr[i] = new Object;
      arr[i]._id = result[i]._id;
      arr[i].Email = (result[i].Email);
      arr[i].Phone = (result[i].Phone);
      arr[i].City = (result[i].City);
      arr[i].Status = (result[i].Status);
      arr[i].Role = (result[i].Role);
      arr[i].Actions = null;
    }
    obj.data = arr;
    console.log(obj);
    res.send(obj);
    //console.log(arr);
  });
  //res.send(obj);
 
});





//////////////////////////////////////////


const multerUserConf = {
  storage: multer.diskStorage({
    destination: function (req, file, next) {
      next(null, './public/upload/Profile');
    },
    filename: function (req, file, next) {
      const ext = file.mimetype.split('/')[1];
      next(null, file.fieldname + '-' + Date.now() + '.' + ext);
      //console.log(file);
    }
  }),
  fileFilter: function (req, file, next) {
    if (!file) {
      next();
    }
    const image = file.mimetype.startsWith('image/');
    if (image) {
      next(null, true);
    }
    else {
      next({ message: "File not Supported" }, false);
    }
  }
};


app.post('/updateUser',multer(multerUserConf).single('profileImage'),(req,res)=>{
  if (req.file) {
    //console.log(req.file.filename);
    var obj = new Object;
    obj.Name = req.body.fullname;
    obj.Gender = req.body.gender;
    obj.Phone = req.body.phone;
    obj.City = req.body.city;
    obj.Interests = req.body.interests;
    obj.AboutJourney = req.body.aboutjourney;
    obj.ComExpectations = req.body.comExpectations;
    obj.ProfilePic = req.file.filename;
    users.updateOne({ _id: user._id },obj,(err,data)=>{
      delete obj;
      console.log("updated" + data.ProfilePic );
      res.redirect('/updateuser');
    });
    //users.updateOne({_id: user.id},{ $set: { ProfilePic: req.file.filename }});
    
  }
});

app.get('/updateuser', authenticate,(req,res)=>{
  users.find({_id: user._id},(err,data)=>{
    user.Name = data[0].Name;
    user.Password = data[0].Password;
    user.Gender = data[0].Gender;
    user.Phone = data[0].Phone;
    user.City = data[0].City;
    user.DOB = data[0].DOB;
    user.ProfilePic = data[0].ProfilePic;
    user.Status = data[0].Status;
    user.CommunitiesJoined = data[0].CommunitiesJoined;
    user.CommunitiesOwned = data[0].CommunitiesOwned;
    user.CommunitiesRequested = data[0].CommunitiesRequested;
    res.redirect('/profile');
  });
});



// //////////////////////////////////////////

// █▀▀ █▀▀█ █▀▄▀█ █▀▄▀█ █░░█ █▀▀▄ ░▀░ ▀▀█▀▀ █░░█
// █░░ █░░█ █░▀░█ █░▀░█ █░░█ █░░█ ▀█▀ ░░█░░ █▄▄█
// ▀▀▀ ▀▀▀▀ ▀░░░▀ ▀░░░▀ ░▀▀▀ ▀░░▀ ▀▀▀ ░░▀░░ ▄▄▄█

// //////////////////////////////////////////


var communitySchema = new mongoose.Schema({
  Name: String,
  Owner: String,      //  ObjectId of OWNER
  CommunityPic: String,
  Rule: String,     //Direct or Permission
  Description: String,
  Members: [ mongoose.Schema.Types.ObjectId ],
  Requests: [ mongoose.Schema.Types.ObjectId ]
});
var communities = mongoose.model('communities', communitySchema);

var createCommunitySuccess = 0;
app.get('/community/communitypanel',authenticate,(req,res)=>{
  createCommunitySuccess = 0;  
  communities.find({
    $or: [{ Members: { $in: [user._id] } }, { Requests: { $in: [user._id]}}]}, (err,comm)=>{
    if(err){
      console.log(err);
      throw err;
    } 
    // for(var i=0;i <comm.length;i++)
    // {
    //   for(var j =0;j<comm[i].Members.length;j++)
    //   {
    //     comm[i].Members[j].id = comm[i].Members[j]._id;
    //     if (comm[i].Members[j].id.equals(user._id))
    //       console.log("Y");
    //   }  
    // }
    // for (var i = 0; i < comm.length; i++) {
    //   for (var j = 0; j < comm[i].Requests.length; j++) {
    //     comm[i].Requests[j].id = comm[i].Requests[j]._id;
    //   }
    // }
    res.render('community/communitypanel', { user: user, data: comm });
  });
});

const multerCommunityConf = {
  storage: multer.diskStorage({
    destination: function (req, file, next) {
      next(null, './public/upload/Community/');
    },
    filename: function (req, file, next) {
      const ext = file.mimetype.split('/')[1];
      next(null, file.fieldname + '-' + Date.now() + '.' + ext);
      //console.log(file);
    }
  }),
  fileFilter: function (req, file, next) {
    if (!file) {
      next();
    }
    const image = file.mimetype.startsWith('image/');
    if (image) {
      next(null, true);
    }
    else {
      next({ message: "File not Supported" }, false);
    }
  }
};


app.get('/community/addcommunity',authenticate,(req,res)=>{
  res.render('community/addcommunity', {success: createCommunitySuccess, user: user });
});


app.post('/community/addcommunity', multer(multerCommunityConf).single('communityImage'),(req,res)=>{
  createCommunitySuccess = 0;
  var obj = new Object;
  obj.Name = req.body.communityName;
  obj.Description = req.body.communityDescription;
  obj.Rule = req.body.communityMembershipRule;
  if (req.file) {
    obj.CommunityPic = req.file.filename;
  }
  else{
    obj.CommunityPic = 'default.jpg';
  }
  obj.Owner = user._id;

  communities.create(obj, (err, comm) => {
    if (err) {
      console.log(err);
      throw err;
    }
    communities.updateOne({ _id: comm._id }, { $push: { Members: user._id } }, () => {
      createCommunitySuccess = 1;
      users.updateOne({_id: user._id}, { $push: { CommunitiesJoined: comm._id , CommunitiesOwned: comm._id}},(err)=>{
        delete obj;
        console.log("Community Created");
        res.redirect('/community/addcommunity');
    
      });
    });
  });
});


app.get('/community/list',authenticate,(req,res)=>{
  communities.find({
    $and: [{ Members: { $nin: [user._id] } }, { Requests: { $nin: [user._id] } }]
  },(err,comm)=>{
    if(err){
      console.log(err);
      throw err;
    }
    res.render('community/communitylist', { user: user, data: comm });
  });
  
});

app.post('/join',(req,res)=>{
  if(req.body.commType == 'join'){
    communities.findOneAndUpdate({ _id: req.body.id }, { $push: { Members: user._id } }, (err, comm) => {
      if (err) {
        console.log(err);
        throw err;
      }
      users.findOneAndUpdate({ _id: user._id }, { $push: { CommunitiesJoined: comm._id } }, (err, d) => {
        res.send("OK");
      });
    }); 
  }
  else{
    communities.findOneAndUpdate({ _id: req.body.id }, { $push: { Requests: user._id } }, (err, comm) => {
      if (err) {
        console.log(err);
        throw err;
      }
      users.findOneAndUpdate({ _id: user._id }, { $push: { CommunitiesRequested: comm._id } }, (err, d) => {
        res.send("OK");
      });
    });
  }
});




/////////////////////////////////////////

app.get('/logout', authenticate, (req, res, next) => {
  req.session.destroy();
  delete user;
  console.log('Logged Out');
  res.redirect('/');
});


const PORT = 2020;
app.listen(PORT, function () {
  console.log("Server running on port " + PORT);
});
