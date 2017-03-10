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
function pullTweets(loops) {
    loops = loops || 5;

    var requestBatch = function(num, lastTweet) {
        return new Promise(function(resolve, reject) {
            if (num >= loops) {
                resolve([]);
                return;
            }

            console.log("Requesting tweet batch "+(num+1));

            var params = {
                screen_name: 'meladoodle',
                include_rts: 0,
                exclude_replies: 1,
                trim_user: 1,
                count: 200
            };

            if (lastTweet) {
                params.max_id = lastTweet.id;
            }

            getTweets(params).then(function(tweets) {
                console.log("Received "+tweets.length+" items");
                requestBatch(num + 1, tweets[tweets.length - 1]).then(function(res) {
                    resolve(tweets.concat(res));
                })
            })
        });
    };

    return new requestBatch(0, null);
}

function getTweets(params) {
    return new Promise(function (resolve, reject) {

        client.get('statuses/user_timeline', params, function (err, res) {
            if (err) {
                reject(err);
                return;
            }

            resolve(res);
        });
    });
}

/**
 * Pull tweets down from twitter
 */
function postTweet(status) {
    client.post('statuses/update', {
        status: status
    }, function (err, tweet, res) {
        if (!err) {
            console.log(tweet);
            console.log(res);
        } else {
            console.log(err);
        }
    });
}

