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
  
  .service('getAnswers', ['envPath', 'firebaseRef', '$q', function(envPath, firebaseRef, $q) {
    return function() {
      var deferred = $q.defer();
      var ref = firebaseRef(envPath() + '/answers');      
      ref.once('value', function(snapshot) {
        var answers = snapshot.val().split(',');
        deferred.resolve(answers);
      });
      return deferred.promise;
    }
  }])

  .service('getQuestions', ['envPath', 'firebaseRef', '$q', function(envPath, firebaseRef, $q) {
    return function() {
      var deferred = $q.defer();
      var ref = firebaseRef(envPath() + '/questions');
      ref.once('value', function(snapshot) {
        var questions = [];
        for (var i in snapshot.val()) {
          var question = snapshot.val()[i];
          question._index = i;
          questions.push(question);
        }
        deferred.resolve(questions);
      });
      return deferred.promise;
    }
  }])

  .service('answerQuestion', ['envPath', 'firebaseRef', function(envPath, firebaseRef) {
    return function(questionIndex, question, answer) {
      var ref = firebaseRef(envPath() + '/questions/' + questionIndex + '/answers/' + answer);
      ref.transaction(function(current_value) {
        return current_value + 1;
      }, function(error, committed, snapshot) {
        if (error) {
          console.log('Error in answerQuestion: ' + error);
        }
      });
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
    return function(imageUrl, authorAnswers, callback) {
      var createdTime = new Date().getTime();

      var question = {
          imageUrl: imageUrl,
          created: createdTime,
          authorAnswers: authorAnswers,
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

