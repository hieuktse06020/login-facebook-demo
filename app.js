const express = require('express');
const passport = require('passport');
const FacebookStrategy  = require('passport-facebook').Strategy;
const session  = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const config = require('./config');
const routes = require('./routes');
const mysql = require('mysql');
const app = express();
//Define MySQL parameter in Config.js file.
const pool = mysql.createPool({
  host     : config.host,
  user     : config.username,
  password : config.password,
  database : config.database
});
passport.authenticate('facebook', { scope: 'email'});
// Passport session setup.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Use the FacebookStrategy within Passport.
passport.use(new FacebookStrategy({
    clientID: config.facebook_api_key,
    clientSecret:config.facebook_api_secret ,
    callbackURL: config.callback_url
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      console.log(accessToken, refreshToken, profile, done);
      return done(null, profile);
    });
  }
));

passport.use(new FacebookStrategy({
  clientID: config.facebook_api_key,
  clientSecret:config.facebook_api_secret ,
  callbackURL: config.callback_url
},
function(accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    //Check whether the User exists or not using profile.id
    if(config.use_database) {
      // if sets to true
      pool.query("SELECT * from user where uID="+profile.id, (err,rows) => {
        if(err) throw err;
        if(rows && rows.length === 0) {
            console.log("There is no such user, adding now");
            pool.query("INSERT into user(uID,user_name,user_email) VALUES('"+profile.id+"','"+profile.displayName+ "','" + profile.emails[0].value  +"')");
            console.log(profile.id + profile.displayName + profile.emails);
            console.log('success');
        } else {
            console.log("User already exists in database");
        }
      });
    } else{
      console.log('loi gi dau');
    }
    return done(null, profile);
  });
}
));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);

app.listen(3000);