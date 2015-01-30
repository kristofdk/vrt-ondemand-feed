var http = require('follow-redirects').http;
var url = require('url');
var fs = require('fs');
var jsonPath = require('JSONPath');

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

/* Test for Duyster */
findStreamUrl('b46955dd-91ef-11e3-b45a-00163edf75b7', function(streamUrl) {
	var parsedStreamUrl = url.parse(streamUrl);

	var fileWriteStream = fs.createWriteStream('C:\\Temp\\duyster.mp3', {})
	fileWriteStream.on('error', function(e) {
		console.log("Error when writing to file: " + e.message);
	});

	var options = {
		hostname: parsedStreamUrl.hostname,
		port: parsedStreamUrl.port,
		path: parsedStreamUrl.path,
		method: 'GET'
	};

	var req = http.request(options, function(res) {
		console.log('STATUS: ' + res.statusCode);
		console.log('HEADERS: ' + JSON.stringify(res.headers));
		
		res.on('data', function (chunk) {
			var successfulWrite = fileWriteStream.write(chunk);
			console.log(successfulWrite);
		});
	});
	req.on('end', function() {
		req.end();
		fileWriteStream.end();
	});
	req.on('error', function(e) {
		console.log('Error when fetching stream: ' + e.message);
	});
});
