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

function getQuotesFromYahoo(opts) {

  var type = 'historicaldata';
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

  return Promise.resolve($.getJSON(url)).then(function(res) {
    progressBar.increment();
    return res.query.results.quote;
  });
}

function getQuotesFromQuandl(opts) {

    var type = 'historicaldata';
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

    return Promise.resolve($.getJSON(url)).then(function(res) {
      var quotes = res.data.map(function(dayArray) {
        var day = {};
        dayArray.forEach(function(val) {
          var prop = res.column_names[dayArray.indexOf(val)];
          day[prop] = val;
        });
        day.Symbol = res.code;
        day.Close = day.Settle; // todo - clean this up, quandl data might not be futures data

        return day;
      });
      progressBar.increment();
      return quotes;
    });
}

function getQuotes(opts) {
  if (opts.stock.indexOf('/') > -1) {
    return getQuotesFromQuandl(opts);
  } else {
    return getQuotesFromYahoo(opts);
  }
}

function getQuotesArray(list_opts) {
    // make an individual query for each stock
    var queries = list_opts.stocks.map(function(stock) {
      return {
        startDate: list_opts.startDate,
        endDate: list_opts.endDate,
        stock: stock
      };
    });

    return Promise.all(queries.map(getQuotes));
}

function getQuotesForStockPairSortedByDay(list_opts) {
    progressBar.start();
    return getQuotesArray(list_opts).then(function(res) {
      if (res.length != 2) { throw "Error: getStocksSortedByDay only supports sets of 2 stocks"; }
      var sec1 = res[0];
      var sec2 = res[1];

      var sortedQuotes = [];

      // go through all the days in security 1, try to find a matching date in a security 2 day, then pair them and spit them into sortedQuotes
      sec1.forEach(function(sec1Day) {
        sec2.forEach(function(sec2Day) {
          if (sec1Day.Date == sec2Day.Date) {
            var date = sec1Day.Date;
            if ((sec1Day.Close !== undefined) && (sec2Day.Close !== undefined)) {
              sortedQuotes.push([sec1Day, sec2Day, date]);
            }
          }
        });
      });

      progressBar.increment();

      return sortedQuotes;

    });
}
exports.getQuotesForStockPairSortedByDay = getQuotesForStockPairSortedByDay;


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

*/
