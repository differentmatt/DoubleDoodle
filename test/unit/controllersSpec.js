'use strict';

/* jasmine specs for controllers go here */

describe('controllers', function(){
  beforeEach(module('myApp.controllers'));

  describe('HomeCtrl', function() {
    var scope, ctrl;
    var answers = ['bulldog', 'boxer', 'pug'];
    var questions = [
    {
      "authorAnswers" : {
        "Beagle" : true
      },
      "answers" : {
        "Poodle" : 1
      }
    },
    {
      "authorAnswers" : {
        "Collie" : true
      },
      "answers" : {
        "Mastiff" : 3
      }
    }];

    beforeEach(module(function($provide) {
      // mock dependencies used to isolate testing
      $provide.value('uploadImage', jasmine.createSpy('uploadImage'));
      $provide.value('saveQuestion', function(url, callback) {});
      $provide.value('getAnswers', function() { return { then: function(cb) { cb(answers); }}});
      $provide.value('getQuestions', function() { return { then: function(cb) { cb(questions); }}});
      $provide.value('answerQuestion', function(questionIndex, question, answer) {});
    }));
    
    beforeEach(inject(function($controller) {
      scope = {},
      ctrl = $controller('HomeCtrl', { $scope: scope} );
    }));
    
    it('questions retrieved', inject(function() {
      expect(scope.game.questions).toEqual(questions);
    }));
    
    it('answers retrieved', inject(function() {
      expect(scope.game.answers).toEqual(answers);
    }));

    it('current question initialized', inject(function() {
      expect(scope.question.communityAnswers[0].name).toEqual('Poodle');
      expect(scope.question.authorAnswers[0]).toEqual('Beagle');
    }));
    
    it('not loading', inject(function() {
      expect(scope.loading()).toBe(false);
    }));

    it('show question', inject(function() {
      expect(scope.showQuestion()).toBe(true);
      expect(scope.showAnswer()).toBe(false);
    }));

    it('show answer', inject(function() {
      scope.game.answered[scope.game.current] = {
        'answers': ['Boxer'],
        'correctAuthor': true,
        'correctCommunity': false,
      };
      expect(scope.showAnswer()).toBe(true);
      expect(scope.showQuestion()).toBe(false);
    }));

    it('next prev', inject(function() {
      scope.next();
      expect(scope.game.current).toEqual(1);
      expect(scope.question.communityAnswers[0]).toEqual({'name': 'Mastiff', 'count': 3});
      scope.prev();
      expect(scope.game.current).toEqual(0);
      expect(scope.question.communityAnswers[0]).toEqual({'name': 'Poodle', 'count': 1});
    }));

    it('guess', inject(function() {
      scope.question.selected = ['Beagle'];
      scope.guess();
      expect(scope.game.answered[scope.game.current]).toEqual({
        'answers': scope.question.selected,
        'correctAuthor': true,
        'correctCommunity': false,
      });
    }));
  });

  describe('UploadCtrl', function() {
    var scope, ctrl;
    var answers = ['bulldog', 'boxer', 'pug'];

    beforeEach(module(function($provide) {
      // mock dependencies used to isolate testing
      $provide.value('uploadImage', jasmine.createSpy('uploadImage'));
      $provide.value('saveQuestion', function(url, callback) {});
      $provide.value('getAnswers', function() { return { then: function(cb) { cb(answers); }}});
    }));
    
    beforeEach(inject(function($controller) {
      scope = {},
      ctrl = $controller('UploadCtrl', { $scope: scope} );
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
    
    it('answers retrieved', inject(function() {
      expect(scope.answers).toEqual(answers);
    }));

    it('onUpload', inject(function(uploadImage) {
      var files = [{name: 'myFile1.txt', type: 'image/jpeg'}];
      scope.onFileSelect(files)
      scope.onUpload();
      expect(uploadImage).toHaveBeenCalled();
    }));
  });
});
