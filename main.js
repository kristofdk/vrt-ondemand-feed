var http = require('follow-redirects').http;
var url = require('url');
var fs = require('fs');
var path = require('path');
var jsonPath = require('JSONPath');

const downloadDir = 'C:\\Temp\\Download';

function findStreamUrl(collectionId, cb) {
	var requestOptions = {
	  hostname: 'services.vrt.be',
	  port: 80,
	  path: '/ondemand/collections/' + collectionId + '/entries',
	  method: 'GET',
	  headers: { 'accept': 'application/vnd.ondemand.vrt.be.entries_1.2+json' }
	};

	http.get(requestOptions, function(res) {
		var body = '';
		
		res.on('data', function(chunk) {
			body += chunk;
		});

		res.on('end', function() {
			var streamUrl = jsonPath.eval(JSON.parse(body), '$..files[?(@.bitrate==256)].url')[0];

			cb(streamUrl)
		});
	}).on('error', function(e) {
		console.log("Error when finding stream url: " + e.message);
	});
}

function downloadStream(streamUrl) {
	var filename = streamUrl.substr(streamUrl.lastIndexOf('/') + 1);

	var parsedStreamUrl = url.parse(streamUrl);

	var fileWriteStream = fs.createWriteStream(path.join(downloadDir, filename), {});
	fileWriteStream.on('error', function(e) {
		console.log("Error when writing to file: " + e.message);
	});

	var options = {
		hostname: parsedStreamUrl.hostname,
		port: 80,
		path: parsedStreamUrl.path,
		method: 'GET'
	};

	var req = http.request(options, function(res) {
		res.on('data', function (chunk) {
			var successfulWrite = fileWriteStream.write(chunk);
		});
	});
	req.setTimeout(5000);
	req.on('end', function() {
		req.end();
		fileWriteStream.end();
	});
	req.on('error', function(e) {
		console.log('Error when fetching stream: ' + e.message);
	});
	req.end();
}

[
	'b46955dd-91ef-11e3-b45a-00163edf75b7', // duyster
	'e2889321-90d2-11e3-b45a-00163edf75b7', // de afrekening
	'76d642c3-91c7-11e4-bdf6-00163edf75b7', // de hotlist
].forEach(function (collectionId) {
	findStreamUrl(collectionId, function(streamUrl) {
		downloadStream(streamUrl);
	})
});
