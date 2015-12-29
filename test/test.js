var async = require('async');
var colors = require('colors');
var integrationRunner = require('./integration-runner');
var unitRunner = require('./unit-runner');

if (process.argv.length >= 3 && process.argv[2]) {
   // Check for the 'manual' argument.
   for (var i = 2; i < process.argv.length; i++) {
      if (process.argv[i] === 'manual') {
         return unitRunner.runManual();
      }
      if (process.argv[i] === 'unit') {
         return unitRunner.runAll(function (status) {
            process.exit(status == "passed" ? 0 : 1);
         });
      }
      if (process.argv[i] === 'integration') {
         return integrationRunner.runAll(function (status) {
            process.exit(status == "passed" ? 0 : 1);
         });
      }
   }
}

console.log(colors.white('Running unit tests:\n'));
unitRunner.runAll(function (unitStatus, unitData) {

   console.log(colors.white('Running integration tests:\n'));
   integrationRunner.runAll(function (integrationStatus, integrationData) {
      if (unitStatus === 'passed' && integrationStatus === 'passed') {
         console.log(colors.white('Overall: %s\n'), colors.green('PASSED'));
         process.exit(0);
      } else {
         console.log(colors.white('Overall: %s\n'), colors.red('FAILED'));
         process.exit(1);   
      }
   });
});
