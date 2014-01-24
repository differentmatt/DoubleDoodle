'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
   .controller('HomeCtrl', ['$scope', 'syncData', function($scope, syncData) {
      syncData('syncedValue').$bind($scope, 'syncedValue');
   }])

  .controller('UploadCtrl', ['$scope', '$upload', 'S3URL', 'RELEASE', 
    function($scope, $upload, S3URL, RELEASE) {
      $scope.progress = 0;
      $scope.selectedFile = null;
      
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

      $scope.onUpload = function() {
        if ($scope.selectedFile) {
          $scope.createTime = new Date();
          var filename = RELEASE + '/' + $scope.createTime.today() + $scope.createTime.timeNow();
          filename += Math.floor((Math.random() * 1000));
          filename += '.' + $scope.selectedFile.name.split('.').pop();
          var contentType = $scope.selectedFile.type;

          $scope.fileS3Url = S3URL + '/' + filename;
          
          $upload.upload({
            url: S3URL,
            method: 'POST',
            data: {key: filename, 'acl': 'public-read', 'Content-Type': contentType},
            file: $scope.selectedFile,
          }).progress(function(evt) {
            $scope.progress = parseInt(100.0 * evt.loaded / evt.total);
          }).success(function(data, status, headers, config) {
            $scope.selectedFile = null;
            fileInput.value = null;
            console.log('Upload success: ' + $scope.fileS3Url);
          }).error(function(err) {
            $scope.progress = 0;
            alert('Upload error: ' + err);
          });
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