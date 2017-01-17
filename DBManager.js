/**
 * Created by Brian on 1/15/17.
 */
const mongoose = require('mongoose');
const db = require('./mongodb');

class MongoDB {
    constructor() {
        this.Tweet = mongoose.model('Tweet');
        this.User = mongoose.model('User');
        console.log('MONGODB MANAGER CREATED');
    }

    insertTweet(id, created_at, text, source, user, retweet_id) {
        console.log('BEGINNING TWEET %s INSERT', id);
        let tweet = new this.Tweet();
        tweet._id = id;
        tweet.created_at = created_at;
        tweet.text = text;
        tweet.source = source;
        tweet.user = user;
        if (retweet_id) {
            tweet.retweet_id = retweet_id;
        }
        tweet.save((error, result) => {
            if (!error) {
                console.log('INSERT TWEET %s SUCCESSFUL', result._id);
            }
            else {
                console.log(error)
            }
        });
    }

    insertUser(id, name, screen_name) {
        console.log('BEGINNING USER %s INSERT', id);
        this.User.findById(id, (error, user) => {
           if(!error && !user) {
               let user = new this.User();
               user._id = id;
               user.name = name;
               user.screen_name = screen_name;
               user.save((error, result) => {
                   if(!error) {
                       console.log('INSERT USER %s SUCCESSFUL', result._id);
                   }
                   else {
                       console.log(error);
                   }
               });
           }
           else if(user) {
               console.log('USER %s ALREADY SAVED', user._id);
           }
           else if(error) {
               console.log(error);
           }
        });
    }
}

module.exports = {MongoDB: MongoDB};