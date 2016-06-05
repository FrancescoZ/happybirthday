var fs = require('fs');

// Start Binary.js server
var BinaryServer = require('binaryjs').BinaryServer;

module.exports = function(app, server){
  var bs = BinaryServer({server: server});
  // Wait for new user connections
  bs.on('connection', function(client){
    // Incoming stream from browsers
    client.on('stream', function(stream, meta){
      //
      var file = fs.createWriteStream(__dirname+ '/public/' + meta.name);
      stream.pipe(file);
      //
      // Send progress back
      stream.on('data', function(data){
        stream.write({rx: data.length / meta.size});
      });
      //
    });
  });
  //
  //
}