'use strict';

/* Controllers */

// TODO: save author answers as comma delimited string.  compact, faster.

angular.module('myApp.controllers', [])
  .controller('NavbarCtrl', ['$scope', function($scope) {
    $scope.isCollapsed = true;
  }])
  .controller('HomeCtrl', ['$scope', 'getAnswers', 'getQuestions', 'answerQuestion', 
    function($scope, getAnswers, getQuestions, answerQuestion) {
      // Initialize Game and question data
      $scope.game = {
        'answers': [],
        'questions': [],
        'current': 0,
        'answered': {},
        'score': {
          'author': 0,
          'community': 0,
        },
      };
      initQuestion();

      getQuestions().then(function(questions) {
        $scope.game.questions = questions;
        initQuestion();        
      });
      getAnswers().then(function(answers) {
        $scope.game.answers = answers;
      });

      function initQuestion() {
        // Question (current) data
        $scope.question = {
          'communityAnswers': [],
          'authorAnswers': [],
          'selected': [],
        };
        if ($scope.game.current < $scope.game.questions.length) {
          if ($scope.game.questions[$scope.game.current].answers) {
            for (var answer in $scope.game.questions[$scope.game.current].answers) {
              $scope.question.communityAnswers.push({
                'name': answer, 
                'count': $scope.game.questions[$scope.game.current].answers[answer]
              });
            }
            $scope.question.communityAnswers.sort(function(a, b) { return b.count - a.count });
          }
          if ($scope.game.questions[$scope.game.current].authorAnswers) {
            for (var answer in $scope.game.questions[$scope.game.current].authorAnswers) {
              $scope.question.authorAnswers.push(answer);
            }
          }
        }
      }
      
      $scope.loading = function() {
        return $scope.game.questions.length === 0 || $scope.game.answers.length === 0;
      };
      $scope.showQuestion = function() {
        if ($scope.loading()) {
          return false;
        }
        if ($scope.game.current < $scope.game.questions.length && 
            $scope.game.current in $scope.game.answered) {
          return false;
        }
        return true;
      };
      $scope.showAnswer = function() {
        if ($scope.game.current < $scope.game.questions.length && 
            $scope.game.current in $scope.game.answered) {
          return true;
        }
        return false;
      };

      $scope.prev = function() {
        if ($scope.game.current > 0) {
          $scope.game.current = $scope.game.current - 1;
          initQuestion();
        }
      };     
      $scope.next = function() {
        if ($scope.game.current < $scope.game.questions.length - 1) {
          $scope.game.current =  $scope.game.current + 1;
          initQuestion();
        }
      };

      $scope.guess = function() {
        if ($scope.question.selected.length > 0) {
          var correctCommunityAnswers = false;
          var correctAuthorAnswers = false;
          
          // Check community answers: user must have selected most popular
          // TODO: account for ties
          if ($scope.game.current < $scope.game.questions.length && 
              $scope.game.questions[$scope.game.current].answers) {
            var userAnswers = $scope.question.selected.slice();
            for (var i = 0; i < $scope.question.communityAnswers.length && userAnswers.length > 0; i++) {
              var uIndex = userAnswers.indexOf($scope.question.communityAnswers[i].name);
              if (uIndex != -1) {
                userAnswers.splice(uIndex, 1);
              }
              else {
                break;
              }
            }
            if (userAnswers.length == 0) {
              correctCommunityAnswers = true;
            }
          }
          else {
            console.log('No answers submitted yet.');
            correctCommunityAnswers = true;
          }
          
          // Check author answers: user must have selected author's exactly
          if ($scope.game.current < $scope.game.questions.length &&
              $scope.game.questions[$scope.game.current].authorAnswers) {
            var authorAnswers = $scope.question.authorAnswers.slice();
            var userAnswers = $scope.question.selected.slice();
            while (authorAnswers.length > 0 && userAnswers.length > 0) {
              var index = userAnswers.indexOf(authorAnswers[0]);
              if (index != -1) {
                userAnswers.splice(index, 1);
                authorAnswers.splice(0, 1);
              }
              else {
                break;
              }
            }
            if (authorAnswers.length == 0 && userAnswers.length == 0) {
              correctAuthorAnswers = true;
            }
          }
          
          // Save new answers
          for (var i = 0; i < $scope.question.selected.length; i++) {
            answerQuestion($scope.game.questions[$scope.game.current]._index, $scope.game.questions[$scope.game.current], $scope.question.selected[i]);
          }
          $scope.game.answered[$scope.game.current] = {
            'answers': $scope.question.selected,
            'correctAuthor': correctAuthorAnswers,
            'correctCommunity': correctCommunityAnswers,
          };
          if (correctAuthorAnswers) {
            $scope.game.score.author += 1;
          }
          if (correctCommunityAnswers) {
            $scope.game.score.community += 1;
          }
        }
        else {
          alert('TODO: disable answer button if no answers selected');
        }
      };
  }])

  .controller('UploadCtrl', ['$scope', 'uploadImage', 'saveQuestion', 'getAnswers', 
    function($scope, uploadImage, saveQuestion, getAnswers) {
      $scope.answers = [];
      function initNewUpload() {
        $scope.progress = 0;
        $scope.selectedFile = null;
        $scope.fileInput = null;
        $scope.selected = [];
      }
      initNewUpload();
      
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

      getAnswers().then(function(answers) {
        $scope.answers = answers;
      });

      // Upload image and save question
      $scope.onUpload = function() {
        if ($scope.selectedFile) {
          uploadImage($scope.selectedFile, 
            function progressEvt(progress) {
              $scope.progress = progress;
            },
            function successEvt(uploadUrl) {
              var authorAnswers = {};
              for (var i = 0; i < $scope.selected.length; i++) {
                authorAnswers[$scope.selected[i]] = true;
              }
              saveQuestion(uploadUrl, authorAnswers, function (error) {
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