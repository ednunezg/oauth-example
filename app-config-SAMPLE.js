//Rename this file to "app-config.js"

var config = {

  siteTitle: "OAuth App",
  dbLocation: "mongodb://localhost/oauth-app",

  facebookConfig: {
    appID: "FACEBOOK_CLIENT_ID",
    appSecret: "FACEBOOK_CLIENT_SECRET",
    callbackUrl: "http://localhost:3000/auth/login/facebook/callback"
  },


  googleConfig: {
    appID: "GOOGLE_CLIENT_ID",
    appSecret: "GOOGLE_CLIENT_SECRET",
    callbackUrl: "http://localhost:3000/auth/login/google/callback"
  }
}

module.exports = config;