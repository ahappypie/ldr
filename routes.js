const ldr = require('./ldr');

const twitter = new ldr.TwitterStream();

module.exports = {
    index: (req, res) => {
        res.render('index');
    },
    track: (req, res) => {
        if(req.body.keyword) {
            twitter.addKeyword(req.body.keyword, (error) => {
                if(!error) {
                    console.log('ADDED KEYWORD: ' + req.body.keyword);
                    if(!req.body.user) {
                        twitter.reset();
                        res.redirect('/');
                    }
                }
            });
        }
        if(req.body.user) {
            twitter.addUser(req.body.user, (error) => {
                if(!error) {
                    console.log('ADDED USER: ' + req.body.user);
                    twitter.reset();
                    res.redirect('/');
                }
            });
        }
    }
};