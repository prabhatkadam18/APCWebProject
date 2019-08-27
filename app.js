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

mongoose.set('useFindAndModify', false);

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
  DateCreated: Date,
  Status: String,
  Super: Boolean,
  Active: Boolean,      // Implement in Userlist
  CommunitiesJoined: mongoose.Schema.Types.ObjectId,        // Array of ->   "ObjectId("...")"
  CommunitiesOwned: mongoose.Schema.Types.ObjectId,
  CommunitiesRequested: mongoose.Schema.Types.ObjectId
});



var users = mongoose.model('users', userSchema);
var user = new Object;

//var loggedIn = 0;
//var login = require('./routes/login');


// █▀▄▀█ ░▀░ █▀▀▄ █▀▀▄ █░░ █▀▀ █░░░█ █▀▀█ █▀▀█ █▀▀
// █░▀░█ ▀█▀ █░░█ █░░█ █░░ █▀▀ █▄█▄█ █▄▄█ █▄▄▀ █▀▀
// ▀░░░▀ ▀▀▀ ▀▀▀░ ▀▀▀░ ▀▀▀ ▀▀▀ ░▀░▀░ ▀░░▀ ▀░▀▀ ▀▀▀

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

function reloadUser(){
  users.find({_id: user._id},(err,data)=>{
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
      user.DateCreated = data[0].DateCreated;
      user.Super = data[0].Super;
      user.Active = data[0].Active;
      user.Switch = 0;
      user.ProfilePic = data[0].ProfilePic;
      user.Status = data[0].Status;
      user.CommunitiesJoined = data[0].CommunitiesJoined;
      if (user.Role == 'admin' || user.Role == 'community builder')
        user.CommunitiesOwned = data[0].CommunitiesOwned;
      user.CommunitiesRequested = data[0].CommunitiesRequested;
    }
  });
}

app.use('/admin', authenticate, function checkAdmin(req, res, next) {
  if (user.Role == 'admin') {
    next();
  }
  else {
    res.send("NOT AUTHORIZED");
  }
});

var switchAdmin = function (req, res, next) {
  users.find({ _id: user._id }, (err, s) => {
    if (err) {
      console.log(err);
      throw err;
    }
    if (s[0].Role == 'admin' || s[0].Role == 'superuser') {
      if (s.length != 0) {
        if (user.Switch)
          user.Switch = 0;
        else
          user.Switch = 1;
        next();
      }
      else {
        res.redirect('/');
      }
    }
  });
}

app.get('/', (req, res) => {
  if (req.session.isLogin) {
    res.redirect('/profile');
  }
  else
    res.render('loginform');
});



//////////////////////////////////////////
//                ***                   //
//////////////////////////////////////////


app.post('/login', function (req, res) {
  console.log(req.body);
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
      user.DateCreated = data[0].DateCreated;
      user.Super = data[0].Super;
      user.Active = data[0].Active;
      user.Switch = 0;
      user.ProfilePic = data[0].ProfilePic;
      user.Status = data[0].Status;
      user.CommunitiesJoined = data[0].CommunitiesJoined;
      if (user.Role == 'admin' || user.Role == 'community builder')
        user.CommunitiesOwned = data[0].CommunitiesOwned;
      user.CommunitiesRequested = data[0].CommunitiesRequested;
      user.validate = 1;
      //console.log(user);
      res.send(user);
    }
    else {
      user.validate = 0;
      res.send(user);
    }
  });
});



app.get('/session', (req, res) => {
  if (req.session.isLogin) {
    console.log("Already Logged in");
  }
  else {
    console.log("New LOGIN");
    req.session.isLogin = 1;
    req.session.username = req.body.username;
  }
  if (user.Role.toLowerCase() == 'user' || user.Role.toLowerCase() == 'community builder') {
    res.redirect('/community/communitypanel');
  }
  else
    res.redirect('/profile');
  //res.render('home', { data: user });
});

app.get('/profile', authenticate, function (req, res) {
  //users.find()
  //console.log(user);
  res.render('home', { user: user });
});

var userExists = 0;     // 0: Does Not Exist ,   1: Exists ,   2: Created Successfully
app.get('/adduser', authenticate, function (req, res) {
  //console.log('exists = '+ exists);
  res.render('adduser', { exists: userExists, user: user });
});

