/**
 * scripts/main.js
 *
 * This is the starting point for your application.
 * Take a look at http://browserify.org/ for more info
 */

'use strict';

var Fetcher = require('./Fetcher.js');
var Progress = require('./Progress.js');
var d3 = require('d3-browserify');
var moment = require('moment');

var plotView = $('#plot');

function showPlot(data) {
	plotView.empty();

	// add some margins around the graph
	var margins = {
		'left' : 70,
		'right' : 30,
		'top' : 30,
		'bottom' : 50
	};

	var width = $(document).width();
	var height = $(document).height() - 100; // height of title bar

	// this will be the color scale for the dots, oldest being blue, newest being red
	var colors = d3.scale.linear()
		.domain([0,data.length])
		.interpolate(d3.interpolateHsl)
		.range(['#ff0000', '#0000ff']);

	// add the SVG component #plot
	var svg = d3.select('#plot')
		.append('svg').attr('width', width).attr('height', height)
		.append('g').attr('transform', 'translate(' + margins.left + ',' + margins.top + ')');

	// build the x and y domain and range
	var x = d3.scale.linear()
		.domain(d3.extent(data, function (d) {
			return parseFloat(d[0].Close);
		}))
		.range([0, width - margins.left - margins.right]);

	var y = d3.scale.linear()
		.domain(d3.extent(data, function (d) {
			return parseFloat(d[1].Close);
		}))
		.range([height - margins.top - margins.bottom, 0]);

	// functions to produces the axes
	function xAxis() {
		return d3.svg.axis()
			.scale(x)
			.orient('bottom')
			.tickPadding(2);
	}

	function yAxis() {
		return d3.svg.axis()
			.scale(y)
			.orient('left')
			.tickPadding(2);
	}

	// make background grid
	svg.append('g')
		.attr('class', 'grid')
		.attr('transform', 'translate(0,' + height + ')')
		.call(xAxis()
			.tickSize(-height, 0, -margins.bottom - 30)
			.tickFormat('')
		);

	svg.append('g')
		.attr('class', 'grid')
		.call(yAxis()
			.tickSize(-width, 0, 0)
			.tickFormat('')
		);

	// draw x and y axes
	svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + y.range()[0] + ')');
	svg.append('g').attr('class', 'y axis');

	svg.selectAll('g.y.axis').call(yAxis());
	svg.selectAll('g.x.axis').call(xAxis());

	// draw axes names
	svg.append('text')
		.attr('fill', '#555')
		.attr('class', 'label')
		.attr('text-anchor', 'end')
		.attr('x', width / 2)
		.attr('y', height - 35)
		.text(data[0][0].Symbol);

	svg.append('text')
		.attr('fill', '#555')
		.attr('class', 'label')
		.attr('transform', 'rotate(-90)')
		.attr('y', -50)
		.attr('x', - (height / 2))
		.attr('dy', '.71em')
		.text(data[0][1].Symbol);


	var tooltip = d3.select('body').append('div')
		.attr('class', 'tooltip')
		.style('opacity',0);







	// figure out least squares regression
	var xSeries = data.map(function(d) { return parseFloat(d[0].Close)});
	var ySeries = data.map(function(d) { return parseFloat(d[1].Close)});

	var leastSquaresCoeff = leastSquares(xSeries, ySeries);

	// print r squared
	svg.append('text')
		.attr('class', 'label')
		.attr('x', width - 200)
		.attr('y', height - 35)
		.text('r squared: ' + leastSquaresCoeff[2].toFixed(2).toString());

	// print slope
	svg.append('text')
		.attr('class', 'label')
		.attr('x', width - 200)
		.attr('y', height - 45)
		.text('slope: ' + leastSquaresCoeff[0].toFixed(2).toString());

	// add trendline
	var lineFunction = d3.svg.line()
		.x(function(d) { return parseFloat(x(d[0].Close)); })
		.y(function(d) { return parseFloat(y(d[1].Close)); })
		.interpolate('cardinal');

	var pathline = svg.selectAll('.' + 'pathline')
		.data(data);

	// make the plot visible
	plotView.animate({opacity:1});

	plotTrendline(leastSquaresCoeff, 'trendline', '#888', 2);

	var sd = standardDeviation(data);

	// plot a trendline 1 standard deivation up
	var coeffSdTop = leastSquaresCoeff;
	coeffSdTop[1] += sd;
	plotTrendline(coeffSdTop, 'sdline', '#555', 1);

	// plot a trendline 1 standard deviation down
	var coeffSdBottom = leastSquaresCoeff;
	coeffSdBottom[1] -= 2 * sd;
	plotTrendline(coeffSdBottom, 'sdline2', '#555', 1);


	var day = svg.selectAll('g.node').data(data, function (d) {
		return d[2]; // this is the date string and will let d3 know the uniqueness of the item
	});

	var dayGroup = day.enter().append('g').attr('class', 'node')
		.attr('transform', function(d) {
			return 'translate(' + x(d[0].Close) + ',' + y(d[1].Close) + ')';
		});

	var monthsAgo = parseInt($('input#months_ago').val());

	// draw circles
	dayGroup.append('circle')
		.attr('r',0)
		.attr('class', 'dot')
		.style('fill', function(d) {
			return colors(data.indexOf(d));
		})
		.on('mouseover', function(d) {
			tooltip.transition()
				.duration(200)
				.style('opacity', .9);
			tooltip.html('<b>'+ moment(d[2],'YYYY-MM-DD').format('LL')+'</b>' + '<br/>'+ d[0].Symbol + ': ' + d[0].Close + '<br />' +d[1].Symbol + ': ' + d[1].Close)
				.style('left', (d3.event.pageX + 5) + 'px')
				.style('top', (d3.event.pageY - 28) + 'px');
		})
		.on('mouseout', function(d) {
			tooltip.transition()
				.duration(500)
				.style('opacity',0);
		})
		.transition()
		.attr('r', function(d) {
			if (data.indexOf(d) == 0 ) {
				var that = this;
				setInterval(function(){d3.select(that).attr('r',12).transition().duration(300).attr('r',10)},1000);
				return 10;
			} else {
				return 5;
			}
		}).duration(200).delay(function(d) {
			return (data.length - data.indexOf(d)) * (5/monthsAgo*3);
		});

		// some plotting functions

	function plotTrendline(leastSquaresCoeff, cssClass, color, width) {
		var x1 = d3.min(xSeries);
		var y1 = trendlineY(d3.min(xSeries));

		if ( y1 < d3.min(ySeries) ) {
			y1 = d3.min(ySeries);
			x1 = trendlineX(y1);
		} else if ( y1 > d3.max(ySeries) ) {
			y1 = d3.max(ySeries);
			x1 = trendlineX(y1);
		}

		var x2 = d3.max(xSeries);
		var y2 = trendlineY(d3.max(xSeries));

		if (y2 > d3.max(ySeries)) {
			y2 = d3.max(ySeries);
			x2 = trendlineX(y2);
		} else if (y2 < d3.min(ySeries) ) {
			y2 = d3.min(ySeries);
			x2 = trendlineX(y2);
		}

		var trendData = [[x1, y1, x2, y2]];
		var trendline = svg.selectAll('.' + cssClass)
			.data(trendData);

		trendline.enter()
			.append('line')
			.attr('class', cssClass)
			.attr('x1', function(d) {return x(d[0]);})
			.attr('y1', function(d) {return y(d[1]);})
			.attr('x2', function(d) {return x(d[2]);})
			.attr('y2', function(d) {return y(d[3]);})
			.attr('stroke-dasharray', '10,10')
			.attr('stroke', color)
			.attr('stroke-width', width)
			.attr('opacity',0) // start at 0 opacity, and fade in
			.transition()
			.attr('opacity',1)
			.duration(1000);
	}

	function trendlineY(xVal) {
		return leastSquaresCoeff[0]*xVal + leastSquaresCoeff[1];
	}

	function trendlineX(yVal) {
		return (yVal - leastSquaresCoeff[1]) / leastSquaresCoeff[0];
	}

	// figure out the standard deviation
	function standardDeviation(data){
		var squareDiffs = data.map(function(day){
			var diff = day[1].Close - trendlineY(day[0].Close);
			var sqrDiff = diff * diff;
			return sqrDiff;
		});

	  var avgSquareDiff = average(squareDiffs);

	  var stdDev = Math.sqrt(avgSquareDiff);
	  return stdDev;
	}

	function average(data){
	  var sum = data.reduce(function(sum, value){
	    return sum + value;
	  }, 0);

	  var avg = sum / data.length;
	  return avg;
	}

}




