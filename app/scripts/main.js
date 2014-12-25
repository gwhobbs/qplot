/**
 * scripts/main.js
 *
 * This is the starting point for your application.
 * Take a look at http://browserify.org/ for more info
 */

'use strict';

var App = require('./app.js');
require('./yahoo-finance-stock-data.js');
var d3 = require('d3-browserify');


var stocks = ['MSFT', 'AAPL']; // defaults for testing




function showPlot(data) {

	if (dayGroup) {
		dayGroup.transition()
		.attr('opacity',0)
		.duration(500);
	}
	$('#plot').empty();

	console.log(data[0][0].Close);
	console.log(data[1][0].Close);

	// just to have some space around items
	var margins = {
		'left' : 70,
		'right' : 30,
		'top' : 30,
		'bottom' : 50
	};

	var width = $(document).width();
	var height = $(document).height() - 100;

	// this will be our color scale.  An Ordinal scale.
	var colors = d3.scale.linear()
		.domain([0,data.length])
		.interpolate(d3.interpolateHsl)
		.range(['#ff0000', '#0000ff']);

	// add the SVG component to the plot div
	var svg = d3.select('#plot')
		.append('svg').attr('width', width).attr('height', height)
		.append('g').attr('transform', 'translate(' + margins.left + ',' + margins.top + ')');

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


	function make_x_axis() {
		return d3.svg.axis()
			.scale(x)
			.orient('bottom')
			.tickPadding(2);
	}

	function make_y_axis() {
		return d3.svg.axis()
			.scale(y)
			.orient('left')
			.tickPadding(2);
	}

	svg.append('g')
		.attr('class', 'grid')
		.attr('transform', 'translate(0,' + height + ')')
		.call(make_x_axis()
			.tickSize(-height, 0, -margins.bottom - 30)
			.tickFormat('')
		);

	svg.append('g')
		.attr('class', 'grid')
		.call(make_y_axis()
			.tickSize(-width, 0, 0)
			.tickFormat('')
		);


	var tooltip = d3.select('body').append('div')
		.attr('class', 'tooltip')
		.style('opacity',0);

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


	svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + y.range()[0] + ')');
	svg.append('g').attr('class', 'y axis');

	var xAxis = d3.svg.axis().scale(x).orient('bottom').tickPadding(2);
	var yAxis = d3.svg.axis().scale(y).orient('left').tickPadding(2);




	// figure out least squares regression
	var xSeries = data.map(function(d) { return parseFloat(d[0].Close)});
	var ySeries = data.map(function(d) { return parseFloat(d[1].Close)});

	var leastSquaresCoeff = leastSquares(xSeries, ySeries);

	svg.append('text')
		.attr('class', 'label')
		.attr('x', width - 200)
		.attr('y', height - 35)
		.text('r squared: ' + leastSquaresCoeff[2].toFixed(2).toString())

	svg.append('text')
		.attr('class', 'label')
		.attr('x', width - 200)
		.attr('y', height - 45)
		.text('slope: ' + leastSquaresCoeff[0].toFixed(2).toString())

	// add curves
	var lineFunction = d3.svg.line()
		.x(function(d) { return parseFloat(x(d[0].Close))})
		.y(function(d) { return parseFloat(y(d[1].Close))})
		.interpolate('cardinal');

	var pathline = svg.selectAll('.' + 'pathline')
		.data(data);


	// svg.append('path').data(data)
	// 	.attr('d', lineFunction(data))
	// 	.attr('stroke', '#222')
	// 	.attr('stroke-width', 2)
	// 	.attr('fill', 'none');

$('#plot').animate({opacity:1});

	function plotTrendline(leastSquaresCoeff, cssClass, color, width) {
		var x1 = d3.min(xSeries);

	var y1 = trendlineY(d3.min(xSeries));
	var x2 = d3.max(xSeries);
	var y2 = trendlineY(d3.max(xSeries));
	var trendData = [[x1, y1, x2, y2]];
	var trendline = svg.selectAll('.' + cssClass)
		.data(trendData);

	trendline.enter()
		.append('line')
		.attr('class', cssClass)
		.attr('x1', function(d) {return x(d[0])})
		.attr('y1', function(d) {return y(d[1])})
		.attr('x2', function(d) {return x(d[2])})
		.attr('y2', function(d) {return y(d[3])})
		.attr('stroke-dasharray', '10,10')
		.attr('stroke', color)
		.attr('stroke-width', width)
		.attr('opacity',0)
		.transition()
		.attr('opacity',1)
		.delay(0)
		.duration(1000);
	}

	plotTrendline(leastSquaresCoeff, 'trendline', '#888', 2);
	

	function trendlineY(xVal) {
		return leastSquaresCoeff[0]*xVal + leastSquaresCoeff[1];
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

		var sd = standardDeviation(data);



		var coeffSdTop = leastSquaresCoeff;
		coeffSdTop[1] += sd;
		// now plot sd lines
		plotTrendline(coeffSdTop, 'sdline', '#555', 1);

		var coeffSdBottom = leastSquaresCoeff;
		coeffSdBottom[1] -= 2 * sd;



		
		plotTrendline(coeffSdBottom, 'sdline2', '#555', 1);

	// apply results of least squares regression
	var x1 = 2;

	svg.selectAll('g.y.axis').call(yAxis);
	svg.selectAll('g.x.axis').call(xAxis);

	var day = svg.selectAll('g.node').data(data, function (d) {
		return d[2]; // this is the date string and will let d3 know the uniqueness of the item
	});

	var dayGroup = day.enter().append('g').attr('class', 'node')
		.attr('transform', function(d) {
			return 'translate(' + x(d[0].Close) + ',' + y(d[1].Close) + ')';
		});

	var monthsAgo = parseInt($('input#months_ago').val());
	// add a circle
	dayGroup.append('circle')
		.attr('r',0)
		.attr('class', 'dot')
		.style('fill', function(d) {
			return colors(data.indexOf(d)); // TODO: replace this with date function
		})
		.on('mouseover', function(d) {
			tooltip.transition()
				.duration(200)
				.style('opacity', .9);
			tooltip.html('<b>'+ moment(d[2],'YYYY-MM-DD').format('LL')+'</b>' + '<br/>' + d[0].Symbol + ': ' + d[0].Close + '<br />' +d[1].Symbol + ': ' + d[1].Close)
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

	//add some text





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



var monthsAgo = $('input#months_ago').val();

var moment = require('moment');
var d2 = moment().format('YYYY-MM-DD');
var d1 = moment().subtract(parseInt(monthsAgo), 'months').format('YYYY-MM-DD');

getStocksSortedByDay({ stocks: [$('#s1').val(), $('#s2').val()], startDate: d1, endDate: d2 }, 'historicaldata', function(err, data) {
	showPlot(data);
});

function handleSubmit() {
	$('#plot').animate({opacity:0},300);
	var monthsAgo = $('input#months_ago').val();

var moment = require('moment');
var d2 = moment().format('YYYY-MM-DD');
var d1 = moment().subtract(parseInt(monthsAgo), 'months').format('YYYY-MM-DD');

	getStocksSortedByDay({ stocks: [$('#s1').val(), $('#s2').val()], startDate: d1, endDate: d2 }, 'historicaldata', function(err, data) {
		showPlot(data);
	});
	return false;
}

var form = $('#req_form').submit(function(e) {
	e.preventDefault();
	handleSubmit();

})

