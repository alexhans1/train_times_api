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

router.get('/getDepartures/:extId/:products?', function(req, res) {
	try {
		console.info('Retrieving VBB departures');
		let getDeparturesOptions = {
			method: 'GET',
			url: buildUrl('departureBoard', {
				extId: req.params.extId,
				maxJourneys: 6,
				products: req.params.products || null,
			}),
			json: true,
		};

		request(getDeparturesOptions)
		.then(function (parsedBody) {
			if (!parsedBody.Departure) {
			  res.send([]);
			}
			res.send(parsedBody.Departure.map((departure) => {
				return {
					name: departure.name,
					line: departure.Product.line,
					time: departure.time,
					date: departure.date,
					tz: departure.tz,
					rtTime: departure.rtTime,
					rtDate: departure.rtDate,
					rtTz: departure.rtTz,
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
