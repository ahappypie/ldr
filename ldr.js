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
        this.stopped = false;
        this.timer = null;
        this.calm = 1;
        this.db = new MongoDB();
    }

    keywordsToString() {
        return this.keywords.join();
    }

    usersToString(name) {
        return this.users.map(user => {
            if(name) {
                return user.name;
            }
            else {
                return user.id;
            }
        }).join();
    }

    addKeyword(keyword, callback) {
        if(this.keywords.indexOf(keyword) >= 0) {
            callback('keyword already tracked');
        }
        else {
            this.keywords.push(keyword);
            callback(undefined);
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
        this.client.get('users/show', {screen_name: username}, (error, user) => {
           if(!error) {
               if(this.users.filter(u => {return u.name === username})) {
                   callback('user already tracked');
               }
               else {
                   this.users.push({name: username, id: user.id_str});
                   callback(undefined);
               }
           }
           else {
               callback('error retrieving user id');
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

    init() {
        clearInterval(this.timer);
        if(this.stream == null || !this.active) {
            this.client.stream('statuses/filter', {track: this.keywordsToString(), follow: this.usersToString()}, (str) => {
                if(this.stopped) {
                    this.stopped = false;
                }
                this.active = true;
                clearInterval(this.timer);
                this.stream = str;

                this.stream.on('data', (tweet) => {
                    this.db.insertTweet(tweet.id_str, tweet.created_at, tweet.text, tweet.source,
                        tweet.user.id_str, tweet.retweeted_status.id_str);
                    this.db.insertUser(tweet.user.id_str, tweet.user.name, tweet.user.screen_name);
                });

                this.stream.on('end', () => {
                    this.active = false;
                    clearInterval(this.timer);
                    if(!this.stopped) {
                        this.timer = setInterval(() => {
                            if (this.active) {
                                clearInterval(this.timer);
                                this.stream.destroy();
                            }
                            else {
                                this.init();
                            }
                        }, 5000 * this.calm * this.calm);
                    }
                });

                this.stream.on('error', (error) => {
                    if (error.message == 'Status Code: 420') {
                        this.calm++;
                    }
                });
            });
        }
    }

    reset() {
        clearInterval(this.timer);
        if (this.stream !== null && this.active) {
            this.stream.destroy();
        } else {
            this.init();
        }
    }

    stop() {
        if (this.stream !== null && this.active) {
            this.stopped = true;
            this.stream.destroy();
        }
    }
}

module.exports = {TwitterStream: TwitterStream};