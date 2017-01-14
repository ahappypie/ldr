const ldr = require('./ldr');

const stream = new ldr.TwitterStream();

module.exports = {
    index: (req, res) => {
        res.render('index');
    },
    track: (req, res) => {
        if(req.body.keyword) {
            stream.addKeyword(req.body.keyword);
        }
        else if(req.body.user) {
            stream.addUser(req.body.user);
        }
        if(stream.isStreaming) {
            stream.reset()
        }
        else {
            stream.filter();
        }
        res.redirect('/');
    }
};