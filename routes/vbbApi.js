const express = require('express');
const router = express.Router();
const request = require('request-promise');

const vbbApiBaseUrl = 'http://demo.hafas.de/openapi/vbb-proxy/';

router.get('/searchLocations/:searchInput', function(req, res) {
	try {
		console.info('Searching VBB locations.');
		let searchLocationsOptions = {
			method: 'GET',
			url: buildUrl('location.name', {
				input: req.params.searchInput,
				type: 'S',
			}),
			json: true,
		};

		request(searchLocationsOptions)
		.then(function (parsedBody) {
			res.send(parsedBody.stopLocationOrCoordLocation.map(({StopLocation}) => StopLocation) || [])
		})
		.catch(function (e) {
			console.error(e);
			res.send('Error while searching VBB locations.');
		});
	} catch (ex) {
		console.error(ex);
		res.send('Error while searching VBB locations.');
	}
});

router.get('/getDepartures/:extId', function(req, res) {
	try {
		console.info('Retrieving VBB departures');
		let getDeparturesOptions = {
			method: 'GET',
			url: buildUrl('departureBoard', {
				extId: req.params.extId,
				maxJourneys: 6,
			}),
			json: true,
		};

		request(getDeparturesOptions)
		.then(function (parsedBody) {
			res.send(parsedBody.Departure.map((departure) => {
				return {
					name: departure.name,
					time: departure.time,
					rtime: departure.rtime,
					direction: departure.direction,
					trainCategory: departure.trainCategory,
				}
			}))
		})
		.catch(function (e) {
			console.error(e);
			res.send('Error while retrieving VBB departures.');
		});
	} catch (ex) {
		console.error(ex);
		res.send('Error while retrieving VBB departures.');
	}
});

module.exports = router;

const buildUrl = (path, parameterObj = {}) => {
	let url = vbbApiBaseUrl + path + '?accessId=' + process.env.vbbApiAccessId + '&format=json';
	Object.keys(parameterObj).forEach((key) => {
		url += '&' + key + '=' + parameterObj[key];
	});
	return url;
};
