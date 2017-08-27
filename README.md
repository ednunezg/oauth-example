Local, facebook and google authentication on node.js
=============================================================================

This is is a quick project I made for me to better understand how authentication / authorization with local, Facebook and Google accounts. This serves as a good starting point for any developer that wish to create a new website that allows people to login from different social accounts.

Project is built on node.js/express with passport modules.

Running the project
--------------------

1. Install node.js and npm
2. ```$ git clone https://github.com/ednunezg/oauth-example```
3. Install dependencies ```$ npm install```
4. Use the Google and Facebook developer pages to create a new app to be used for OAuth 2 authorization.
6. Rename "app-config-SAMPLE.js" to "app-config.js" with your Facebook and Google app id and secret.
7. Start app ```$ nodemon app```
8. Go to http://localhost:3000
