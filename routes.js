const ldr = require('./ldr');

const twitter = new ldr.TwitterStream();

module.exports = {
    index: (req, res) => {
        res.render('index');
    },
    track: (req, res) => {
        if(req.body.keyword) {
            twitter.addKeyword(req.body.keyword);
        }
        if(req.body.user) {
            twitter.addUser(req.body.user);
        }
        twitter.reset();
        res.redirect('/');
    }
};