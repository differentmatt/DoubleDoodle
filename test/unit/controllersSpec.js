'use strict';

/* jasmine specs for controllers go here */

describe('controllers', function(){
  beforeEach(module('myApp.controllers'));

  describe('UploadCtrl', function() {
    var scope, ctrl;
    
    beforeEach(module(function($provide) {
       // mock dependencies used to isolate testing
       $provide.value('uploadImage', function(file, progressEvent, successEvent, errorEvent) {});
       $provide.value('saveQuestion', function(url, callback) {});
    }));
    
    beforeEach(inject(function($controller) {
      scope = {},
      ctrl = $controller('UploadCtrl', { $scope: scope });
    }));
    
    it('progress should be zero', inject(function() {
      expect(scope.progress).toBe(0);
    }));
    
    it('one file selected', inject(function() {
      var files = [{name: 'myFile1.txt', type: 'image/jpeg'}];
      scope.onFileSelect(files)
      expect(scope.selectedFile).toBe(files[0]);
    }));
    
    it('multiple files do not get selected', inject(function() {
      var files = [{name: 'myFile1.txt', type: 'image/jpeg'}, {name: 'myFile2.txt', type: 'image/jpeg'}];
      scope.onFileSelect(files)
      expect(scope.selectedFile).toBe(null);
    }));
  });
});
