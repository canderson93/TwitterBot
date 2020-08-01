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
function pullTweets(total) {
    total = total || 500;
    var num = 0;

    var requestBatch = function(id, lastTweet, errNum) {
        return new Promise(function(resolve, reject) {
            if (num >= total || errNum > 3) {
                resolve([]);
                return;
            }

            var params = {
                user_id: id,
                include_rts: false,
                exclude_replies: true,
                trim_user: true,
                count: 200,
                tweet_mode: "extended"
            };

            if (lastTweet) {
                params.max_id = lastTweet.id;
            }

            getTweets(params).then(function(tweets) {
                if (tweets.length < 10) {
                    errNum += 1;
                }

                num += tweets.length;
                requestBatch(id, tweets[tweets.length - 1], errNum).then(function(res) {
                    resolve(tweets.concat(res));
                }, function() {
                    resolve(tweets)
                })
            }, function(err) {
                console.log(err);
                reject(err);
            })
        });
    };

    return new Promise(function(resolve, reject) {
        getFollowing().then(function(res) {
            var promises = [];

            for (var i = 0; i < res.ids.length; i++){
                promises.push(requestBatch(res.ids[i] ));
            }

            Promise.all(promises).then(function(data) {
                var tweets = [];

                for (var i = 0; i < data.length; i++) {
                    tweets = tweets.concat(data[i]);
                }
                resolve(tweets);
            }, reject);
        },
        function(err) {
            console.log(err);
        })
    })
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

function getFollowing() {
    return new Promise(function(resolve, reject) {
        client.get('friends/ids', {
            count: 5000
        }, function (err, res) {
            if (err) {
                return reject(err);
            }

            resolve(res);
        })
    })
}

/**
 * Post tweet to twitter
 */
function postTweet(status) {
    return new Promise(function(resolve, reject) {
        client.post('statuses/update', {
            status: status
        }, function (err, tweet, res) {
            if (err){
                return reject(err);
            }

            resolve(tweet, res);
        });
    });
}