app.post('/admin/adduser', function (req, res) {
  //console.log(req.body);
  userExists = 0;
  users.find({ Email: req.body.username }, (err, data) => {
    if (data.length != 0) {
      console.log("User already exists");
      //console.log(data);
      userExists = 1;
      res.redirect('/adduser');
      //exists = 0;
    }
    else {
      var obj = new Object;
      obj.Name = req.body.fullname;
      obj.Email = req.body.username.toLowerCase().trim();
      obj.Password = req.body.password;
      obj.DateCreated = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
      obj.Super = false;
      obj.Active = true;
      obj.Phone = req.body.phone;
      obj.Gender = "Male";
      obj.City = req.body.city.trim().toLowerCase();
      obj.Role = req.body.roleoptions.trim().toLowerCase();
      obj.DOB = "";
      obj.ProfilePic = "default.png";
      obj.Status = "pending";
      //obj.CommunitiesJoined = new Array();
      // if(obj.Role == 'admin' || obj.Role == 'superadmin' || obj.Role == 'community builder')
      //   obj.CommunitiesOwned = new Array();
      // obj.CommunitiesRequested = new Array();
      var tmpuser = new users(obj);
      tmpuser.save(function (err, d) {
        if (err) {
          res.send(err);
          throw err;
        }
        console.log("User Inserted");
        userExists = 2;
        delete obj;
        res.redirect('/adduser');
      });
    }
  });
  //alert("User Created Successfully!!");

});

app.get('/editprofile', authenticate, (req, res) => {
  res.render('editprofile', { user: user });
});

app.get('/edituserprofile', authenticate, (req, res) => {
  res.render('edituserprofile', { user: user });
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
  res.render('changepassword', { flag: passFlag, user: user });
});

app.post('/user/changepassword', authenticate, (req, res) => {
  //console.log(req.body);
  passFlag = 0;
  if (req.body.oldPassword == user.Password) {
    var query = { Password: user.Password, Email: user.Email };
    var newValues = { $set: { Password: req.body.newPassword } };
    users.updateOne(query, newValues, function (err, res) {
      if (err) {
        console.log(err);
        throw err;
      }
      passFlag = 1;
      console.log("Updated");
    });
    passFlag = 1;
  }
  else {
    console.log("Invalid Password");
    passFlag = 2;
  }
  res.redirect('/changepassword');
});

/////////////////////////////



/////////////////////////////
//        NODEMAILER       //

// app.get('/sendMail', authenticate, (req, res) => {
//   //console.log(user.Email);
//   res.render('sendMail', { sender: user });
// });

app.post('/sendmail', (req, res) => {    // route was /admin/send
  //console.log(req.body);
  const output = `
      <h2>Hi! This Is a Mail from ${req.body.name}</h2><br>
      <h4>Sent Message: </h4>
      <p>${req.body.body}</p>
    `;
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD
    }
  });
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

  res.send("OK");
});


//////////////////  TAG   ///////////////

var tagSchema = new mongoose.Schema({
  Name: String,
  DateCreated: String,
  Owner: mongoose.Schema.Types.ObjectId
});



var tags = mongoose.model('tags', tagSchema);

app.get('/tag',authenticate,(req,res)=>{
  res.render('tag', { user: user });
});

app.post('/createTag',(req,res)=>{
  console.log(req.body);
  var obj = new Object();
  obj.Name = req.body.tagName;
  obj.Owner = user._id;

  var y = new Date().getFullYear();
  var m = new Date().getMonth();
  var d = new Date().getDate();
  var j = y + '-' + m + '-' + d;
  obj.DateCreated = j;

// console.log(obj);
  var tmpobj = new tags(obj);
  tmpobj.save(function (err, d) {
    if (err) {
      console.log(err);
      res.send(err);
      throw err;
    }
    delete tmpobj;
    delete obj;
    console.log('tag Inserted');
    res.redirect('back');
  });
});

app.get('/tag/tagslist', authenticate , (req,res)=>{
  res.render('tagdatatable', {user: user});
});

