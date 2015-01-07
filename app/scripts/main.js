/**
 * scripts/main.js
 *
 * This is the starting point for your application.
 * Take a look at http://browserify.org/ for more info
 */

'use strict';

// other packages in /scripts
var Fetcher = require('./fetcher.js');
var Progress = require('./progress.js');
var Plotter = require('./plotter.js');

// outside packages
var $ = require('jquery-browserify');
var moment = require('moment');

// convert end date and months ago into start and end dates
function getDateRange() {
	var monthsAgo = $('input#months_ago').val();
	var d2 = $('input#d2').val();
	var d1 = moment(d2, 'YYYY-MM-DD').subtract(parseInt(monthsAgo), 'months').format('YYYY-MM-DD');
	return { start: d1, end: d2 };
}

// on page load, retrieve initial stock data
function fetchAndPlot() {
	Fetcher.getQuotesForStockPairSortedByDay({
		stocks: [$('#s1').val(), $('#s2').val()],
		startDate: getDateRange().start,
		endDate: getDateRange().end
	}).then(Plotter.showPlot);
}

// form handling function
function handleSubmit() {
	// fade out existing chart
	$('#plot').animate({opacity:0},300);
	fetchAndPlot();
}

// setup form handling hook
var form = $('#req_form').submit(function(e) {
	e.preventDefault();
	console.log('submit');
	handleSubmit();
});

// put today's date in d2 field and do a plot on the default values (see index.html)
$('input#d2').val(moment().format('YYYY-MM-DD'));
fetchAndPlot();