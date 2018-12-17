var io = require('socket.io')();

function returnIO(server){
	io.attach(server, {
		pingInterval: 10000,
		pingTimeout: 5000
	});
	return io
}

io
	.on('connection', function(socket){
		console.info('a user connected');
		socket.on('login', function(){
			console.info('user login');
		});
    socket.on('disconnect', function(){
        console.log('user disconnected');
      });
  });


var plcData = io.of("/plc_data")

plcData
	.on('connection', function(socket){
    console.log('a user connected to plc_data');
    socket.on('login', function(){
        console.log('user login to plc_data');
			});
		socket.on('disconnect', function(){
			console.log('user disconnected from plc_data');
		});
  });

module.exports = returnIO;