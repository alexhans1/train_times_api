const express = require('express');
const router = express.Router();
const request = require('request-promise');
const moment = require('moment-timezone');

const vbbApiBaseUrl = 'http://fahrinfo.vbb.de/restproxy/';

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
            if (!parsedBody.StopLocation) {
                console.error('No StopLocation');
                res.send([]);
                return
            }
            res.send(parsedBody.StopLocation || [])
        })
        .catch(function (e) {
            console.error(e);
            res.send({error: true, message: 'Error while searching VBB locations.'});
        });
    } catch (ex) {
        console.error(ex);
        res.send({error: true, message: 'Error while searching VBB locations.'});
    }
});

router.get('/getDepartures/:id/:products?', function(req, res) {
    try {
        console.info('Retrieving VBB departures');
        let getDeparturesOptions = {
            method: 'GET',
            url: buildUrl('departureBoard', {
                id: req.params.id,
                products: req.params.products || null,
            }),
            json: true,
        };

        request(getDeparturesOptions)
        .then(function (parsedBody) {
            if (!parsedBody.Departure || parsedBody.Departure === []) {
                console.error('No departures', parsedBody);
                res.send([]);
                return
            }
            res.send(parsedBody.Departure.map((departure) => {
                const now = moment().tz("Europe/Berlin").format();
                const hasRealTimeData = !!(departure.rtDate && departure.rtTime);
                const departureTime = moment((departure.rtDate || departure.date) + ' ' + (departure.rtTime || departure.time));
                const duration = moment.duration(departureTime.diff(now));
                const timeUntilDeparture = Math.round(duration.asMinutes());

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
                    hasRealTimeData,
                    timeUntilDeparture,
                }
            }).sort((a, b) => a.timeUntilDeparture - b.timeUntilDeparture));
        })
        .catch(function (e) {
            console.error(e);
            res.send({error: true, message: 'Error while retrieving VBB departures.'});
        });
    } catch (ex) {
        console.error(ex);
        res.send({error: true, message: 'Error while retrieving VBB departures.'});
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
