/*
Yahoo Finance stock historical data, prices and details retrieval function written in Javascript, jQuery and YQL
v2013-08-05
(c) 2013 by Fincluster ltd - http://fincluster.com <dev@fincluster.com>
*/
(function($) {

    function zip(arrays) {
        return arrays[0].map(function(_,i){
            return arrays.map(function(array){return array[i]})
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
        // console.log(url);
        $.getJSON(url, function(data) {
            var err = null;
            if (!data || !data.query) {
                err = true;
            }
            complete(err, !err && data.query.results);    });
    }
    window.getStock = getStock;

    function getStocks(list_opts, type, complete) {
            var remaining = list_opts.stocks.length;
            var results = [];
            list_opts.stocks.forEach(function(stock) {
                opts = list_opts;

                opts['stock'] = stock;


                getStock(opts, type, function(err, data) {
                    // console.log(data);

                    remaining -= 1;
                    results.push(data);
                    // console.log(remaining);
                    if (remaining == 0) {
                    complete(null, results);
                }
                });
            });
            
        }
        window.getStocks = getStocks;

    function getZippedDailyAvgs(list_opts, type, complete) {
        getStocks(list_opts, type, function(err, data) {
            results = [];
            // console.log(data);
            dates = ['Date'];
            latest = ['Latest'];
            data[0].quote.forEach(function(day) {
                dates.push(day.Date);
                latest.push(null);
            });
            console.log(dates);

            data.forEach(function(stock) {
                var symbol = stock.quote[0].Symbol;
                // console.log(symbol);
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
    window.getZippedDailyAvgs = getZippedDailyAvgs;
})(jQuery);

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