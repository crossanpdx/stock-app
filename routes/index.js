var yahooFinance = require('yahoo-finance');

module.exports = function (app, db) {
    
    // homepage
    app.route('/')
        .get(function (req, res) {
    		res.sendFile(process.cwd() + '/public/app/index.html');
        });
    
    // api to get stock names based on stocks saved in the db
    app.route('/api/stock/names')
        .get(function (req, res) {
            // get stocks names
            db.collection('stock').find({}, {"_id": 0, "symbol": 1, "name": 1}).toArray(function(err, stocks) {
                if (err) {
                    res.status(500).send('Not found!');
                } else {
                    // get the date range
                    var today = new Date;
                    var months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
                    var month = months[today.getMonth()];
                    // get stocks data
                    var symbols = stocks.map(function(item) {
                        return item.symbol;
                    });
                    yahooFinance.historical({
                        symbols: symbols,
                        from: (today.getFullYear()-1) + "-" + month + "-" + today.getDate(),
                        to: today.getFullYear() + "-" + month + "-" + today.getDate(),
                        period: 'm'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
                    }, function (err, result) {
                          if (err) {
                              res.status(500).send('Not found!');
                          } else {
                              // respond with stock name and data info
                              res.json({ name: stocks, data: result });
                          }
                    });
                }
            });
        });
    
    // api to add new stock and get stock data
    app.route('/api/stock/new/:id')
        .get(function (req, res) {
            var stockName = req.params.id;
            // get the snapshot for the name         
            yahooFinance.snapshot({
              symbol: stockName,
              fields: ['s', 'n']  // ex: ['s', 'n', 'd1', 'l1', 'y', 'r'] 
            }, function (err, snapshot) {
                if (err) {
                    res.status(500).send('Not found!');
                } else if (!snapshot.name) {
                    res.status(500).send('Not found!');
                } else {
                    // get the date range
                    var today = new Date;
                    var months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
                    var month = months[today.getMonth()];
                    // get the historic data for the year
                    yahooFinance.historical({
                      symbol: stockName,
                      from: (today.getFullYear()-1) + "-" + month + "-" + today.getDate(),
                      to: today.getFullYear() + "-" + month + "-" + today.getDate(),
                      period: 'm'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only) 
                    }, function (err, quotes) {
                      if (err) {
                          res.status(500).send('Not found!');
                      } else {
                          // add the stock name to the database using update and upsert to avoid duplicates on refresh
                          db.collection('stock').update({ symbol: snapshot.symbol }, { symbol: snapshot.symbol, name: snapshot.name }, { upsert: true });
                          // respond with the data
                          res.json({ name: snapshot, historic: quotes });
                      }
                    });
                    
                }
            });
        });
        
    // api to delete stock names from the database
    app.route('/api/stock/delete/:id')
        .get(function (req, res) {
            var stockName = req.params.id;
            db.collection('stock').remove({ symbol: stockName });
            res.json({ confirm: "Deleted from database"});
        });
    
};