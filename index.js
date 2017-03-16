
require('dotenv').config();

var twitter = require('./src/twitter');
var markov = require('./src/markov');

var fs = require('fs');

var tweetInterval = null;

var pullInterval = null;
var pullNum = parseInt(process.env.CORPUS_SIZE) || 10000;
var chain;

process.stdin.resume();

process.stdin.on('data', function(input) {
    input = input.toString().trim();
    var num;

    if (input.match(/^quit$/)) {
        process.stdin.pause();
        process.exit(0)
    }
    else if (input.match(/^pull [0-9]+$/)) {
        num = input.match(/[0-9]+/);
        num = parseInt(num);

        pullNum = num;
        downloadTweets(num);
    }
    else if (input.match(/^print [0-9]+/)) {
        num = input.match(/[0-9]+/);
        num = parseInt(num);

        generateTweets(num).then(function(tweets){
            for (var i = 0; i < tweets.length; i++) {
                console.log(tweets[i]);
            }
            console.log("----");
        },
        function(err) {
            console.log(err)
        });
    }
    else if (input.match(/^start [0-9]+$/)) {
        var time = input.match(/[0-9]+/);
        time = parseInt(time);

        console.log("Starting timer: running every "+time+" minutes");

        startTimer(time * 60000);
    }
    else if (input.match(/^stop$/)) {
        console.log("Stopping timer");
        stopTimer();
    }
    else if (input.match(/^post$/)) {
        postTweet();
    }
});

function downloadTweets(number) {
    console.log("Starting to pull tweets");
    twitter.pullTweets(number).then(function(tweets){
        console.log("Received "+tweets.length+" items");

        var text = "";
        for (var i = 0; i < tweets.length; i++) {
            var str = tweets[i].text;

            //Strip out the urls and newlines, apostrophes and quotations
            //(because they never match properly)
            //TODO: Work out how to keep urls
            str = str.replace(/\n/g, ' ');
            str = str.trim();
            str = decodeString(str);

            if (!str) { continue; }

            text += str + '\n';
        }

        chain = markov.generateMarkovChain(text, 3);
        fs.writeFile('output.txt', text, function(err) {
            if (err){
                return console.log(err);
            }
            console.log("Saved tweets to output.txt");
        });

    });
}

function generateTweets(number) {
    return new Promise(function(resolve, reject) {
        if (!chain) {
            loadChainFromFile();
        }
        var tweets = [];
        var errors = 0;

        while (tweets.length < number) {
            if (errors > (10 * number)) {
                return reject("Too many failed attempts. Change settings");
            }

            var test = chain.makeSentence({
                maxChars: 140,
                tries: 100,
                maxOverlapRatio: 0.75,
                maxOverlapTotal: 12
            });

            if (typeof(test) !== 'string'){
                errors++;
                continue;
            }

            tweets.push(test.trim());
        }

        resolve(tweets);
    })
}

function postTweet() {
    return new Promise(function(resolve, reject) {
        generateTweets(1).then(function(res) {
            var tweet = res[0];

            twitter.postTweet(tweet).then(function(tw, res) {
                console.log("Tweet posted: " + tw.text);
                resolve(tw, res);
            }, function(err) {
                reject(err);
            });
        })
    });
}

function startTimer(period) {
    stopTimer();

    tweetInterval = setInterval(function() {
        postTweet().then(function() {}, function(err) {
            console.log("Stopping Timer because of error: "+JSON.stringify(err));
        })
    }, period);

    //Pull new tweets every 24 hours
    pullInterval = setInterval(function() {
        downloadTweets(pullNum);
    }, 14400000);
}

function stopTimer() {
    if (tweetInterval) {
        clearInterval(tweetInterval);
    }
    if (pullInterval) {
        clearInterval(pullInterval);
    }
}

function loadChainFromFile() {
    console.log("Loading chain from file");
    var text = fs.readFileSync('output.txt').toString();
    chain = markov.generateMarkovChain(text, 3);
    console.log("Chain loaded");
}

function decodeString(str) {
    var ret = str.replace(/&gt;/g, '>');
    ret = ret.replace(/&lt;/g, '<');
    ret = ret.replace(/&quot;/g, '"');
    ret = ret.replace(/&apos;/g, "'");
    ret = ret.replace(/&amp;/g, '&');
    return ret;
}