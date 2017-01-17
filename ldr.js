/**
 * Created by Brian on 12/22/16.
 */
const Twitter = require('twitter');
const MongoDB = require('./DBManager').MongoDB;


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
        this.stream = null;
        this.active = false;
        this.timer = null;
        this.calm = 1;
        this.db = new MongoDB();
    }

    keywordsToString() {
        return this.keywords.join();
    }

    usersToString() {
        return this.users.join();
    }

    addKeyword(keyword, callback) {
        console.log('TRYING TO ADD: ' + keyword);
        if(this.keywords.indexOf(keyword) >= 0) {
            callback(true);
        }
        else {
            this.keywords.push(keyword);
            callback(false);
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

    addUser(username, callback) {
        console.log('TRYING TO ADD: ' + username);
        this.client.get('users/show', {screen_name: username}, (error, user) => {
           if(!error) {
               if(this.users.indexOf(user.id_str) >= 0) {
                   callback(true);
               }
               else {
                   this.users.push(user.id_str);
                   callback(false);
               }
           }
           else {
               callback(true);
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

    init() {
        clearInterval(this.timer);
        if(this.stream == null || !this.active) {
            console.log('INIT with keywords: ' + this.keywordsToString() + ' and users: ' + this.usersToString());
            this.client.stream('statuses/filter', {track: this.keywordsToString(), follow: this.usersToString()}, (str) => {
                this.active = true;
                clearInterval(this.timer);
                this.stream = str;

                this.stream.on('data', (tweet) => {
                    console.log('GOT A TWEET %s', tweet.id_str);
                    this.db.insertTweet(tweet.id_str, tweet.created_at, tweet.text, tweet.source,
                        tweet.user.id_str, tweet.retweeted_status.id_str);
                    this.db.insertUser(tweet.user.id_str, tweet.user.name, tweet.user.screen_name);
                });

                this.stream.on('end', () => {
                    this.active = false;
                    clearInterval(this.timer);
                    this.timer = setInterval(() => {
                        console.log('STREAM IS ACTIVE: ' + this.active);
                        if(this.active) {
                            clearInterval(this.timer);
                            this.stream.destroy();
                        }
                        else {
                            console.log('RE INITIALIZE');
                            this.init();
                        }
                    }, 5000 * this.calm * this.calm);
                });

                this.stream.on('error', (error) => {
                    if (error.message == 'Status Code: 420') {
                        console.log('INCREASING CALM');
                        this.calm++;
                    }
                });
            });
        }
    }

    reset() {
        console.log('BEGINNING RESET');
        clearInterval(this.timer);
        if (this.stream !== null && this.active) {
            console.log('DESTROYING STREAM');
            this.stream.destroy();
            /*this.active = false;
            setTimeout(() => {
                console.log('REINITIALIZING');
                this.init();
            }, 1000);*/
        } else {
            console.log('RESET INIT');
            this.init();
        }
    }
}

module.exports = {TwitterStream: TwitterStream};