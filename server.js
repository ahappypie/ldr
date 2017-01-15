/**
 * Created by Brian on 1/13/17.
 */
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const routes = require('./routes.js');

//express setup
const app = express();
const port = process.env.PORT || 8080;
app.use(bodyParser.urlencoded({extended:false}));

//view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

//routes
app.get('/', routes.index);
app.post('/track', routes.track);

const server = http.createServer(app).listen(port, () => {
    console.log('Express server listening on ' + port);
});