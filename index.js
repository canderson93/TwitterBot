
require('dotenv').config();

var twitter = require('./src/twitter');
var Text = require('markov-chains-text').default;

var fs = require('fs');

var isReady = fs.existsSync('output.txt');
var interval = null;

process.stdin.resume();

process.stdin.on('data', function(input) {
    input = input.toString().trim();

    if (input.match('^quit$')) {
        process.stdin.pause();
        process.exit(0)
    }
    else if (input.match('^pull$')) {
        downloadTweets();
    }
    else if (input.match('^print [0-9]*')) {
        var num = input.match('[0-9]+');
        num = parseInt(num);

        generateTweets(num).then(function(tweets){
            for (var i = 0; i < tweets.length; i++) {
                console.log(tweets[i]);
            }
            console.log("----");
        });
    }
    else if (input.match('^start$')) {
        console.log("Starting timer");
        startTimer(10 * 60 * 1000);
    }
    else if (input.match('^stop$')) {
        console.log("Stopping timer");
        stopTimer();
    }
});

function downloadTweets() {
    isReady = false;
    twitter.pullTweets(10000).then(function(tweets){
        console.log("Received "+tweets.length+" items");

        var text = "";
        for (var i = 0; i < tweets.length; i++) {
            var str = tweets[i].text;

            //Strip out the urls and newlines
            str = str.replace(/http\S+/g, '');
            str = str.replace('\n', ' ');
            str = str.trim();
            str = decodeString(str);

            if (!str) { continue; }

            text += str + '\n';
        }

        fs.writeFile('output.txt', text, function(err) {
            if (err){
                return console.log(err);
            }
            console.log("Saved tweets to output.txt");
            isReady = true;
        });

    });
}

function generateTweets(number) {
    return new Promise(function(resolve, reject) {
        if (!isReady) {
            return reject("No tweets have been loaded");
        }

        fs.readFile('output.txt', function(err, text) {
            text = text.toString().trim();

            var chain = new Text(text);
            var tweets = [];

            var errors = 0;

            while (tweets.length < number) {
                if (errors > (10 * number)) {
                    return reject("Too many failed attempts. Change settings");
                }

                var test = chain.makeSentence({
                    maxChars: 140,
                    tries: 25,
                    maxOverlapRatio: 0.7
                });

                if (typeof(test) !== 'string'){
                    errors++;
                    continue;
                }

                tweets.push(test.trim());
            }

            resolve(tweets);
        });
    })
}

function startTimer(period) {
    stopTimer();

    interval = setInterval(function() {
        generateTweets(1).then(function(res) {
            var tweet = res[0];

            twitter.postTweet(tweet).then(function(tw, res) {
                console.log("Tweet posted: " + tw.text);
            }, function(err) {
                console.log("Error encountered. Stopping timer", err);
                stopTimer();
            });
        })
    }, period);
}

function stopTimer() {
    if (interval) {
        clearInterval(interval);
    }
}

function decodeString(str) {
    var ret = str.replace(/&gt;/g, '>');
    ret = ret.replace(/&lt;/g, '<');
    ret = ret.replace(/&quot;/g, '"');
    ret = ret.replace(/&apos;/g, "'");
    ret = ret.replace(/&amp;/g, '&');
    return ret;
}

//TODO: get tweets
//TODO: analyze tweets
//TODO: generate new tweets