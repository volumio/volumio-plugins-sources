'use strict';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Recursively match each property of `obj` against `predicate` and returns the values of matches.
 * @param {*} obj 
 * @param {*} predicate `function(key, value)`
 * @returns List of values of matched properties. Only deepest matches are included.
 */
function findInObject(obj, predicate) {
  const matches = [];
  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      let lastMatch;
      if (predicate(key, value)) {
        lastMatch = value;
      }
      if (typeof value === 'object') {
        const nestedMatches = findInObject(value, predicate);
        // If there are nested objects that match predicate, then add those instead 
        // of parent match (i.e. `lastMatch`, if any).
        if (nestedMatches.length > 0) {
          matches.push(...nestedMatches);
        }
        else if (lastMatch) {
          matches.push(lastMatch);
        }
      }
      else if (lastMatch) {
        matches.push(lastMatch);
      }
    }
  }
  else if (Array.isArray(obj)) {
    for (const value of obj) {
      matches.push(...findInObject(value, predicate));
    }
  }
  return matches;
}

module.exports = {
  sleep,
  rnd,
  findInObject
};
