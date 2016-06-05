//pour pouvoir lancer l'application il faut appeler ce ficher
//on utilise le module express et socketIO (voir le rapport pour connaitre les raisons)
var express = require('express'),
	app = express(),
	path = require ('path'),
	fs = require('fs'),
	http = require('http');

//pour pouvoir lancer l'app sur un serveur inligne
var port = process.env.app_port || 8080;

app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', __dirname + '/static/view');
app.use(express.static(path.join(__dirname + '/static')));
app.get('/home',function(req,res){
	// Generate unique id for the room
	var id = Math.round((Math.random() * 1000000));
    res.redirect('/home/'+id);
});
app.get('/', function(req, res){
	res.render('index');
});

var server = http.createServer(app);


require('./server')(app, server);

server.listen(port);
console.log('Your application is running');