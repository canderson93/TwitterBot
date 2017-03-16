
var Chain = require('markov-chains').default;
var Text = require('markov-chains-text').default;

var sbd = require('sbd');

function generateMarkovChain(text, stateSize) {
    stateSize = stateSize || 2;

    var sentences = sbd.sentences(text, {
        newline_boundaries : true
    });

    var runs = sentences.filter(filterInvalidSentence).map(splitWords);
    var rejoinedText = runs.map(function(words) {
        return words.join(' ');
    }).join(' ');

    var chain = new Text('', {
        chain: new Chain(runs, {stateSize: stateSize})
    });
    chain.rejoinedText = rejoinedText;

    return chain;
}

function filterInvalidSentence(sentence) {
    var rejectPattern = /(^')|('$)|\s'|'\s|["()[\]“”]/;
    return !rejectPattern.test(sentence);
}

function splitWords(sentence) {
    var wordSplitPattern = /\s+/;
    return sentence.split(wordSplitPattern);
}



exports.generateMarkovChain = generateMarkovChain;