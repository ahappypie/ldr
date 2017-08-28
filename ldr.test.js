const TwitterStream = require('./ldr').TwitterStream;

const ts = new TwitterStream(console.log);

async function test() {
    try {
        console.log(await ts.track('keyword', 'javascript'));
        console.log(await ts.track('user', 'twitterdev'));

        ts.reset();
        //console.log(await ts.removeTrack('keyword', 'javascript'));
        //console.log(await ts.removeTrack('user', 'twitterdev'));
    } catch (err) {
        console.log(err);
    }
}
test();
//ts.init();