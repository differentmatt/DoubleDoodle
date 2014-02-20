'use strict';

/* Directives */


angular.module('myApp.directives', [])
  .directive('ddPicker', function () {
    return {
      restrict: 'E',
      templateUrl: 'partials/dd-picker.html',
      scope: {
        'options': '=',
        'selected': '=',
      },
      controller: function($scope, $element) {
        $scope.tabs = [];
        $scope.$watch('options', function() {
          $scope.tabs = tabOptions($scope.options);
        });
        
        function tabOptions(options) {
          var groups = {};
          for (var i = 0; i < options.length; i++) {
            var firstLetter = options[i][0];
            if (firstLetter in groups == false) {
              groups[firstLetter] = [];
            }
            groups[firstLetter].push(options[i]);
          }
          var tabs = [];
          for (var group in groups) {
            var tab = { title: group, content : [] };
            for (var key in groups[group]) {
              var option = groups[group][key];
              tab["content"].push(option);
            }
            tabs.push(tab);
          }
          return tabs;
        }
        
        $scope.toggleOption = function(option) {
          var index = $scope.selected.indexOf(option);
          if (index != -1) {
            $scope.selected.splice(index, 1);
          }
          else {
            $scope.selected.push(option);
          }
        };
        
        $scope.removeOption = function(option) {
          var index = $scope.selected.indexOf(option);
          if (index != -1) {
            $scope.selected.splice(index, 1);
          }
        };
      },
    }
  })
  .directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]);
