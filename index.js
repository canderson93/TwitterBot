
require('dotenv').config();

//var talisman = require('talisman');

var twitter = require('./src/twitter');

twitter.pullTweets().then(function(tweets){
    for (var i = 0; i < tweets.length; i++) {
        console.log(tweets[i].text);
    }
});
//TODO: get tweets
//TODO: analyze tweets
//TODO: generate new tweets