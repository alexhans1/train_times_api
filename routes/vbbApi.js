const express = require('express');
const router = express.Router();
const request = require('request-promise');
const _ = require('lodash');

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
				// maxJourneys: 6,
				products: req.params.products || null,
				direction: req.query.direction || null,
			}),
			json: true,
		};

		request(getDeparturesOptions)
		.then(function (parsedBody) {
			if (!parsedBody.Departure || parsedBody.Departure === []) {
			  res.send([]);
			}
			console.log(parsedBody);
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
			}).slice(0,6));
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

router.get('/getLines/:extId', function(req, res) {
	try {
		console.info('Retrieving VBB lines at station');
		const getLinesOptions = {
			method: 'GET',
			url: buildUrl('departureBoard', {
				extId: req.params.extId,
			}),
			json: true,
		};

		request(getLinesOptions)
		.then(function (parsedBody) {
			if (!parsedBody.Departure || parsedBody.Departure === []) {
			  res.send([]);
			}
			let availAbleLines = (_.sortBy(_.uniqWith(parsedBody.Departure.map((departure) => {
				return {
					line: departure.Product.line,
					type: departure.Product.catOut.replace(/\s/g, ''),
					direction: departure.direction,
				}
			}), _.isEqual), ['type', 'line']));
            if (!availAbleLines || availAbleLines === []) {
                res.send([]);
                return
            }
            const getDestinationId = async (direction, index) => {
                try {
                    const getDestinationIdOptions = {
                        method: 'GET',
                        url: buildUrl('location.name', {
                            input: direction,
                            type: 'S',
                        }),
                        json: true,
                    };

                    await request(getDestinationIdOptions)
                        .then((parsedBody) => {
                        	console.log(parsedBody.stopLocationOrCoordLocation[0].StopLocation.id);
                            availAbleLines[index].destinationId = parsedBody.stopLocationOrCoordLocation[0].StopLocation.extId || null;
                        })
                } catch (ex) {
                    console.error('Error while getting destination ID');
                    console.error(ex)
                }
            };
            for (let i = 0; i < availAbleLines.length; i++) {
                getDestinationId(availAbleLines[i].direction, i);
			}
			const time = Date.now();
			const interval = setInterval(() => {
                let isReady = true;
                availAbleLines.forEach((line) => {
                    if (!line.destinationId) {
                        isReady = false;
                    }
                });
                if (isReady) {
                    res.send(availAbleLines);
                    clearInterval(interval);
                }
                if (time - Date.now() > 10000) {
                    res.send([]);
                    clearInterval(interval);
                }
            }, 100)
		})
		.catch(function (e) {
			console.error(e);
			res.send('Error while getting VBB lines at station.');
		});
	} catch (ex) {
		console.error(ex);
		res.send('Error while getting VBB lines at station.');
	}
});

module.exports = router;

const buildUrl = (path, parameterObj = {}) => {
	let url = vbbApiBaseUrl + path + '?accessId=' + process.env.vbbApiAccessId + '&format=json';
	Object.keys(parameterObj).forEach((key) => {
        if (parameterObj[key]) {
			url += '&' + key + '=' + parameterObj[key];
        }
	});
	return url;
};
