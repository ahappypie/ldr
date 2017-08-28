/**
 * Created by Brian on 1/15/17.
 */
const mongodb = require('mongodb').MongoClient;

class Mongo {
    constructor(host, port) {
        this.url = `mongodb://${host || 'localhost'}:${port || '27017'}`;
    }

    async connect() {
        try {
            this.client = await mongodb.connect(this.url)
        } catch (ex) {
            console.log(ex);
        }
    }
}

module.exports = {Mongo: Mongo};