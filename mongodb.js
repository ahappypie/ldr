/**
 * Created by Brian on 1/15/17.
 */
const mongoose = require('mongoose');

const Tweet = new mongoose.Schema({
    _id: String,
    created_at: Date,
    text: String,
    source: String,
    user: String,
    retweet_id: {type: String, default: null}
}, {_id: false});

const User = new mongoose.Schema({
    _id: String,
    name: String,
    screen_name: String
}, {_id: false});

mongoose.model('Tweet', Tweet);
mongoose.model('User', User);

mongoose.connect('mongodb://localhost/ldr');

mongoose.connection.once('open', () => {
    console.log('CONNECTED TO MONGODB');
});