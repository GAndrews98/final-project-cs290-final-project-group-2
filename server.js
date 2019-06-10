const path = require('path');
const express = require('express');
const exphbs = require('express-handlebars');
const MongoClient = require('mongodb').MongoClient;
// const bodyParser = require('body-parser');
const mongoHost = process.env.MONGO_HOST;
const mongoPort = process.env.MONGO_PORT || 27017;
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoName = process.env.MONGO_NAME;

// var mongoUrl = `mongodb://${mongoUser}:${mongoPass}@${mongoHost}:${mongoPort}/${mongoName}`;
var mongoUrl = `mongodb+srv://${mongoUser}:${mongoPass}@cluster0-ne0jv.mongodb.net/${mongoName}?retryWrites=true&w=majority`;

// var mongoUrl = 'mongodb+srv://${mongoUser}:${mongoPass}@cluster0-ne0jv.mongodb.net/${mongoName}?retryWrites=true&w=majority';
// var mongoUrl = 'mongodb+srv://gandrews98:niltagMongoDB@cluster0-ne0jv.mongodb.net/cs290_andrjose?retryWrites=true&w=majority';

var database = null;
var users = null;

const app = express();
var port = process.env.PORT || 3001 || 3333;
app.use(express.static('public'));
// app.use(bodyParser.json());
app.use(express.json({limit: '1mb'}));

app.engine("handlebars", exphbs());
app.set("view engine","handlebars");

function add_user(request) {
  console.log("New user added. Name:", request.name);
  console.log(request.name, "has solved: 1 bomb");
  users.insertOne(request);
}

function compare(a, b) {
    if (a.name && b.name) {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();
        var comparison = 0;
        if (nameA > nameB) {
            comparsion = 1;
        } else if (nameA < nameB) {
            comparison = -1;
        }
    }
    return comparison;
}
// app.use(function(req,res,next){
//   res.status(404).send("Sorry, that page does not exist");
// });
app.get('/stats/:user', function (req, res) {
    var username = req.params.user;
    users.findOne({name: username}, (err, data) =>{
        if (data)
            res.status(200).render('individualStats', data);
        else
            res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
    });
});

app.get('/stats', function (req, res){
  users.find({}, (err, data) =>{
    data.sort({"stats.bombsSolved": -1});
    data.toArray((err, docs)=>{
      res.status(200).render('stats', {users: docs});
    });
  });
});

app.post('/stats/update', function (req, res){
  users.findOne({name: req.body.name}, (err, data) =>{
    if(!data) {
      add_user(req.body);
    } else {
      var incModules = data.stats.modulesSolved + req.body.stats.modulesSolved;
      var incWires = data.stats.totalWiresCut + req.body.stats.totalWiresCut;
      var incStrikes = data.stats.totalStrikesReceived + req.body.stats.totalStrikesReceived;
      if(!(data.stats.levelSolved.includes(req.body.stats.levelSolved[0]))) {
        users.updateOne(data, {
            $push: {"stats.levelSolved": req.body.stats.levelSolved[0]},
            $inc: {"stats.bombsSolved": 1},
            $set: {"stats.modulesSolved": incModules},
            $set: {"stats.totalWiresCut": incWires},
            $set: {"stats.totalStrikesReceived": incStrikes}
        });
      } else {
        users.updateOne(data, {
            $inc: {"stats.bombsSolved": 1},
            $set: {"stats.modulesSolved": incModules},
            $set: {"stats.totalWiresCut": incWires},
            $set: {"stats.totalStrikesReceived": incStrikes}
        });
      }
      console.log(data.name, "has solved:", (data.stats.bombsSolved + 1), "bombs");
    }
  });
  res.status(200).send('Request received.');
});

app.get('*', function (req, res) {
    console.log("Sending 404");
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

MongoClient.connect(mongoUrl, {useNewUrlParser: true}, function (err,client){
  if(err)
    throw err;
  database = client.db(mongoName);
  users = database.collection('users');
  app.listen(port, () => console.log('Listening on port ', port));
});
