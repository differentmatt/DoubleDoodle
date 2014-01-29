'use strict';

/* jasmine specs for controllers go here */

describe('controllers', function(){
  beforeEach(module('myApp.controllers'));

  describe('UploadCtrl', function() {
    var scope, ctrl;
    
    beforeEach(module(function($provide) {
       // mock dependencies used to isolate testing
       $provide.value('$upload', new uploadStub());
       $provide.value('S3URL', 'https://doubledoodle.s3.amazonaws.com');
       $provide.value('envPath', function() { return 'test'; });
    }));
    
    beforeEach(inject(function($controller, envPath) {
      scope = {},
      ctrl = $controller('UploadCtrl', { $scope: scope });
    }));
    
    it('progress should be zero', inject(function($controller) {
      expect(scope.progress).toBe(0);
    }));
    
    it('one file selected', inject(function($controller) {
      var files = [{name: 'myFile1.txt', type: 'image/jpeg'}];
      scope.onFileSelect(files)
      expect(scope.selectedFile).toBe(files[0]);
    }));
    
    it('multiple files do not get selected', inject(function($controller) {
      var files = [{name: 'myFile1.txt', type: 'image/jpeg'}, {name: 'myFile2.txt', type: 'image/jpeg'}];
      scope.onFileSelect(files)
      expect(scope.selectedFile).toBe(null);
    }));
    
    it('file upload after select', inject(function($controller, envPath) {
      var files = [{name: 'test.jpg', type: 'image/jpeg'}];
      scope.onFileSelect(files)
      scope.onUpload();
      expect(scope.fileS3Url).toMatch(new RegExp('^https:\/\/[a-zA-Z_-]+\.s3\.amazonaws\.com\/' + envPath() + '\/[0-9]+\.jpg', 'i'));
    }));

    it('no select, no file upload', inject(function($controller) {
      scope.onUpload();
      expect(scope.fileS3Url).not.toBeDefined();
    }));
    
    function uploadStub() {
      this.upload = function(value) {
        return {
          progress: function() {
            return {
              success: function() {
                return {
                  error: function () {
                  }
                }
              }
            }
          }
        }
      }
    }
  });
});
