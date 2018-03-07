const express = require('express');
const app = express();
const port = process.env.PORT || 3100;
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
let dotenv = require('dotenv'); //enables environment variables for development
dotenv.load();

// disable CORS
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});
app.get('/', function (req, res) {
	res.send('Hello World!');
});

//setup routes
const vbbApi = require('./routes/vbbApi');
app.use('/vbb', vbbApi);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	let err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function(err, req, res) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') !== 'production' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

app.listen(port);
console.log('ENV: ' + app.get('env'));
console.log('Listening to port: ' + port);
