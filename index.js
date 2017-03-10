
require('dotenv').config();

var twitter = require('./src/twitter');
var Text = require('markov-chains-text').default;

twitter.pullTweets(25).then(function(tweets){
    var text = "";
    for (var i = 0; i < tweets.length; i++) {
        var str = tweets[i].text;

        //Strip out the urls and newlines
        str = str.replace(/http\S+/g, '');
        str = str.replace('\n', ' ');

        if (!text) { continue; }

        text += str + '\n';
    }

    console.log(text);

    var chain = new Text(text);

    for (var i = 0; i < 25; i++) {
        var test = chain.makeSentence({
            maxChars: 160
        });
        console.log(test);
    }

});
//TODO: get tweets
//TODO: analyze tweets
//TODO: generate new tweets