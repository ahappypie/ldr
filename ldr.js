/**
 * Created by Brian on 12/22/16.
 */
const Twitter = require('twitter');
const Mongo = require('./db').Mongo;
const Redis = require('./cache').Redis;


class TwitterStream {
    constructor(dataFn) {
        this.client = new Twitter ({
            consumer_key: process.env.TWITTER_CONSUMER_KEY,
            consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
            access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
            access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
        });
        this.stream = null;
        this.active = false;
        this.stopped = false;
        this.timer = null;
        this.calm = 1;
        this.mongo = new Mongo();
        this.redis = new Redis();
        this.dataFn = dataFn;
    }

    async keywordsToString() {
        return new Promise((resolve, reject) => {
            this.redis.client.smembers('keywords', (error, response) => {
                if(error) {
                    reject(`error retrieving keywords - ${error}`);
                } else {
                    resolve(response.join());
                }
            });
        });
        //return this.keywords.join();
    }

    async usersToString(name) {
        return new Promise((resolve, reject) => {
            this.redis.client.hgetall('users', (error, users) => {
                if(error) {
                    reject(`error retrieving users - ${error}`);
                } else {
                    let s = '';
                    Object.keys(users).forEach(function (key) {
                        s += `${users[key]},`
                    });
                    resolve(s.substring(0, s.length - 1));
                }
            });
        });
        /*return this.users.map(user => {
            if(name) {
                return user.name;
            }
            else {
                return user.id;
            }
        }).join();*/
    }

    track(type, track) {
        switch(type) {
            case 'keyword':
                return this.addKeyword(track);
            break;
            case 'user':
                return this.addUser(track);
                break;
        }
    }

    async addKeyword(track) {
        return await new Promise((resolve, reject) => {
            this.redis.client.sadd('keywords', track, (error, response) => {
                if(error) {
                    reject(`error adding keyword - ${error}`);
                } else {
                    //resolve(`adding ${track} to set: keywords - ${response ? 'successful':'unsuccessful'}`);
                    resolve(response);
                }
            });
        })
    }

    async addUser(track) {
        let user;
        try {
            user = await this.getUserId(track);
        }
        catch(err) {
            console.log(`error getting user id - ${err}`);
            return;
        }
        return new Promise((resolve, reject) => {
            this.redis.client.hset('users', track, user.id, (error, response) => {
                if (error) {
                    reject(`error adding user - ${error}`);
                } else {
                    //resolve(`adding ${track}:${user.id} to hash: users - ${response ? 'successful' : 'unsuccessful'}`);
                    resolve(response);
                }
            });
        });
    }

    async getUserId(username) {
        return await new Promise((resolve, reject) => {
            this.client.get('users/show', {screen_name: username}, (error, user) => {
                if(error) {
                    reject(error);
                }
                else {
                    resolve(user);
                }
            });
        });
    }

    removeTrack(type, track) {
        switch(type) {
            case 'keyword':
                return this.removeKeyword(track);
            break;
            case 'user':
                return this.removeUser(track);
        }
    }

    async removeKeyword(keyword) {
        return new Promise((resolve, reject) => {
            this.redis.client.srem('keywords', keyword, (error, response) => {
                if(error) {
                    reject(`error deleting keyword: ${keyword} - ${error}`);
                } else {
                    //resolve(`delete keyword: ${keyword} - ${response ? 'successful':'unsuccessful'}`);
                    resolve(response);
                }
            });
        });
    }

    async removeUser(user) {
        return new Promise((resolve, reject) => {
            this.redis.client.hdel('users', user, (error, response) => {
                if(error) {
                    reject(`error deleting user: ${user} - ${error}`);
                } else {
                    //resolve(`delete user: ${user} - ${response ? 'successful':'unsuccessful'}`);
                    resolve(response);
                }
            });
        });
    }

    async init() {
        clearInterval(this.timer);
        if(this.stream == null || !this.active) {
            let keywords, users;
            try {
                keywords = await this.keywordsToString();
                users = await this.usersToString();
            } catch (err) {
                console.log(err);
            }
            this.client.stream('statuses/filter', {track: keywords, follow: users}, (str) => {
                if(this.stopped) {
                    this.stopped = false;
                }
                this.active = true;
                clearInterval(this.timer);
                this.stream = str;
                console.log(`stream going with keywords: ${keywords} and users: ${users}`);
                this.stream.on('data', (tweet) => {
                    this.dataFn(tweet);
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