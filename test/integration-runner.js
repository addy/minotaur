var async = require('async');
var colors = require('colors');
var path = require('path');
var webdriver = require('selenium-webdriver');

// Should include all url cases
URLS = [
   '/home'
]

module.exports = {
   runAll: function (callback) {
     var server = require('./integration-server')(function (port) {
         // Automatically run the tests using Selenium.
         var url = 'http://localhost:' + port;
         var browsers = [
            webdriver.Capabilities.chrome(),
            webdriver.Capabilities.firefox(),
            webdriver.Capabilities.safari(),
            webdriver.Capabilities.ie()
         ];
         failCount = 0;
         passCount = 0;
         async.eachSeries(browsers, function (browser, done) {
            var name = browser.get('browserName');
            process.stdout.write('Testing on ' + name + ': ');
            runBrowserTest(browser, port, URLS, function (err, result) {
               // This browser is unavailable.
               if (err) {
                  process.stdout.write(colors.gray('Unavailable') + '\n');
                  return done();
               }
               failCount += result.fails.length;
               passCount += result.passes.length; 

               // Output results.
               outputResult(result);
               done();
            });
         }, function (err) {
            total = failCount + passCount;

            if (err) {
               console.log('\n\n' + colors.red('ERROR') + ':\n');
               console.log('  %s\n', err);
               callback("error", err);
            }
            var result = failCount === 0 ? colors.green('PASSED') : colors.red('FAILED');
            console.log('\n' + result + ': %d/%d passed\n', passCount, total);

            callback(failCount === 0 ? "passed" : "failed", {
               passed: passCount,
               failed: failCount
            });
         });
      }); 
   }
}

function runBrowserTest (browser, port, urls, done) {
   var driver = null; 

   // Try to build for browser.
   try {
      driver = new webdriver.Builder().withCapabilities(browser).build();   
   } catch (err) {
      // This browser is not available.
      return done(err);
   }

   fails = [];
   passes = [];
   async.eachSeries(urls, function (url, done) {
      script = 'return window.Errors';
      fullUrl = 'http://localhost:' + port + url;
      driver.get(fullUrl)
      driver.sleep(50)
      driver.executeScript(script).then(function (errors) {
         if (errors.length) {
            fails.push({
               url: url,
               errors: errors
            });
         } else {
            passes.push({
               url: url
            });
         }
         done();
      });
      
   }, function (err) {
      driver.quit();
      done(null, {
         fails: fails,
         passes: passes
      });
   });
};

function outputResult (result) {
   var output = colors.green(result.passes.length) + ' passed, ' +
         colors.red(result.fails.length) + ' failed\n';
   process.stdout.write(output);
   // If no failures, we can just return.
   if (result.fails.length === 0) return;
   console.log('FAILS:'.red);
   for (var i = 0; i < result.fails.length; i++) {
      fail = result.fails[i]
      console.log('  %s', fail.url);
      for (var j = 0; j < fail.errors.length; j++) {
         console.log('  ✗ %s', fail.errors[j].msg);
      }
      console.log('');
   }
   console.log('');
}
