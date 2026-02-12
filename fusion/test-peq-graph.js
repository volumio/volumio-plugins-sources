#!/usr/bin/env node
// Temporary mock server for visually testing peq-graph.html without a Volumio device.
// Usage:  node fusion/test-peq-graph.js [--mode mixed|merged]
//   --mode mixed   (default) Mixed L/R scopes — shows separate Combined L + Combined R curves
//   --mode merged  All filters L+R — shows single Combined L+R curve
// Then open http://localhost:10015

'use strict';

var http = require('http');
var fs = require('fs');
var path = require('path');

var PORT = 10015;

// Parse --mode argument
var mode = 'mixed';
var args = process.argv.slice(2);
for (var a = 0; a < args.length; a++) {
  if (args[a] === '--mode' && a + 1 < args.length) {
    mode = args[a + 1];
    break;
  }
}

if (mode !== 'mixed' && mode !== 'merged') {
  console.error('Unknown mode: ' + mode + '. Use "mixed" or "merged".');
  process.exit(1);
}

// Mock mergedeq strings for each mode
var testData = {
  // Mixed L/R scopes: Eq5 is R-only, Eq6 is L-only — shows separate Combined L + Combined R curves
  mixed: 'Eq0|Peaking|L+R|1000,5,2.5|Eq1|Lowshelf|L+R|200,-3,6|Eq2|Highshelf|L+R|8000,4,6|Eq3|Highpass|L+R|30,0.707|Eq4|Notch|L+R|50,5|Eq5|Lowpass|R|12000,0.707|Eq6|ButterworthHighpass|L|80,4|Eq7|Peaking2|L+R|3000,-2,1.5|Eq8|LowpassFO|L+R|15000|Eq9|HighshelfFO|L+R|5000,3|',
  // All filters L+R — shows single Combined L+R curve
  merged: 'Eq0|Peaking|L+R|1000,5,2.5|Eq1|Lowshelf|L+R|200,-3,6|Eq2|Highshelf|L+R|8000,4,6|Eq3|Highpass|L+R|30,0.707|Eq4|Notch|L+R|50,5|Eq5|Lowpass|L+R|12000,0.707|Eq6|ButterworthHighpass|L+R|80,4|Eq7|Peaking2|L+R|3000,-2,1.5|Eq8|LowpassFO|L+R|15000|Eq9|HighshelfFO|L+R|5000,3|'
};

var mergedeq = testData[mode];

var sampleRate = 44100;

// ---- Parse mergedeq (same logic as index.js lines 1846-1863) ----

function parseMergedeq(mergedeqStr) {
  var parts = mergedeqStr.toString().split('|');
  var filters = [];

  for (var i = 0; i + 3 < parts.length; i += 4) {
    var indexMatch = parts[i].match(/\d+/);
    var filterIndex = indexMatch ? parseInt(indexMatch[0]) : i / 4;
    var type = parts[i + 1];
    var scope = parts[i + 2];
    var paramStr = parts[i + 3];
    if (!type || type === 'None' || type === 'undefined') continue;
    var params = paramStr.split(',').map(Number);
    filters.push({
      index: filterIndex,
      type: type,
      scope: scope,
      params: params
    });
  }

  return filters;
}

// ---- HTTP server ----

var server = http.createServer(function (req, res) {
  if (req.method === 'GET' && req.url === '/') {
    fs.readFile(path.join(__dirname, 'peq-graph.html'), function (err, data) {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.method === 'GET' && req.url === '/api/peq') {
    var filters = parseMergedeq(mergedeq);
    var result = {
      sampleRate: sampleRate,
      filters: filters
    };

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(result));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, function () {
  console.log('PEQ graph test server running at http://localhost:' + PORT);
  console.log('Mode: ' + mode + (mode === 'mixed' ? ' (separate Combined L + Combined R curves)' : ' (single Combined L+R curve)'));
  console.log('Mock filters:');
  var filters = parseMergedeq(mergedeq);
  filters.forEach(function (f) {
    console.log('  Eq' + f.index + ' ' + f.type + ' [' + f.scope + '] (' + f.params.join(', ') + ')');
  });
  console.log('\nPress Ctrl+C to stop.');
});
