const {Lexer, Tagger} = require('pos');
const {PresentVerbInflector} = require('natural');
const _ = require('lodash');
const sentencer = require('sentencer');
const contractions = require('contractions');

const lexer = new Lexer();
const tagger = new Tagger();
const verbInflector = new PresentVerbInflector();

const mapTaggedWords = (taggedWords) => {
  const map = {};
  for(const [word, pos] of taggedWords) {
    if(!map[pos]) {
      map[pos] = [];
    }
    map[pos].push(word);
  }
  return map;
};

// replaces parts of speech of first sentence with random word
// of same part of speech from second sentence
const scrambleSentence = (s1, s2) => {
  const words1 = lexer.lex(s1);
  const taggedWords1 = tagger.tag(words1);
  const words2 = lexer.lex(s2);
  const taggedWords2 = tagger.tag(words2);
  const mappedTaggedWords2 = mapTaggedWords(taggedWords2);
  return taggedWords1.map(([word, pos]) => {
    const arr = mappedTaggedWords2[pos];
    return !_.isEmpty(arr) ? arr.splice(_.random(arr.length - 1), 1) : word;
  }).join(' ');
};

const joinAsSentence = (words, tagged) => {
  return words.map((word, i) =>
    i === 0 || words[i - 1] === "'" ||
      ',.:$#"()'.split('').includes(tagged[i][1]) ? word : ' ' + word
  ).join('')
};

// replaces a random noun or pronoun from the sentence,
// optionally adding an adjective before it
const replaceRandomNoun = (s1, addAdjective = true) => {
  if(!s1.trim()) return '';
  const expandedSentence = contractions.expand(s1);
  const firstLetter = s1.trim()[0];
  const startsWithCapital = firstLetter.toLowerCase() !== firstLetter;
  let expanded = false;
  if(expandedSentence !== s1) {
    expanded = true;
    s1 = expandedSentence;
  }
  const words = lexer.lex(s1);
  const tagged = tagger.tag(words);
  const nounIndices = tagged.map(([word, pos], i) =>
    pos.startsWith('NN') || pos === 'PRP' ? i : null
  ).filter(i => i !== null);
  let index;
  while(true) {
    if(nounIndices.length === 0) return joinAsSentence(words, tagged);
    const i = _.random(nounIndices.length - 1);
    index = nounIndices[i];
    if(words[index - 1] !== "'") break;
    else nounIndices.splice(i, 1);
  }
  const [word, pos] = tagged[index];
  const isPlural = pos.endsWith('S') || pos === 'PRP' && ['we', 'they'].includes(word.toLowerCase());
  words[index] = `${pos === 'PRP' ? 'the ' : ''}${addAdjective ? '{{adjective\}\}': ''} {{noun${isPlural ? 's' : ''}}}`;
  if(words[index + 1] && tagged[index + 1][1].startsWith('VB')) {
    words[index + 1] = isPlural ?
      verbInflector.pluralize(words[index + 1]) :
      verbInflector.singularize(words[index + 1]);
  }
  if(index === 0 && startsWithCapital) {
    const chars = words[0].split('');
    chars[0] = chars[0].toUpperCase();
    words[0] = chars.join('');
  }
  const replacedSentence = sentencer.make(joinAsSentence(words, tagged));
  return expanded ? contractions.contract(replacedSentence) : replacedSentence;
};

const replaceRandomNounAllSentences = (text) => {
  return text.split('.').map((s) => replaceRandomNoun(s)).join('. ');
};

module.exports = {
  scrambleSentence,
  replaceRandomNoun,
  replaceRandomNounAllSentences
};