app.post('/gettag',(req,res)=>{
  
  getdata();

  function getdata(){
    tags.countDocuments((err, count) => {
      var getcount = 10;
      var start = parseInt(req.body.start);
      var len = parseInt(req.body.length);
      var search = req.body.search.value;

      var findObj = {};
      if (search != '')
        findObj["$or"] = [{
          "Name": { '$regex': search, '$options': 'i' }
        }];
      else {
        delete findObj["$or"];
      }


      tags.find(findObj).countDocuments((err,coun)=>{
        getcount = coun;
      }).catch(err =>{
        console.error(err);
        res.send(err);
      });

      tags.find(findObj).skip(start).limit(len).sort({ ['Name']: 1 })
        .then(data=>{
          //console.log(data);
          res.send({ "recordsTotal": count, "recordsFiltered": getcount, "data": data })
        })
        .catch(err => {
          throw err;
        });

    });
  }
  
  
});

app.post('/tag/deletetag',(req,res)=>{
  console.log(req.body);
  res.send("OK");
});

/////////////////////////////////////////

//          USERLIST            //

app.get('/admin/userlist', authenticate, (req, res) => {
  res.render('userlist', { user: user });
  //console.log(obj);
});

app.post('/getusers', (req, res) => {


  if (req.body.order[0].column == 1) {
    if (req.body.order[0].dir == "asc")
      getdata("Email", 1);
    else {
      getdata("Email", -1);
    }

  }
  else if (req.body.order[0].column == 2) {
    if (req.body.order[0].dir == "asc")
      getdata("Phone", 1);
    else
      getdata("Phone", -1);
  }
  else if (req.body.order[0].column == 3) {
    if (req.body.order[0].dir == "asc")
      getdata("City", 1);
    else
      getdata("City", -1);
  }

  else {
    getdata("Email", 1);
  }

  function getdata(colname, sortorder) {
    users.countDocuments(function (e, count) {
      var start = parseInt(req.body.start);
      var len = parseInt(req.body.length);
      var role = req.body.role;
      var status = req.body.status;
      var search = req.body.search.value;
      //console.log(req.body);
      var getcount = 10;

      findobj = {};
      if (role != "All") {
        findobj.Role = role;
      }
      else {
        delete findobj["Role"];
      }

      if (status != "All") {
        findobj.Status = status;
      }
      else {
        delete findobj["Status"];
      }
      if (search != '')
        findobj["$or"] = [{
          "Email": { '$regex': search, '$options': 'i' }
        }, {
          "City": { '$regex': search, '$options': 'i' }
        }];
      else {
        delete findobj["$or"];
      }
      //console.log(findobj);

      users.find(findobj).countDocuments(function (e, coun) {
        getcount = coun;
      }).catch(err => {
        console.error(err)
        res.send(err)
      });

      users.find(findobj).skip(start).limit(len).sort({ [colname]: sortorder })
        .then(data => {
          res.send({ "recordsTotal": count, "recordsFiltered": getcount, "data": data })
        })
        .catch(err => {
          throw err;
        })
    });
  }




});

