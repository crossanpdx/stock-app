angular.module('niteStockChart')
.factory('stock', ['$http', function($http) {
  // get the names of any stocks saved to the db
  this.getStock = function() {
    return $http.get('/api/stock/names')
              .success(function(data) {
                return data;
              })
              .error(function(err) {
                return err;
              });
  };
  // add the stock and get the data
  this.addStock = function(stock) {
    return $http.get('/api/stock/new/' + stock)
              .success(function(data) {
                return data;
              })
              .error(function(err) {
                return err;
              });
  };
  // delete stock items from db
  this.deleteStock = function(stock) {
    return $http.get('/api/stock/delete/' + stock)
              .success(function(data) {
                return stock;
              })
              .error(function(err) {
                return err;
              });
  };
  return this;
}]);