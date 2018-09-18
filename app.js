var express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  passportLocalMongoose = require("passport-local-mongoose"),
  multer = require('multer'),
  fs = require('fs'),
  upload = multer({ dest: 'upload/' }),
  type = upload.single('recfile'),
  nodemailer = require('nodemailer'),
  post = require("./models/post"),
  user = require("./models/user");
  var pass = 'fillme';
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'helperfarmer0@gmail.com',
      pass: process.env.mailpass || pass
    }
  });

  mongoose.connect(
    process.env.DATABASEURL || "mongodb://localhost:27017/farmer",
    { useNewUrlParser: true }
  );  

  app.use(
    require("express-session")({
      secret: process.env.SECRET || "sibi",
      resave: false,
      saveUninitialized: false
    })
  );




app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());
// app.use(multer({dest:'./uploads/'}).single('photo'));

passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());
passport.use(new LocalStrategy(user.authenticate()));

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated()) {
    if(req.user.username == 'admin')
    {
      return next();
    }
    else
    {
      res.redirect("/home");
    }
  }
  else
  {
  res.redirect("/login");
  }
}

// The root that redirects to home
app.get("/", function(req, res) {
  res.redirect("/home"   );
});

//The homepage for the user
app.get("/home", function(req, res) {  
  // console.log(req.user.username);
  res.render("home" , {user1 : req.user});  
});

//Display form for a user to post a query
app.get("/query" , isLoggedIn , function(req, res) {
  res.render("query");
}
)

//Post the query to the database
app.post("/query" , type  , function(req, res) {
  
  
  var tmp_path = req.file.path;
  console.log(tmp_path);
  var target_path = 'public/img/' + req.file.originalname;
  var src = fs.createReadStream(tmp_path);
  var dest = fs.createWriteStream(target_path);
  src.pipe(dest);
  src.on('end', function() {
    
    post.create({content: req.body.sub , img: req.file.originalname , author: req.user.id } , function(err , msg)
    {
      if(err)
      {
        console.log(err);
      }
      else
      {
        console.log(msg);
        res.redirect('/home');
      }
    })
    
     });
  src.on('error', function(err) { res.render('error'); });

  
}
)

//Admin panel to view all the posted queries
app.get("/admin" , isAdmin , function(req , res)
{

  post.find({responded: false} , function(err , posts)
  {
    if(err)
    {
      console.log(err);
    }
    else
    {
      res.render("qdb" , { res: posts });
    }
  })
  
})

//Display form to Respond to the query (admin)
app.get("/response/:id" , function(req , res) {    
var postid = req.params.id;
console.log(req.params.id);
post.findById(postid).populate('author').exec(function (err , post1)
{
  if(err)
  {
    console.log(err);
  }
  else
  {

    res.render("response" , {post: post1});

  }
}
)
})

//Post the response to the database and mail the user
app.post("/response/:id" , function(req , res) {    
  var postid = req.params.id;
  post.findById(postid).populate('author').exec(function (err , post1)
  {
    if(err)
    {
      console.log(err);
    }
    else
    {
      post1.responded = true;
      post1.solution = req.body.sub;
      post1.save();
      var mailOptions = {
        from: 'helperfarmer0@gmail.com',
        to: post1.author.email ,
        subject: 'Replying to your query on farmer helper',
        text: 'hi ' + post1.author.username + ', The solution to the question you posted on our Farmer helper application is as follows : \n' + req.body.sub 
      };
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
          res.redirect("/admin");
        }
      });
      
  
    }
  }
  )
  })

//Display all the answered questions
app.get("/answers" , function(req , res) {

  post.find({responded: true}).populate('author').exec(function(err , post1)
  {
    if(err)
    {
      console.log(err);
    }
    else
    {
      res.render("answers" , {post: post1});
    }
  })

})



//Display form to register user
app.get("/register", function(req, res) {
  res.render("register", { user: req.user });
});

//Register the user
app.post("/register", function(req, res) {
  req.body.username;
  req.body.password;

  user.register(
    new user({ username: req.body.username , email: req.body.mail }),
    req.body.password,
    function(err, user) {
      if (err) {
        console.log(err);
        if (err.name == "UserExistsError") {
          return res.render("login", { userexist: true });
        }
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/home");
        });
      }
    }
  );
});



// Display login form to the user
app.get("/login", function(req, res) {

  res.render("login", { userexist: false });

});


// Logging in the user
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login"
  }),
  function(req, res) {}
);


// Log out the user
app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});




app.listen(process.env.PORT || 3000, process.env.IP, function() {
  console.log("The FarmerHelper Server Has Started!");
});


