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
  }])

  .service('uploadImage', ['$upload', 'S3URL', 'envPath', function($upload, S3URL, envPath) {
    return function(file, progressEvent, successEvent, errorEvent) {
      var createTime = new Date();
      var filename = envPath() + '/' + createTime.today() + createTime.timeNow();
      filename += Math.floor((Math.random() * 1000));
      filename += '.' + file.name.split('.').pop();
      var contentType = file.type;

      var fileS3Url = S3URL + '/' + filename;
      
      $upload.upload({
        url: S3URL,
        method: 'POST',
        data: {key: filename, 'acl': 'public-read', 'Content-Type': contentType},
        file: file,
      }).progress(function(evt) {
        if (progressEvent) {
          progressEvent(parseInt(100.0 * evt.loaded / evt.total));
        }
      }).success(function(data, status, headers, config) {
        if (successEvent) {
          successEvent(fileS3Url);
        }
      }).error(function(err) {
        if (errorEvent) {
          errorEvent(err);
        }
      });
    }
  }])

  .service('saveQuestion', ['envPath', 'firebaseRef', function(envPath, firebaseRef) {
    return function(imageUrl, callback) {
      var createdTime = new Date().getTime();

      var question = {
          imageUrl: imageUrl,
          created: createdTime
      };
      
      var questionsRef = firebaseRef(envPath() + '/questions');      
      var newQuestionRef = questionsRef.push();
      newQuestionRef.setWithPriority(question, createdTime, function(error) {
        if (callback) {
          callback(error);
        }
      });
    }
  }]);
})();