app.get('/admin/switchAsUser', authenticate, switchAdmin, (req, res) => {
  if (user.Switch == 1)
    res.redirect('/community/communitypanel');
  else
    res.redirect('/profile');
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


app.post('/updateUser', multer(multerUserConf).single('profileImage'), (req, res) => {
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
    users.updateOne({ _id: user._id }, obj, (err, data) => {
      delete obj;
      console.log("updated" + data.ProfilePic);
      res.redirect('/updateuser');
    });

  }
});

app.get('/updateuser', authenticate, (req, res) => {
  users.find({ _id: user._id }, (err, data) => {
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

app.post('/admin/updateuser', (req, res) => {
  //console.log(req.body);
  users.findOneAndUpdate({ Email: req.body.uname }, { $set: { Phone: req.body.phone, City: req.body.city.toLowerCase(), Status: req.body.status.toLowerCase(), Role: req.body.role.toLowerCase() } }, (err, data) => {
    if (err) {
      console.log(err);
      throw err;
    }
    res.send({ done: 1 });
  });

});

app.get('/admin/getcommunities', authenticate, (req, res) => {
  res.render('communitydatatable', { user: user });
  //console.log(obj);
});

app.post('/getcommunities', (req, res) => {

  // console.log("k");
  if (req.body.order[0].column == 1) {
    if (req.body.order[0].dir == "asc")
      getdata("Name", 1);
    else {
      getdata("Name", -1);
    }

  }
  else if (req.body.order[0].column == 2) {
    if (req.body.order[0].dir == "asc")
      getdata("Owner", 1);
    else
      getdata("Owner", -1);
  }
  else if (req.body.order[0].column == 2) {
    if (req.body.order[0].dir == "asc")
      getdata("Location", 1);
    else
      getdata("Location", -1);
  }

  else {
    getdata("Name", 1);
  }

  getdata("Name", 1);

  function getdata(colname, sortorder) {
    communities.countDocuments(function (e, count) {
      var start = parseInt(req.body.start);
      var len = parseInt(req.body.length);
      var rule = req.body.rule;
      var search = req.body.search.value;
      //console.log(req.body);
      var getcount = 10;

      findobj = {};
      if (rule != "All") {
        findobj.Rule = rule;
      }
      else {
        delete findobj["Rule"];
      }
      if (search != '')
        findobj["$or"] = [{
          "Name": { '$regex': search, '$options': 'i' }
        }, {
          "Location": { '$regex': search, '$options': 'i' }
        }, {
          "Owner": { '$regex': search, '$options': 'i' }
        }];
      else {
        delete findobj["$or"];
      }
      //console.log(findobj);

      communities.find(findobj).countDocuments(function (e, coun) {
        getcount = coun;
      }).catch(err => {
        console.error(err)
        res.send(err)
      });

      communities.find(findobj).skip(start).limit(len).sort({ [colname]: sortorder })
        .then(data => {
          res.send({ "recordsTotal": count, "recordsFiltered": getcount, data })
        })
        .catch(err => {
          console.error(err)
          //  res.send(error)
        })
    })
  }

});




// //////////////////////////////////////////

// █▀▀ █▀▀█ █▀▄▀█ █▀▄▀█ █░░█ █▀▀▄ ░▀░ ▀▀█▀▀ █░░█
// █░░ █░░█ █░▀░█ █░▀░█ █░░█ █░░█ ▀█▀ ░░█░░ █▄▄█
// ▀▀▀ ▀▀▀▀ ▀░░░▀ ▀░░░▀ ░▀▀▀ ▀░░▀ ▀▀▀ ░░▀░░ ▄▄▄█

// //////////////////////////////////////////


var communitySchema = new mongoose.Schema({
  Name: String,
  Owner: mongoose.Schema.Types.ObjectId,      //  ObjectId of OWNER
  CommunityPic: String,
  Rule: String,     //Direct or Permission
  Description: String,
  Location: String,
  DateCreated: String,
  Active: Boolean,
  Members: [mongoose.Schema.Types.ObjectId],
  Requests: [mongoose.Schema.Types.ObjectId]
});
var communities = mongoose.model('communities', communitySchema);


var createCommunitySuccess = 0;

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

app.get('/community/communityList', authenticate, (req, res) => {
  res.render('communitydatatable', { user: user });
});


app.get('/community/communitypanel', authenticate, (req, res) => {
  createCommunitySuccess = 0;
  communities.find({
    $or: [{ Members: { $in: [user._id] } }, { Requests: { $in: [user._id] } }]
  }, (err, comm) => {
    if (err) {
      console.log(err);
      throw err;
    }

    res.render('community/communitypanel', { user: user, data: comm });
  });
});

app.get('/community/addcommunity', authenticate, (req, res) => {
  res.render('community/addcommunity', { success: createCommunitySuccess, user: user });
});

app.post('/community/addcommunity', multer(multerCommunityConf).single('communityImage'), (req, res) => {
  createCommunitySuccess = 0;
  var obj = new Object;
  obj.Name = req.body.communityName;
  obj.Description = req.body.communityDescription;
  obj.Rule = req.body.communityMembershipRule;
  var y = new Date().getFullYear();
  var m = new Date().getMonth();
  var d = new Date().getDate();
  var j = y+'-'+m+'-'+d;
  obj.DateCreated = j;
  obj.Location = "";
  obj.Active = true;
  if (req.file) {
    obj.CommunityPic = req.file.filename;
  }
  else {
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
      users.updateOne({ _id: user._id }, { $push: { CommunitiesJoined: comm._id, CommunitiesOwned: comm._id } }, (err) => {
        delete obj;
        console.log("Community Created");
        res.redirect('/community/addcommunity');

      });
    });
  });
});

app.get('/community/list', authenticate, (req, res) => {
  communities.find({
    $and: [{ Members: { $nin: [user._id] } }, { Requests: { $nin: [user._id] } }]
  }, (err, comm) => {
    if (err) {
      console.log(err);
      throw err;
    }
    res.render('community/communitylist', { user: user, data: comm });
  });

});

app.post('/join', authenticate, (req, res) => {
  if (req.body.commType == 'join') {
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
  else {
    communities.findOneAndUpdate({ _id: req.body.id }, { $push: { Requests: user._id } }, (err, comm) => {
      if (err) {
        console.log(err);
        throw err;
      }
      users.findOneAndUpdate({ _id: user._id }, { $push: { CommunitiesRequested: comm._id } }, (err, d) => {
        if (err) {
          console.log(err);
          throw err;
        }
        res.send("OK");
      });
    });
  }
});

app.post('/cancelrequest', authenticate, (req, res) => {
  //console.log(req.body);
  communities.findOneAndUpdate({ _id: req.body.id }, { $pull: { Requests: user._id } }, (err, comm) => {
    if (err) {
      console.log(err);
      throw err;
    }
    users.findOneAndUpdate({ _id: user.id }, { $pull: { CommunitiesRequested: comm._id } }, (err, d) => {
      if (err) {
        console.log(err);
        communities.findOneAndUpdate({ _id: req.body.id }, { $push: { Requests: user._id } });
        throw err;
      }
      res.send("OK");
    });
  });
});

app.get('/community/communityprofile/:id', authenticate, (req, res) => {
  //console.log(req.param.id);
  var request = 0, currUserOwner = 0, isMember = 0;
  communities.findOne({ _id: req.params.id }, (err, comm) => {
    if (err) {
      console.log(err);
      throw err;
    }
    users.find({ CommunitiesRequested: { $in: [comm._id] } }, (err, d) => {
      if (err) {
        console.log(err);
        throw err;
      }
      if (d.length != 0) {
        request = 1;
      }
      users.findOne({ _id: comm.Owner }, (err, owner) => {
        if (err) {
          console.log(err);
          throw err;
        }
        if (owner._id.equals(user._id))
          currUserOwner = 1;
        users.find({ CommunitiesJoined: { $in: [comm._id] } }, (err, joined) => {
          if (err) {
            console.log(err);
            throw err;
          }
          communities.find({ Members: { $in: [user._id] } }, (err, data)=>{
            if(err){
              console.log(err);
              throw err;
            }
            if(data.length != 0){
              isMember = 1;
            }
            res.render('community/communityprofile', { user: user, data: comm, reqd: request, Owner: owner, currUserOwner: currUserOwner, joined: joined, isMember: isMember });
            request = 0;
            isMember = 0;
            currUserOwner = 0;
          });
        });
      });
    });
  });
});


app.get('/viewprofile/:id',(req,res)=>{
  res.render('')
});


app.post('/leavecommunity', (req, res)=>{
  communities.findOneAndUpdate({_id: req.body.id},{ $pull: { Members: user._id }} ,(err,d)=>{
    if(err){
      console.log(err);
      throw err;
    }
    users.findOneAndUpdate({_id: user._id}, { $pull: {CommunitiesJoined: d._id } }, (err,c)=>{
      if(err){
        console.log(err);
        throw err;
      }
      else{
        reloadUser();
        console.log("Left");
        res.redirect(req.get('referer'));
      }
    })
  });
});


/////////////////////////////////////////

app.get('/logout', authenticate, (req, res) => {
  req.session.destroy();
  user.Switch = 0;
  delete user;
  console.log('Logged Out');
  res.redirect('/');
});


const PORT = 2020;
app.listen(PORT, function () {
  console.log("Server running on port " + PORT);
});
