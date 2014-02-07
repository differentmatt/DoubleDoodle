'use strict';

/* jasmine specs for services go here */

describe('service', function() {
   beforeEach(module('myApp.services'));

  // TODO: test getAnswers (couldn't get promise to callback after resolve. scope.$apply?)

  describe('envPathService', function() {
    beforeEach(module(function($provide) {
      $provide.value('ENVS', {
        'prod' : { 'host' : 'doubledoodle.org', 'path': 'v1' }, 
        'test' : { 'host': 'localhost', 'path': 'test' } 
      });
    }));
    
    describe('envPath prod', function() {
      beforeEach(module(function($provide) {
        $provide.value('$location', { 'host': function() { return 'doubledoodle.org'; }});
      }));
      
      it('env path should be v1', inject(function(ENVS, $location, envPath) {
        expect(envPath()).toBe('v1');
      }));
    });
    
    describe('envPath non-prod', function() {
      beforeEach(module(function($provide) {
        $provide.value('$location', { 'host': function() { return 'random.com'; }});
      }));
      
      it('env path should be test', inject(function(ENVS, $location, envPath) {
        expect(envPath()).toBe('test');
      }));
    });

    describe('envPath test', function() {
      beforeEach(module(function($provide) {
        $provide.value('$location', { 'host': function() { return 'localhost'; }});
      }));
      
      it('env path should be test', inject(function(ENVS, $location, envPath) {
        expect(envPath()).toBe('test');
      }));
    });
   });

  describe('uploadImageService', function() {
    beforeEach(module(function($provide) {
      $provide.value('S3URL', 'https://doubledoodle.s3.amazonaws.com');
      $provide.value('ENVS', {
        'prod' : { 'host' : 'doubledoodle.org', 'path': 'v1' }, 
        'test' : { 'host': 'localhost', 'path': 'test' } 
      });
      $provide.value('$upload', new uploadStub());
    }));
    
    it('progress update', inject(function(uploadImage) {
      var eventCalled = false;
      var files = [{name: 'myFile1.jpg', type: 'image/jpeg'}];
      uploadImage(files[0], 
        function (progress) { 
          eventCalled = true;
          expect(progress).toBe(84); 
        }, 
        null, null);
      expect(eventCalled).toBe(true);
    }));

    it('file url on success', inject(function(envPath, uploadImage) {
      var eventCalled = false;
      var files = [{name: 'myFile1.jpg', type: 'image/jpeg'}];
      uploadImage(files[0], null,
        function success(uploadUrl) {
          eventCalled = true;
          expect(uploadUrl).toMatch(new RegExp('^https:\/\/[a-zA-Z_-]+\.s3\.amazonaws\.com\/' + envPath() + '\/[0-9]+\.jpg', 'i'));
        }, 
        null);
      expect(eventCalled).toBe(true);
    }));

    it('upload error', inject(function(uploadImage) {
      var eventCalled = false;
      var files = [{name: 'myFile1.jpg', type: 'image/jpeg'}];
      uploadImage(files[0], null, null,
        function (error) { 
          eventCalled = true;
          expect(error).toBe('error'); 
        });
      expect(eventCalled).toBe(true);
    }));
  });
   
  describe('saveQuestionService', function() {
    beforeEach(module(function($provide) {
      $provide.value('ENVS', {
        'prod' : { 'host' : 'doubledoodle.org', 'path': 'v1' }, 
        'test' : { 'host': 'localhost', 'path': 'test' } 
      });
      $provide.value('firebaseRef', firebaseStub());
    }));
    
    it('save question', inject(function(saveQuestion) {
      var cb = jasmine.createSpy();      
      saveQuestion('http://www.example.com/test.jpg', null, cb);
      expect(cb).toHaveBeenCalled();
      expect(cb.mostRecentCall.args.length).toBe(1);
      expect(cb.mostRecentCall.args[0]).toBeNull();
    }));
  });

   
   describe('loginService', function() {
      beforeEach(module(function($provide) {
         // mock dependencies used by our services to isolate testing
         $provide.value('Firebase', firebaseStub());
         $provide.value('$location', stub('path'));
         $provide.value('$firebaseSimpleLogin', angularAuthStub());
         $provide.value('firebaseRef', firebaseStub());
      }));

      describe('#login', function() {
         it('should return error if $firebaseSimpleLogin.$login fails',
            inject(function($q, $timeout, loginService, $firebaseSimpleLogin) {
               var cb = jasmine.createSpy();
               loginService.init('/login');
               $firebaseSimpleLogin.fns.$login.andReturn(reject($q, 'test_error'));
               loginService.login('test@test.com', '123', cb);
               flush($timeout);
               expect(cb).toHaveBeenCalledWith('test_error');
            })
         );

         it('should return user if $firebaseSimpleLogin.$login succeeds',
            inject(function(loginService, $firebaseSimpleLogin, $q, $timeout) {
               var cb = jasmine.createSpy();
               runs(function() {
                  loginService.init();
                  $firebaseSimpleLogin.fns.$login.andReturn(resolve($q, {hello: 'world'}));
                  loginService.login('test@test.com', '123', cb);
                  flush($timeout);
               });

               waitsFor(function() {
                  return cb.callCount > 0;
               });

               runs(function() {
                  expect(cb).toHaveBeenCalledWith(null, {hello: 'world'});
               });
            })
         );
      });

      describe('#logout', function() {
         it('should invoke $firebaseSimpleLogin.$logout()', function() {
            inject(function(loginService, $firebaseSimpleLogin) {
               loginService.init('/login');
               loginService.logout();
               expect($firebaseSimpleLogin.fns.$logout).toHaveBeenCalled();
            });
         });
      });

      describe('#changePassword', function() {
         beforeEach(inject(function($timeout, $firebaseSimpleLogin, $q) {
            customSpy($firebaseSimpleLogin.fns, '$changePassword',
               function(eml, op, np, cb) {
                  var def = $q.defer();
                  $timeout(function() { def.resolve(); });
                  return def.promise;
               });
         }));

         it('should fail if old password is missing',
            inject(function(loginService, $firebaseSimpleLogin, $timeout) {
               var cb = jasmine.createSpy();
               loginService.init('/login');
               loginService.changePassword({
                  newpass: 123,
                  confirm: 123,
                  callback: cb
               });
               flush($timeout);
               expect(cb).toHaveBeenCalledWith('Please enter a password');
               expect($firebaseSimpleLogin.fns.$changePassword).not.toHaveBeenCalled();
            })
         );

         it('should fail if new password is missing',
            inject(function(loginService, $firebaseSimpleLogin, $timeout) {
               var cb = jasmine.createSpy();
               loginService.init('/login');
               loginService.changePassword({
                  oldpass: 123,
                  confirm: 123,
                  callback: cb
               });
               flush($timeout);
               expect(cb).toHaveBeenCalledWith('Please enter a password');
               expect($firebaseSimpleLogin.fns.$changePassword).not.toHaveBeenCalled();
            })
         );

         it('should fail if passwords don\'t match',
            inject(function(loginService, $firebaseSimpleLogin, $timeout) {
               var cb = jasmine.createSpy();
               loginService.init('/login');
               loginService.changePassword({
                  oldpass: 123,
                  newpass: 123,
                  confirm: 124,
                  callback: cb
               });
               flush($timeout);
               expect(cb).toHaveBeenCalledWith('Passwords do not match');
               expect($firebaseSimpleLogin.fns.$changePassword).not.toHaveBeenCalled();
            })
         );

         it('should fail if $firebaseSimpleLogin fails',
            inject(function(loginService, $firebaseSimpleLogin, $timeout, $q) {
               var cb = jasmine.createSpy();
               customSpy($firebaseSimpleLogin.fns, '$changePassword', function(email, op, np) {
                  var def = $q.defer();
                  $timeout(function() { def.reject(new ErrorWithCode(123, 'errr')); });
                  return def.promise;
               });
               loginService.init('/login');
               loginService.changePassword({
                  oldpass: 124,
                  newpass: 123,
                  confirm: 123,
                  callback: cb
               });
               flush($timeout);
               expect(cb.argsForCall[0][0].toString()).toBe('errr');
               expect($firebaseSimpleLogin.fns.$changePassword).toHaveBeenCalled();
            })
         );

         it('should return null if $firebaseSimpleLogin succeeds',
            inject(function(loginService, $firebaseSimpleLogin, $timeout) {
               var cb = jasmine.createSpy();
               loginService.init('/login');
               loginService.changePassword({
                  oldpass: 124,
                  newpass: 123,
                  confirm: 123,
                  callback: cb
               });
               flush($timeout);
               expect(cb).toHaveBeenCalledWith(null);
               expect($firebaseSimpleLogin.fns.$changePassword).toHaveBeenCalled();
            })
         );
      });

      describe('#createAccount', function() {
         beforeEach(inject(function($timeout, $firebaseSimpleLogin, $q) {
            customSpy($firebaseSimpleLogin.fns, '$createUser', function(eml, pass) {
               var def = $q.defer();
               $timeout(function() { def.resolve({name: 'kato'}); });
               return def.promise;
            });
         }));

         it('should invoke $firebaseSimpleLogin',
            inject(function(loginService, $firebaseSimpleLogin) {
               loginService.init('/login');
               loginService.createAccount('test@test.com', 123);
               expect($firebaseSimpleLogin.fns.$createUser).toHaveBeenCalled();
            })
         );

         it('should invoke callback if error',
            inject(function(loginService, $timeout, $firebaseSimpleLogin, $q) {
               var cb = jasmine.createSpy(), undefined;
               customSpy($firebaseSimpleLogin.fns, '$createUser', function(email, pass) {
                  var def = $q.defer();
                  def.reject('joy!');
                  return def.promise;
               });
               loginService.init();
               loginService.createAccount('test@test.com', 123, cb);
               flush($timeout);
               expect(cb).toHaveBeenCalledWith('joy!');
            })
         );

         it('should invoke callback if success',
            inject(function(loginService, $timeout) {
               var cb = jasmine.createSpy();
               loginService.init();
               loginService.createAccount('test@test.com', 123, cb);
               flush($timeout);
               expect(cb).toHaveBeenCalledWith(null, {name: 'kato'});
            })
         )
      });

      describe('#createProfile', function() {
         it('should be the createProfile service',
            inject(function(loginService, profileCreator) {
               expect(loginService.createProfile).toBe(profileCreator);
            })
         );
      });
   });

   describe('profileCreator', function() {
      beforeEach(module(function($provide) {
         // mock dependencies used by our services to isolate testing
         $provide.value('Firebase', firebaseStub());
         $provide.value('$location', stub('path'));
         $provide.value('$firebaseSimpleLogin', angularAuthStub());
         $provide.value('firebaseRef', firebaseStub());
      }));

      it('should invoke set on Firebase',
         inject(function(profileCreator, firebaseRef, $timeout) {
            profileCreator(123, 'test@test.com');
            flush($timeout);
            expect(firebaseRef.fns.set.argsForCall[0][0]).toEqual({email: 'test@test.com', name: 'Test'});
         })
      );

      it('should invoke the callback',
         inject(function(profileCreator, $timeout) {
            var cb = jasmine.createSpy();
            profileCreator(456, 'test2@test2.com', cb);
            flush($timeout);
            expect(cb).toHaveBeenCalled();
         })
      );

      it('should return any error in the callback',
         inject(function(profileCreator, firebaseRef, $timeout) {
            var cb = jasmine.createSpy();
            firebaseRef.fns.callbackVal = 'noooooo';
            profileCreator(456, 'test2@test2.com', cb);
            flush($timeout);
            expect(cb).toHaveBeenCalledWith('noooooo');
         })
      );
   });

   function stub() {
      var out = {};
      angular.forEach(arguments, function(m) {
         out[m] = jasmine.createSpy();
      });
      return out;
   }

   function reject($q, error) {
      var def = $q.defer();
      def.reject(error);
      return def.promise;
   }

   function resolve($q, val) {
      var def = $q.defer();
      def.resolve(val);
      return def.promise;
   }

   function firebaseStub() {
      // firebase is invoked using new Firebase, but we need a static ref
      // to the functions before it is instantiated, so we cheat here by
      // attaching the functions as Firebase.fns, and ignore new (we don't use `this` or `prototype`)
      var FirebaseStub = function() {
        return FirebaseStub.fns;
      };
      FirebaseStub.fns = { callbackVal: null };
      customSpy(FirebaseStub.fns, 'set', function(value, cb) { cb && cb(FirebaseStub.fns.callbackVal); });
      customSpy(FirebaseStub.fns, 'child', function() { return FirebaseStub.fns; });
      customSpy(FirebaseStub.fns, 'push', function() { return FirebaseStub.fns; });
      customSpy(FirebaseStub.fns, 'setWithPriority', function(value, priority, cb) { cb && cb(FirebaseStub.fns.callbackVal); });
      customSpy(FirebaseStub.fns, 'once', function(value, cb) { 
        cb && cb({ val: function() { return FirebaseStub.fns.callbackVal; } }); 
      });
      return FirebaseStub;
   }

   function angularAuthStub() {
      function AuthStub() { return AuthStub.fns; }
      AuthStub.fns = stub('$login', '$logout');
      return AuthStub;
   }

   function customSpy(obj, m, fn) {
      obj[m] = fn;
      spyOn(obj, m).andCallThrough();
   }

   function flush($timeout) {
      try { $timeout.flush(); }
      catch(e) {} // is okay
   }

   function ErrorWithCode(code, msg) {
      this.code = code;
      this.msg = msg;
   }
   ErrorWithCode.prototype.toString = function() { return this.msg; }
   
  function uploadStub() {
    // Mimic $upload.upload
    var status = {
      progress: function(evtFn) {
        evtFn({loaded: 84, total: 100});
        return status;
      },
      success: function(evtFn) {
        evtFn(this.fileUrl);
        return status;
      },
      error: function(evtFn) {
        evtFn('error');
        return status;
      }
    }
    
    return {
      upload: function(value) {
        this.fileUrl = value.url + '/' + value.data.key;
        return status;
      }
    }
  }
});
