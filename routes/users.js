// ----- AUTHENTICATION --------
var appConfig = require('../app-config.js')
var passport = require('passport');

var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var User = require('../models/User')

//Local strategy expects to find parameters 'username' and 'passport' in the req body, but it can take in custom parameters if need be
passport.use('local',new LocalStrategy(
  function(username, password, done) {
    
    //Here, we create our own custom local strategy
    //We use custom functions from our User mongoose object to talk to the database
    //The process of our local strategy consists of
      //1. Verifying user exists
      //2. Check if password matches

    User.getUserByLocalUsername(username, function(err, user){
      if(err){
        console.log("Throwing error");
        throw err;
      }
      if(!user){
        return done(null, false, {message: 'Unknown User'});
      }

      User.comparePassword(password, user.local.password, function(err, isMatch){ //The callback function will be executed after the Mongo query
        if(err){
          console.log("Throwing error");
          throw err;
        }
        if(isMatch){
          return done(null, user);
        } else {
          return done(null, false, {message: 'Invalid password'})
        }
      });
    });
}));

passport.use('facebook', new FacebookStrategy({
  clientID        : appConfig.facebookConfig.appID,
  clientSecret    : appConfig.facebookConfig.appSecret,
  callbackURL     : appConfig.facebookConfig.callbackUrl,
  profileFields: ['id', 'displayName', 'email'] 
  },
 
  // facebook will send back the tokens and profile
  function(access_token, refresh_token, profile, done) {
    // asynchronous
    process.nextTick(function() {
     
      // find the user in the database based on their facebook id
      User.getUserByFacebookId(profile.id, function(err, user){
        // if there is an error, stop everything and return that
        // ie an error connecting to the database
        if (err)
          return done(err);
 
          // if the user is found, then log them in
          if (user) {
            return done(null, user); // user found, return that user
          } else {
            // if there is no user found with that facebook id, create them
                        
            // set all of the facebook information in our user model
            var newUser = new User();
            newUser.email = (profile.emails[0].value || '').toLowerCase();
            newUser.name = profile.displayName;
            newUser.reg_source = 'facebook';
            newUser.facebook.id = profile.id;
            newUser.facebook.token = access_token;

            User.createFacebookUser(newUser, function(err, user){
              if(err) return done(err);
              return done(null, newUser);
            });
         } 
      });
    });
}));

passport.use('google', new GoogleStrategy({
  clientID        : appConfig.googleConfig.appID,
  clientSecret    : appConfig.googleConfig.appSecret,
  callbackURL     : appConfig.googleConfig.callbackUrl,
  passReqToCallback   : true
  },
  // facebook will send back the tokens and profile
  function(request, access_token, refresh_token, profile, done) { 
    // asynchronous
    process.nextTick(function() {
      // find the user in the database based on their facebook id
      User.getUserByGoogleId(profile.id, function(err, user){
        // if there is an error, stop everything and return that
        // ie an error connecting to the database
        if (err)
          return done(err);
 
          // if the user is found, then log them in
          if (user) {
            return done(null, user); // user found, return that user
          } else {
            // if there is no user found with that facebook id, create them
                                    
            var newUser = new User();
            newUser.email = (profile.emails[0].value || '').toLowerCase();
            newUser.name = profile.displayName;
            newUser.reg_source = 'google';
            newUser.google.id = profile.id;
            newUser.google.token = access_token;

            User.createGoogleUser(newUser, function(err, user){
              if(err) return done(err);
              return done(null, newUser);
            });
         } 
      });
    });
}));


//Seriale user takes in a user object and passes the id to the callback function 'done'
passport.serializeUser(function(user,done){
  done(null, user.id);
});

//Given a user id, we search the database for the user and pass it to the callback function done
passport.deserializeUser(function(id, done){
  User.getUserById(id, function(err, user){
    done(err, user);
  });
});


// ----- ROUTING --------

var express = require('express');
var router = express.Router();

//Register page
router.get('/register', function(req, res){
  res.render('register');
});

// Login page
router.get('/login', function(req, res){
  res.render('login')
});

// Facebook login
router.get('/login/facebook',  
  passport.authenticate('facebook', { scope : 'email' })
);
 
// handle the callback after facebook has authenticated the user
router.get('/login/facebook/callback',
  passport.authenticate('facebook', {
    successRedirect : '/',
    failureRedirect : '/login',
    failureFlash: true
  })
);

// Google login
router.get('/login/google',  
  passport.authenticate('google', { scope: 
  	[ 'https://www.googleapis.com/auth/plus.login',
  	, 'https://www.googleapis.com/auth/plus.profile.emails.read' ] }
));
 
// handle the callback after Google has authenticated the user
router.get('/login/google/callback',
  passport.authenticate('google', {
    successRedirect : '/',
    failureRedirect : '/login',
    failureFlash: true
  })
);


//Register form post
router.post('/register/local', function (req, res) {
  
  //Get form fields
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var email = req.body.email;
  var username = req.body.username;
  var password1 = req.body.password1;
  var password2 = req.body.password2;

  //Form validation
  req.checkBody('firstname','First name is required').notEmpty();
  req.checkBody('lastname','Last name is required').notEmpty();
  req.checkBody('email','Email name is required').notEmpty();
  req.checkBody('password1','Password is required').notEmpty();
  req.checkBody('password2','Re-enter your password').notEmpty();
  req.checkBody('email','Not a valid email').isEmail();
  req.checkBody('password2','Passwords do not match').equals(password1);
  var errors = req.validationErrors();

  //If errors, re-render form with flash message. Otherwise, create new User object in db and redirect to home
  if(errors){
    console.log('====================================');
    console.log("REGISTER POST --- There was error in the form: ");
    console.log(JSON.stringify(errors));
    console.log('====================================');
    
    //Re-render the form with a flash message
    res.render('register', {formErrors: errors});

  } else {
    console.log('====================================');
    console.log("REGISTER POST --- Form looks good. Creating new user");
    console.log('====================================');

    //Create new user

    var newUser = new User();
    newUser.name = (firstname + " " + lastname),
    newUser.email = email;
    newUser.reg_source = 'local';
    newUser.local.username = username;
    newUser.local.password = password1;

    
    User.createLocalUser(newUser, function(err, user){
      if(err) throw err;
      console.log("User has been created: ")
      console.log(user);
    });

    req.flash('success_msg', 'You are now registered and can login');
    res.redirect('/auth/login');
  }
});

//Login form post
router.post('/login/local',
  passport.authenticate('local', {successRedirect:'/', failureRedirect:'/auth/login', failureFlash: true}),
  function(req, res){
    //If this function gets called, authentication was succesful.
    //req.user contains the authenticated user
    res.redirect('/'); 
});

router.post('login/facebook',
  passport.authenticate('facebook', {successRedirect:'/', failureRedirect:'/auth/login', failureFlash: true}),
  function(req,res){
    res.redirect('/');
});

//Logout route
router.get('/logout', function(req, res){
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/');
});

module.exports = router;