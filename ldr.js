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
        this.stream = null;
        this.active = false;
        this.timer = null;
        this.calm = 1;
    }

    keywordsToString() {
        return this.keywords.join();
    }

    usersToList() {
        return this.users.join();
    }

    addKeyword(keyword) {
        console.log('TRYING TO ADD: ' + keyword);
        if(this.keywords.indexOf(keyword) >= 0) {
            return false;
        }
        else {
            this.keywords.push(keyword);
            console.log('ADDED KEYWORD: ' + keyword);
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
        console.log('TRYING TO ADD: ' + username);
        this.client.get('users/show', {screen_name: username}, (error, user) => {
           if(!error) {
               if(this.users.indexOf(user.id_str) >= 0) {
                   return false;
               }
               else {
                   this.users.push(user.id_str);
                   console.log('ADDED USER: ' + user.id_str);
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

    init() {
        clearTimeout(this.timer);
        if(this.stream == null || !this.active) {
            console.log('INIT with keywords: ' + this.keywordsToString() + ' and users: ' + this.usersToList());
            this.client.stream('statuses/filter', {track: this.keywordsToString(), follow: this.usersToList()}, (str) => {
                clearTimeout(this.timer);
                this.stream = str;
                this.active = true;

                this.stream.on('data', this.processStream);

                this.stream.on('end', () => {
                    this.active = false;
                    console.log('RE INITIALIZE');
                    this.init();
                    /*clearTimeout(this.timer);
                    this.timer = setTimeout(() => {
                        clearTimeout(this.timer);
                        if(this.active) {
                            this.stream.destroy();
                        }
                        else {
                            console.log('RE INITIALIZE');
                            this.init();
                        }
                    }, 1000 * this.calm * this.calm);*/
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
        console.log('BEGINNING RESET');
        this.calm = 1;
        clearTimeout(this.timer);
        if (this.stream !== null && this.active) {
            console.log('DESTROYING STREAM');
            this.stream.destroy();
        } else {
            console.log('RESET INIT');
            this.init();
        }
    }

    processStream(tweet) {
        console.log(tweet.text);
    }
}

module.exports = {TwitterStream: TwitterStream};