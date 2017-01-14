/**
 * Created by Brian on 12/22/16.
 */
const Twitter = require('twitter');

class TwitterStream {
    constructor() {
        this.client = new Twitter({
            consumer_key: process.env.TWITTER_CONSUMER_KEY,
            consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
            access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
            access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
        });
        this.keywords = [];
        this.users = [];
        this.isStreaming = false;
    }

    keywordsToString() {
        return this.keywords.join();
    }

    usersToList() {
        return this.users.join();
    }

    addKeyword(keyword) {
        if(this.keywords.indexOf(keyword) >= 0) {
            return false;
        }
        else {
            this.keywords.push(keyword);
            return true;
        }
    }

    removeKeyword(keyword) {
        if(this.keywords.indexOf(keyword) < 0) {
            return false;
        }
        else {
            this.keywords.splice(this.keywords.indexOf(keyword), 1);
            return true;
        }
    }

    addUser(username) {
        this.client.get('users/show', {screen_name: username}, (error, user, response) => {
           if(!error) {
               console.log(user.id_str);
               if(this.users.indexOf(user.id_str) >= 0) {
                   return false;
               }
               else {
                   this.users.push(user.id_str);
                   return true;
               }
           }
           else {
               return false;
           }
        });
    }

    removeUser(user) {
        if(this.users.indexOf(user) < 0) {
            return false;
        }
        else {
            this.keywords.splice(this.users.indexOf(user), 1);
            return true;
        }
    }

    filter() {
        const keywords = this.keywordsToString();
        const users = this.usersToList();
        this.client.stream('statuses/filter', {track: keywords, follow: users}, (stream) => {
            console.log('Streaming %s', keywords);
            console.log('Streaming %s', users);
            this.isStreaming = true;
            stream.on('data', (tweet) => {
                console.log(tweet);
            });

            stream.on('error', (error) => {
                console.log(error);
            });
        });
    }

    reset() {
        if(this.isStreaming) {
            this.client.stream.destroy();
            this.isStreaming = false;
            this.filter();
        }
    }
}

module.exports = {TwitterStream: TwitterStream};