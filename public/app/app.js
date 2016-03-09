/* global io */

angular.module('niteStockChart', [])

    .controller('index', ['$scope', 'stock', function($scope, stock) {
        $scope.stocks = [];
        $scope.socket = io();
        $scope.help = false;
        
        // CLEAR HELP IF WARNING CLOSED
        $scope.closeHelp = function() {
            $scope.help = false;
        };
        // SET UP THE THE CHART
        // get the date range
        var today = new Date;
        var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        var month = months[today.getMonth()];
        // add the labels
        var chartData = {
            labels: [months[today.getMonth()+1], months[today.getMonth()+2], months[today.getMonth()+3], months[today.getMonth()+4], months[today.getMonth()+5], months[today.getMonth()+6], months[today.getMonth()+7], months[today.getMonth()+8], months[today.getMonth()+9], months[today.getMonth()+10], months[today.getMonth()+11], months[today.getMonth()]],
            datasets: []
        };
        var ctx = document.getElementById("stockChart").getContext("2d");
        var niteStockChart = new Chart(ctx).Line(chartData, options);
        document.getElementById('stockChart-legend').innerHTML = niteStockChart.generateLegend();
        // GET NAMES OF STOCKS IN DB
        stock.getStock().success(function(data) {
         $scope.stocks = data.name;
         for (var key in data.data) {
             var colour = randomColor();
             var arrData = [];
             var dataLength = data.data[key].length;
             for (var i = 0; i < dataLength; i++) {
                 arrData.push(data.data[key][i].close);
             }
             var obj = {
                label: data.data[key][0].symbol,
                fillColor: "rgba(" + colour + ",0.2)",
                strokeColor: "rgba(" + colour + ",1)",
                pointColor: "rgba(" + colour + ",1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                data: arrData
             };
             chartData.datasets.push(obj);
         }
        $scope.loading = false;
        niteStockChart = new Chart(ctx).Line(chartData, options);
        document.getElementById('stockChart-legend').innerHTML = niteStockChart.generateLegend();
        });
        // ADD STOCK FUNCTION
        $scope.addStock = function() {
        // check if blank
         if (!$scope.newStockSymbol) {
            $scope.help = "Cannot submit blank stock item";
            return;
         }
         // assign the newStock symbol
         var newStock = $scope.newStockSymbol.toUpperCase();
         // clear the scope to avoid duplciates
         $scope.newStockSymbol = "";
         // check if stock symbol already exists
         var length = $scope.stocks.length;
         for (var i = 0; i < length; i++) {
             if (newStock == $scope.stocks[i].symbol) {
                 $scope.help = "This stock symbol already exists";
                 return;
             }
         }
         // doesn't exist so try to add
         stock.addStock(newStock).success(function(data) {
             // emit the message that we have added a new stock item
             $scope.socket.emit('messages', { symbol: data.name.symbol, name: data.name.name, data: data.historic });
             $scope.help = false;
         });
         stock.addStock(newStock).error(function(error) {
             $scope.help = "Not a valid stock symbol";
         });
        };
        // DO SOMETHING WHEN DATA ADD EMITTED FROM SERVER
        $scope.socket.on('messages', function (data) {
            $scope.$apply(function() {
                $scope.stocks.push({ symbol: data.symbol, name: data.name });
                // update the chart
                var colour = randomColor();
                var arrData = [];
                var dataLength = data.data.length;
                for (var i = 0; i < dataLength; i++) {
                    arrData.push(data.data[i].close);
                }
                var obj = {
                    label: data.data[0].symbol,
                    fillColor: "rgba(" + colour + ",0.2)",
                    strokeColor: "rgba(" + colour + ",1)",
                    pointColor: "rgba(" + colour + ",1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    data: arrData
                };
                chartData.datasets.push(obj);
                niteStockChart = new Chart(ctx).Line(chartData, options);
            });
        });
        // DELETE STOCK FUNCTION
        $scope.deleteRequest = function(symbol) {
                for (var i = 0; i < $scope.stocks.length; i++) {
                    if ($scope.stocks[i].symbol == symbol) {
                        $scope.stocks[i].delete = true;
                    }
                }
        };
        $scope.deleteCancel = function(symbol) {
                for (var i = 0; i < $scope.stocks.length; i++) {
                    if ($scope.stocks[i].symbol == symbol) {
                        $scope.stocks[i].delete = false;
                    }
                }
        };
        $scope.deleteConfirm = function(symbol) {
                console.log(symbol);
                stock.deleteStock(symbol).success(function(data) {
                    $scope.socket.emit('deletedstock', { symbol: symbol });
                });
        };
        // DO SOMETHING WHEN DATA REMOVE EMITTED FROM SERVER
        $scope.socket.on('deletedstock', function (data) {
            $scope.$apply(function() {
                for (var i = 0; i < $scope.stocks.length; i++) {
                    if ($scope.stocks[i].symbol == data.symbol) {
                        $scope.stocks.splice(i, 1);
                        chartData.datasets.splice(i, 1);
                        niteStockChart = new Chart(ctx).Line(chartData, options);
                    }
                }
            });
        });
        // RANDOM COLOR GENERATOR
        var randomColor = function() {
            var red = Math.floor(((Math.random()*256) + 230) / 2);
            var green = Math.floor(((Math.random()*256) + 126) / 2);
            var blue = Math.floor(((Math.random()*256) + 34) / 2);
            return red + "," + green + "," + blue;
        };
        // CHART OPTIONS
        var options = {
            animation: true,
            animationSteps: 50,
            animationEasing: "linear",
            showScale: true,
            scaleOverride: false,
            scaleLineColor: "rgba(255,255,255,.25)",
            scaleLineWidth: 1,
            scaleShowLabels: true,
            scaleLabel: "<%=value%>",
            scaleIntegersOnly: true,
            scaleBeginAtZero: false,
            scaleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            scaleFontSize: 12,
            scaleFontStyle: "normal",
            scaleFontColor: "#fff",
            scaleShowGridLines : true,
            scaleGridLineColor : "rgba(255,255,255,.25)",
            scaleGridLineWidth : 1,
            scaleShowHorizontalLines: true,
            scaleShowVerticalLines: true,
            bezierCurve : true,
            bezierCurveTension : 0.4,
            pointDot : true,
            pointDotRadius : 4,
            pointDotStrokeWidth : 1,
            pointHitDetectionRadius : 20,
            datasetStroke : true,
            datasetStrokeWidth : 2,
            datasetFill : true,
            legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].strokeColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>",
            responsive: true,
            maintainAspectRatio: false
        };
        // initialise tooltip
        $(document).ready(function(){
            $('[data-toggle=tooltip]').hover(function(){
                // on mouseenter
                $(this).tooltip('show');
            }, function(){
                // on mouseleave
                $(this).tooltip('hide');
            });
        });
    }]);