'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('HomeCtrl', ['$scope', 'envPath', 'firebaseRef', '$firebase', 
    function($scope, envPath, firebaseRef, $firebase) {
      $scope.current = 0;
      $scope.questions = $firebase(firebaseRef(envPath() + '/questions'));
      
      $scope.prev = function() {
        if ($scope.current > 0) {
          $scope.current = $scope.current - 1;
        }
      };     
      $scope.next = function() {
        if ($scope.current < $scope.questions.$getIndex().length - 1) {
          $scope.current =  $scope.current + 1;
        }
      };      
  }])

  .controller('UploadCtrl', ['$scope', 'uploadImage', 'saveQuestion', 'getAnswers', 
    function($scope, uploadImage, saveQuestion, getAnswers) {
      function initNewUpload() {
        $scope.progress = 0;
        $scope.selectedFile = null;
        $scope.checkedAnswers = {};
        $scope.fileInput = null;
      }

      initNewUpload();
      $scope.answerGroups = {};
      
      // Capture image file select
      $scope.onFileSelect = function($files) {
        $scope.progress = 0;
        if ($files.length == 1) {
          if ($files[0].type.substring(0, 5) == 'image') {
            $scope.selectedFile = $files[0];
          }
          else {
            $scope.selectedFile = null;
            console.log('Error: wrong content type: ' + $files[0].type);
          }
        }
      }

      // Build answer groups
      getAnswers().then(function(answers) {
        for (var i in answers) {
          var firstLetter = answers[i][0];
          if (firstLetter in $scope.answerGroups == false) {
            $scope.answerGroups[firstLetter] = [];
          }
          $scope.answerGroups[firstLetter].push(answers[i]);
        }
      });

      $scope.trueAnswers = function() {
        var truthys = [];
        for (var answer in $scope.checkedAnswers) {
          if ($scope.checkedAnswers[answer] == true) {
            truthys.push(answer);
          }
        }
        return truthys;
      };
      
      $scope.removeAnswer = function(answer) {
        if (answer in $scope.checkedAnswers && $scope.checkedAnswers[answer] == true) {
          $scope.checkedAnswers[answer] = false;
        }
      };

      // Upload image and save question
      $scope.onUpload = function() {
        if ($scope.selectedFile) {
          uploadImage($scope.selectedFile, 
            function progressEvt(progress) {
              $scope.progress = progress;
            },
            function successEvt(uploadUrl) {
              var authorAnswer = {};
              for (var key in $scope.checkedAnswers) {
                if ($scope.checkedAnswers[key]) {
                  authorAnswer[key] = true;
                }
              }
              saveQuestion(uploadUrl, authorAnswer, function (error) {
                if (error) {
                  alert('Save question: ' + error);
                }
              });
              initNewUpload();
            },
            function errorEvt(error) {
              alert('Upload image: ' + error);
            }
          );
        }
      };
   }])

   .controller('LoginCtrl', ['$scope', 'loginService', '$location', function($scope, loginService, $location) {
      $scope.email = null;
      $scope.pass = null;
      $scope.confirm = null;
      $scope.createMode = false;

      $scope.login = function(cb) {
         $scope.err = null;
         if( !$scope.email ) {
            $scope.err = 'Please enter an email address';
         }
         else if( !$scope.pass ) {
            $scope.err = 'Please enter a password';
         }
         else {
            loginService.login($scope.email, $scope.pass, function(err, user) {
               $scope.err = err? err + '' : null;
               if( !err ) {
                  cb && cb(user);
               }
            });
         }
      };

      $scope.createAccount = function() {
         $scope.err = null;
         if( assertValidLoginAttempt() ) {
            loginService.createAccount($scope.email, $scope.pass, function(err, user) {
               if( err ) {
                  $scope.err = err? err + '' : null;
               }
               else {
                  // must be logged in before I can write to my profile
                  $scope.login(function() {
                     loginService.createProfile(user.uid, user.email);
                     $location.path('/account');
                  });
               }
            });
         }
      };

      function assertValidLoginAttempt() {
         if( !$scope.email ) {
            $scope.err = 'Please enter an email address';
         }
         else if( !$scope.pass ) {
            $scope.err = 'Please enter a password';
         }
         else if( $scope.pass !== $scope.confirm ) {
            $scope.err = 'Passwords do not match';
         }
         return !$scope.err;
      }
   }])

   .controller('AccountCtrl', ['$scope', 'loginService', 'syncData', '$location', function($scope, loginService, syncData, $location) {
      syncData(['users', $scope.auth.user.uid]).$bind($scope, 'user');

      $scope.logout = function() {
         loginService.logout();
      };

      $scope.oldpass = null;
      $scope.newpass = null;
      $scope.confirm = null;

      $scope.reset = function() {
         $scope.err = null;
         $scope.msg = null;
      };

      $scope.updatePassword = function() {
         $scope.reset();
         loginService.changePassword(buildPwdParms());
      };

      function buildPwdParms() {
         return {
            email: $scope.auth.user.email,
            oldpass: $scope.oldpass,
            newpass: $scope.newpass,
            confirm: $scope.confirm,
            callback: function(err) {
               if( err ) {
                  $scope.err = err;
               }
               else {
                  $scope.oldpass = null;
                  $scope.newpass = null;
                  $scope.confirm = null;
                  $scope.msg = 'Password updated!';
               }
            }
         }
      }

   }]);