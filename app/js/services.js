(function() {
   'use strict';

   /* Services */

  angular.module('myApp.services', ['myApp.service.login', 'myApp.service.firebase'])

    // put your services here!
    // .service('serviceName', ['dependency', function(dependency) {}]);
      
  .service('envPath', ['$location', 'ENVS', function($location, ENVS) {
    return function() {
      if ($location.host() == ENVS.prod.host) {
        return ENVS.prod.path;
      }
      else {
        return ENVS.test.path;
      }          
    }
  }]);
})();

