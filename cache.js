const redis = require('redis');

class Redis {
    constructor(host, port) {
        this.client = redis.createClient(port || 6379, host || 'localhost');
    }
}

module.exports = {Redis: Redis};