var async = require('async');
var coffee = require('coffee-script');
var express = require('express');
var fs = require('fs');
var http = require('http');
var Mincer = require('mincer');
var path = require('path');
var url = require('url');

/** Create mincer environment. */
var environment = new Mincer.Environment();
environment.appendPath(path.join(__dirname, '../assets/js'));
environment.appendPath(path.join(__dirname, '../tests/client'));

var app = express();

/** Serves the assets required for every test. */
app.use(express.static(path.join(__dirname, './common')));

/** Filters out favicon.ico calls. */
app.get('favicon.ico', function (req, res) {
   res.status(404).send('No favicon!');
});

/** Serves javascript assets. */
app.get('/scripts/*', function (req, res, next) {
   var pathName = url.parse(req.url).pathname.substring(9);
   res.setHeader('Content-Type', 'application/javascript');
   try {
      var asset = environment.findAsset(pathName);   
      res.send(asset.toString());
   } catch (e) {
      // Create a block that will execute to show that the tests have failed to compile.
      var engine = e.message.indexOf('JadeEngine') != -1 ? 'Jade' : 'CoffeeScript';
      var output = 'describe(\'' + engine + '\', function () { ' +
            'it(\'failed to compile\', function () { ' +
            'throw Error(\'' + JSON.stringify(e.message) + '\');' +
            '});});'
   
      res.send(output);

      // Clean up the console.log output a little.
      var err = e.toString();
      err = err.substring(err.indexOf('error: ') + 7);
      console.error('\n%s\n', err);
   }
});

/** Serve a page that contains all of the files to test and all the test files. */
app.get('/', function (req, res) {
   res.send(createHtmlForScripts('all_tests.js'));
});

/** Serves a page that tests a single test file against all files in /assets/js. */
app.get('*', function (req, res) {
   var pathName = url.parse(req.url).pathname.substring(1);
   res.send(createHtmlForScripts(pathName));
});

app.use(function(err, req, res, next) {
   res.status(err.status || 500);
   res.send({
      message: err.message,
      error: err
   });
});

/** Capture callback to allow a test runner to know when the server is up. */
var callback = null;
module.exports = function (done) {
   callback = done;
};

/** Start the server. */
var port = 4001;
http.createServer(app).listen(port, function () {
   if (callback) {
      process.nextTick(function () {
         callback(port);   
      });
   }
});

/**
 * Helper functions.
 */

/**
 * Creates a script tag for each parameter.
 * @return {Array<string>} Script tags.
 */
var createScriptTags = function () {
   var tags = '';
   for (var i = 0; i < arguments.length; i++) {
      tags += '<script src="' + arguments[i] + '"></script>';
   }
   return tags;
};

/** HTML snippets used to generate the test pages. */
var testingSources = ['/chai.js', '/mocha.js', '/sinon-1.12.2.js', '/testing.js'];
var requiredSources = ['/scripts/templates/all.js']
var htmlStart = '<!DOCTYPE html><html><head><title>Mocha</title>' +
      '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<link rel="stylesheet" href="/mocha.css" /></head><body><div id="mocha"></div>';
htmlStart += createScriptTags.apply(this, testingSources);
htmlStart += '<script>mocha.setup("bdd")</script>';
htmlStart += createScriptTags.apply(this, requiredSources);
var htmlEnd = '<script>runTests()</script></body></html>';

/**
 * Creates an HTML test page containing a script tag for each parameter.
 * @return {string} HTML test page.
 */
var createHtmlForScripts = function () {
   var urls = [];
   for (var i = 0; i < arguments.length; i++) {
      urls.push(path.join('/scripts', arguments[i]));
   }
   return htmlStart + createScriptTags.apply(this, urls) + htmlEnd;
};
