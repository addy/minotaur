var app = require('../app');
var port = 4002;
var server = app.listen(port, function() {
   if (callback) {
      process.nextTick(function () {
         callback(port);   
      });
   }
});

var callback = null;
module.exports = function (done) {
   callback = done;
};