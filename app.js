/**
 * Created by Brian on 2/2/17.
 */
const readline = require('readline');
const ldr = require('./ldr');

const twitter = new ldr.TwitterStream();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', line => {
    const params = line.split(' ');
    switch(params[0]) {
        case 'add':
            add(params);
            break;
        case 'remove':
            remove(params);
            break;
        case 'show':
            show(params);
            break;
        case 'start':
            start();
            break;
        case 'stop':
            stop();
            break;
        case 'exit':
            exit();
            break;
        case 'help':
            console.log('add, remove, show, exit, help');
            break;
    }
});

rl.on('SIGINT', () => {
    exit();
});

function add(params) {
    if(params[1] === 'user') {
        twitter.addUser(params[2], (error) => {
            if(error) {
                console.error(error);
            }
        });
    }
    else if(params[1] === 'keyword') {
        twitter.addKeyword(params[2], (error) => {
            if (error) {
                console.error(error);
            }
        });
    }
}

function show(params) {
    if(params[1] === 'user' || params[1] === 'users') {
        console.log(twitter.usersToString(true));
    }
    else if(params[1] === 'keyword' || params[1] === 'keywords') {
        console.log(twitter.keywordsToString());
    }
}

function remove(params) {

}

function start() {
    twitter.reset();
}

function stop() {
    twitter.stop();
}

function exit() {
    rl.close();
    process.exit();
}