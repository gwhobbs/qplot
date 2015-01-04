/*
Yahoo Finance stock historical data, prices and details retrieval function written in Javascript, jQuery and YQL
v2013-08-05
(c) 2013 by Fincluster ltd - http://fincluster.com <dev@fincluster.com>
*/

var Progress = require('./Progress.js');

var progressBarStates = [
  { message: 'Pulling data from 2 sources...', percentDone: 20 },
  { message: 'Waiting for one more critical piece of data...', percentDone: 60 },
  { message: 'Interpreting results...', percentDone: 90 },
];

var progressBar = new Progress.bar(progressBarStates, '.progress-bar', '.progress-status');

    // a utility function useful for returning values for certain charting packages
    function zip(arrays) {
        return arrays[0].map(function(_,i){
            return arrays.map(function(array){return array[i];});
        });}

    function getStock(opts, type, complete) {
        var defs = {
            desc: false,
            baseURL: 'http://query.yahooapis.com/v1/public/yql?q=',
            query: {
                quotes: 'select * from yahoo.finance.quotes where symbol = "{stock}" | sort(field="{sortBy}", descending="{desc}")',
                historicaldata: 'select * from yahoo.finance.historicaldata where symbol = "{stock}" and startDate = "{startDate}" and endDate = "{endDate}"'
            },
            suffixURL: {
                quotes: '&env=store://datatables.org/alltableswithkeys&format=json&callback=?',
                historicaldata: '&env=store://datatables.org/alltableswithkeys&format=json&callback=?'
            }
        };

        opts = opts || {};

        if (!opts.stock) {
            complete('No stock defined');
            return;
        }

        var query = defs.query[type]
        .replace('{stock}', opts.stock)
        .replace('{sortBy}', defs.sortBy)
        .replace('{desc}', defs.desc)
        .replace('{startDate}', opts.startDate)
        .replace('{endDate}', opts.endDate);

        var url = defs.baseURL + query + (defs.suffixURL[type] || '');
        $.getJSON(url, function(data) {
            var err = null;
            if (!data || !data.query) {
                err = true;
            }

            complete(err, !err && data.query.results, opts.stock);    });
    }

    function getStockQF(opts, type, complete) {
        var defs = {
            desc: false,
            baseURL: 'http://www.quandl.com/api/v1/datasets/',
            query: {
                quotes: 'not implemented',
                historicaldata: '{stock}.json?trim_start={startDate}'
            },
            suffixURL: {
                quotes: 'not implemented',
                historicaldata: '&auth_token=ckc4qRLaqqyzxhd9y-Cf'
            }
        };

        opts = opts || {};

        if (!opts.stock) {
            complete('No stock defined');
            return;
        }

        var query = defs.query[type]
        .replace('{stock}', opts.stock)
        .replace('{startDate}', opts.startDate)

        var url = defs.baseURL + query + (defs.suffixURL[type] || '');
        $.getJSON(url, function(data) {
            var err = null;
            if (!data || !data.data) {
                console.log('error');
                err = true;
            }
            complete(err, !err && data, opts.stock);    });
    }

    function getStocks(list_opts, type, complete) {
        // figure out how many requests are neccessary and make a container for the results
        var remaining = list_opts.stocks.length;
        if (remaining != 2) { throw "Error: getStocks() only supports lists of 2 stocks"; }

        var stocks = list_opts.stocks;
        var results = [null, null];

        progressBar.start();

        // retrieve data for each stock asynchronously, then combine when finished
        list_opts.stocks.forEach(function(stock) {
            opts = list_opts;
            opts['stock'] = stock; // this is the stock symbol we will be feeding into getStock()
            if (stock.indexOf('/') > -1) {
                getStockQF(opts, type, function(err, data, query) {
                    remaining -= 1;
                    // if (remaining == 1) {
                    //     $('.progress-status').text('WAITING FOR ONE MORE CRITICAL PIECE OF DATA...');
                    //     $('.progress-bar').animate({width: '60%'},100);
                    // } else {
                    //     $('.progress.status').text('INTERPRETING RESULTS...');
                    // }
                    progressBar.increment();
                    data['quote'] = []
                    var colNames = data.column_names;
                    data['data'].forEach(function(day) {
                        var d = {};
                        colNames.forEach(function(colName) {
                            var i = colNames.indexOf(colName);
                            d[colName] = day[i];
                        });
                        d['Close'] = d['Settle'];
                        d['Symbol'] = data['code'];
                        d['Query'] = stock;
                        data['quote'].push(d);
                    });
                    results[stocks.indexOf(stock)] = data;
                    if (remaining == 0) {
                        complete(null, results);
                    }
                });
            } else {
                getStock(opts, type, function(err, data, query) {
                    remaining -= 1;
                    progressBar.increment();
                    data.quote.forEach(function(day) {
                      day['Query'] = stock;
                    });
                    results[stocks.indexOf(stock)] = data;
                    // check if finshed fetching
                    if (remaining == 0) {
                        complete(null, results);
                    }
                });
            }
        });
    }

    function getStocksSortedByDay(list_opts, type, complete) {
        getStocks(list_opts, type, function(err, data) {
          var independentVariable = list_opts.stocks[0];
          var dependentVariable = list_opts.stocks[1];
            quotes = [];
            dates = [];
            dateList = {};
            progressBar.increment();
            data[0].quote.forEach(function(day) {
              var date = day.Date;
                dates.push(date);
                if (!dateList[date]) {
                  dateList[date] = {};
                }
                var query = day.Query;
                dateList[date][query] = day;
            });
            data[1].quote.forEach(function(day) {
              var date = day.Date;
              dates.push(date);
              if (!dateList[date]) {
                dateList[date] = {};
              }
              var query = day.Query;
              dateList[date][query] = day;
            });

            var outputDates = [];
            var outputInd = [];
            var outputDep = [];
            for (var date in dateList) {
              if (Object.keys(dateList[date]).length < 2) {
                delete dateList[date];
              }

            }
            for (var date in dateList) {

              outputInd.push(dateList[date][independentVariable]);
              outputDep.push(dateList[date][dependentVariable]);
              outputDates.push(date);
            }


            data.forEach(function(symbol) {
                quotes.push(symbol.quote);
            });
            var outputGrid = [outputInd, outputDep, outputDates];
            quotes.push(dates);
            complete(null, zip(outputGrid));
        });
    }
    exports.getStocksSortedByDay = getStocksSortedByDay;
    function getZippedDailyAvgs(list_opts, type, complete) {
        getStocks(list_opts, type, function(err, data) {
            var independentVariable = list_opts.stocks[0];
            var dependentVariable = list_opts.stocks[1];
            results = [];
            dates = ['Date'];
            latest = ['Latest'];
            data[0].quote.forEach(function(day) {
                dates.push(day.Date);
                latest.push(null);
            });

            data.forEach(function(stock) {
                var symbol = stock.quote[0].Symbol;
                stockQuotes = [symbol];
                stock.quote.forEach(function(day) {
                    var dailyAvg = (parseFloat(day.High) + parseFloat(day.Low)) / 2;
                    stockQuotes.push(dailyAvg);
                });
                results.push(stockQuotes);

            });
            results.push(latest);

            var zippedResults = zip(results);
            complete(null, zippedResults);
        });
    }


/* Usage Examples
getStock({ stock: 'AAPL' }, 'quotes', function(err, data) {
    console.log(data);
});
var arr1 = [];
var arr2 = [];

getStock({ stock: 'MSFT', startDate: '2013-01-01', endDate: '2013-02-05' }, 'historicaldata', function(err, data) {
    arr2 = data.quote.map(function(quote) {
        return (parseFloat(quote.High) + parseFloat(quote.Low))/2;
    });
    console.log(arr2);
});

function zip(arrays) {
    return arrays[0].map(function(_,i){
        return arrays.map(function(array){return array[i]})
    });
}
*/
