
var Twitter = require('twitter');
var client = new Twitter({
	consumer_key: process.env.TWITTER_API_KEY,
	consumer_secret: process.env.TWITTER_API_SECRET,
	access_token_key: process.env.TWITTER_ACCESS_TOKEN,
	access_token_secret: process.env.TWITTER_ACCESS_SECRET
});

module.exports = {
	pullTweets: pullTweets,
	postTweet: postTweet
};

/**
* Pull tweets down from twitter
*/
function pullTweets() {
	return new Promise(function(resolve, reject) {
        var tweets = [];
        client.get('statuses/user_timeline', {
            screen_name: 'meladoodle'
        }, function(err, res){
            if (err){
                reject(err);
                return;
            }

            for (var i = 0; i < res.length; i++) {
                var isRetweet = res[i].retweeted || res[i].text.match('^RT');
                var isReply = !!res[i].in_reply_to_screen_name;

                if (!isRetweet && !isReply) {
                    tweets.push(res[i]);
                }
            }

            resolve(tweets);
        });
	});
}

/**
* Pull tweets down from twitter
*/
function postTweet(status) {
	client.post('statuses/update', {
		status: status
	}, function(err, tweet, res) {
		if (!err) {
			console.log(tweet);
			console.log(res);
		} else {
			console.log(err);
		}
	});
}