// returns slope, intercept and r-square of the line
function leastSquares(xSeries, ySeries) {
	var reduceSumFunc = function(prev, cur) { return prev + cur; };

	var xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length;
	var yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length;

	var ssXX = xSeries.map(function(d) { return Math.pow(d - xBar, 2); })
		.reduce(reduceSumFunc);

	var ssYY = ySeries.map(function(d) { return Math.pow(d - yBar, 2); })
		.reduce(reduceSumFunc);

	var ssXY = xSeries.map(function(d, i) { return (d - xBar) * (ySeries[i] - yBar); })
		.reduce(reduceSumFunc);

	var slope = ssXY / ssXX;
	var intercept = yBar - (xBar * slope);
	var rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);

	return [slope, intercept, rSquare];
}



$('input#d2').val(moment().format('YYYY-MM-DD'));

function getDateRange() {
	var monthsAgo = $('input#months_ago').val();
	var d2 = $('input#d2').val();
	var d1 = moment(d2, 'YYYY-MM-DD').subtract(parseInt(monthsAgo), 'months').format('YYYY-MM-DD');
	// console.log({ start: d1, end: d2 });
	return { start: d1, end: d2 };
}

// on page load, retrieve initial stock data
function fetchAndPlot() {
	Fetcher.getQuotesForStockPairSortedByDay({
		stocks: [$('#s1').val(), $('#s2').val()],
		startDate: getDateRange().start,
		endDate: getDateRange().end
	}).then(showPlot);
}

fetchAndPlot();

function handleSubmit() {
	// fade out existing chart
	plotView.animate({opacity:0},300);

	// retrieve the data, and call showPlot() when complete
	fetchAndPlot();
}

var form = $('#req_form').submit(function(e) {
	e.preventDefault();
	handleSubmit();
});
