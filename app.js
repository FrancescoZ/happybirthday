//pour pouvoir lancer l'application il faut appeler ce ficher
//on utilise le module express et socketIO (voir le rapport pour connaitre les raisons)
var express = require('express'),
    app = express(),
    path = require('path'),
    fs = require('fs'),
    http = require('http');
var url = require('url');
var db= require('mysql');
var pool      =    db.createPool({
    connectionLimit : 100, //important
    host     : 'localhost:3306',
    user     : 'francescozano',
    password : 'W1QP9bTZgNbyIEQW',
    database : 'francescozano',
    debug    :  false
});


//pour pouvoir lancer l'app sur un serveur inligne
var port = process.env.app_port || 3010;

var io = require('socket.io').listen(app.listen(port, function () {
    console.log("Working");
}));

var getID=function(){
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};

var ask=function(query,callback){
    pool.getConnection(function(err,connection){
        if (err) {
            if(connection)
              connection.release();
          return;
        }
        connection.query(query,function(err,rows){
            connection.release();
            if(!err) {
                if (callback)
                    callback(rows);
            }
        });
        connection.on('error', function(err) {
        });
    });
}

app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', __dirname + '/static/view');
app.use(express.static(path.join(__dirname + '/static')));
app.get('/insertion', function (req, res) {
    res.render('index');
});
app.get('/login', function (req, res) {
    res.render('login');
});
app.get('/', function (req, res) {
    res.render('main');
});
app.get('/:id', function (req, res) {
    res.render('id');
});
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'static/uploads');
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname +getID()+ '-' + Date.now() + path.extname(file.originalname));
    }
});
var upload = multer({storage: storage}).array('userPhoto',12);

app.post('/photo', function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            return res.end("C'è stato un errore nel caricamento, ricarica la pagina e riprova");
        }
        try {         
            var name = res.req.body.name,
                message = res.req.body.messaggio,
                files = res.req.files;
            ask("INSERT INTO message (id,name,message,timestap) VALUES ('" + id + "','" + name + "','" + message + "','"+(new Date()).getHours()+":"+(new Date()).getMinutes()+"')");
            // stmt.run();
            // stmt.finalize();
            var i=0;
            files.forEach(function (file) {
                if (i>=5)
                    return;
                var idfile = getID();
                ask("INSERT INTO attached (id,path,message,type) VALUES ('" + idfile + "','" + file.path.replace('static\\','') + "','" + id + "','"+file.mimetype.split("/")[0]+"')");
                i++;
            });      
            res.end("File caricato");
        }catch(e){
            var a=0;
        }
    });
});

var indexPage, movie_webm, movie_mp4, movie_ogg;



io.on('connection', function (socket) {
    socket.on('home',function(){
        ask("SELECT * FROM message;",function(err,row){
            if (err)
                return;
            var image="";
            if (row.clicked==1 && row.image!=null)
                image="images/"+row.id+".jpg";
            else
                image=require('gravatar').url(row.name.replace(/\s/g, '')+'@gmail.com', {s: '200', d: 'identicon'});
            socket.emit('person',{
                name:row.name,
                id:row.id,
                image:image,
                clicked:row.clicked==1
            })
        });
        
    });
    socket.on('load',function(data){

            ask("UPDATE message SET clicked=1 WHERE id='"+id+"';");
            ask("SELECT * FROM message WHERE id='"+id+"';",function(err,row){
                if (err)
                    return;
                var image="images/"+row.id+".jpg";
                if (row.image==null)
                    image=require('gravatar').url(row.name.replace(/\s/g, '')+'@gmail.com', {s: '200', d: 'identicon'});

                socket.emit('friend',{
                    name:row.name,
                    id:row.id,
                    image:image,
                    message:row.message,
                    time:row.timestap
                });
                
                ask("SELECT * FROM attached WHERE message='"+id+"';",function(err,imgs){
                    imgs.forEach(function (img) {
                        if (err)
                            return;
                        if (img.type=="image")
                            var signal='image';
                        else if (img.type=='video')
                            var signal='video';
                        socket.emit(signal,{
                            name:row.name,
                            id:row.id,
                            image:image,
                            source:img.path,
                            time:row.timestap
                        });
                    });
                });
            });
                
        });
    });


