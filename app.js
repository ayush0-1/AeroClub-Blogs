//jshint esversion:6
import dotenv from 'dotenv'//
dotenv.config() //


import  Express  from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import _ from "lodash";
import mongoose  from "mongoose";

//s
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import GS from 'passport-google-oauth20';
import findOrCreate from "mongoose-findorcreate";

const GoogleStrategy = GS.Strategy;
//e

const app = Express();

app.set('view engine' , 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(Express.static("public"));

//s
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


//e

const homeData = "Welcome to AEROCLUB, HBTU blogs. Here you will get to know about technology and and updates regarding what's happening around the world in the field of aerospace. You will get regular updates by the articles which are composed Aeroclub content writing team, Ateam which is experienced to present you regular updates to enrich your knowledge. So for all of that and much more visit regularly."
const aboutData = "As members of AeroClub, students have the opportunity to engage in designing, fabricating, and simulating various free-flight, radio-controlled planes, and drones. To overcome the challenges of a lack of an innovative environment, an adequate platform, and ample resources, AeroClub came into existence in 2017 under the Association of Mechanical Engineering (AME) by our seniors Ravindra Kesarwani, Monica Gupta, Rahul Kumar, Shikhar Kama under Dr. S.K.S. Yadav (Assistant Prof. MED) as the club’s Convener."
const contactData = "Fat new smallness few supposing suspicion two. Course sir people worthy horses add entire suffer. How one dull get busy dare far. At principle perfectly by sweetness do. As mr started arrival subject by believe. Strictly numerous outlived kindness whatever on we no on addition"

mongoose.connect("mongodb+srv://ayushtiwari18072001:16112111@cluster0.4kfo9mg.mongodb.net/blog")


//s



const userSchema =  new mongoose.Schema({
  email: String ,
  password: String,
  googleId : String,
 
}); 
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User" , userSchema);


const postSchema = {
  title: String,
  content: String,
  composer: userSchema
}

const Post = new mongoose.model("Post" , postSchema);


passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "https://aeroclub-blogs-ek7f.onrender.com/auth/google/compose",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},

function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

//e



//s
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/compose", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/compose');
  });

//e




app.get("/" , (req , res)=>{
  Post.find()
  .then(posts=>{
    res.render("home" , {homedata: homeData , posts: posts}) ;
  })
})

app.get("/about" , (req, res)=>{
  res.render("about" , {aboutData: aboutData})
})

app.get("/contact" , (req , res)=>{
  res.render("contact" , {contactData : contactData});
})

app.get('/login' , (req , res)=>{
  res.render("login");
})
app.get('/register' , (req , res)=>{
  res.render("register");
})

app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});



app.post("/register" , (req , res)=>{
  User.register({username: req.body.username} , req.body.password , (err , user)=>{
      if(err){
          console.log(err);
          res.redirect("/login")
      }
      else{
          passport.authenticate("local")(req , res , ()=>{
              res.redirect("/compose")
          })
      }
  })
})


app.post("/login" , (req , res)=>{
  const user = new User({
      username: req.body.username,
      password: req.body.password
  });

  req.login(user , (err)=>{
      if(err){
          console.log(err);
      }
      else{
          passport.authenticate("local")(req , res , ()=>{
              res.redirect("/compose");
          })
      }
  })
})


app.get("/compose" , (req, res)=>{
  // res.render("compose" );
  if(req.isAuthenticated()){
    res.render("compose");
  }
  else{
    res.redirect("/login");
  }
})


app.post("/compose" , (req , res)=>{

  // console.log(req.body.postTitle);
  const  title =  req.body.postTitle;
  const content= req.body.postBody;
  const composer = req.user;

  console.log(composer);

  const newPost = new Post({
    title: title,
    content: content,
    composer: composer
  })
  newPost.save();
  res.redirect("/compose")
})

app.get('/post/:postTitle' , (req, res)=>{
  const requestedTitle = _.lowerCase(req.params.postTitle);

  Post.find()
  .then(posts=>{
    posts.forEach((post) => {
      const storedTitle = _.lowerCase(post.title);
      if(storedTitle===requestedTitle)
      {
        res.render('post' , 
        {
          storedTitle: storedTitle,
          storedContent: post.content
        })
      }
    });
  })
})

app.listen( process.env.PORT || "3000" , ()=>{
  console.log("server is listening on port 3000");

})
