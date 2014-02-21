'use strict';

/* jasmine specs for directives go here */

describe('directives', function() {
  beforeEach(module('myApp.directives'));

  describe('app-version', function() {
    it('should print current version', function() {
      module(function($provide) {
        $provide.value('version', 'TEST_VER');
      });
      inject(function($compile, $rootScope) {
        var element = $compile('<span app-version></span>')($rootScope);
        expect(element.text()).toEqual('TEST_VER');
      });
    });
  });

  describe('dd-picker', function() {
    var element, scope;

    beforeEach(inject(function ($templateCache, $compile, $rootScope) {
      $templateCache.put('partials/dd-picker.html', '<div>{{ options }}</div>');

      var html = "<dd-picker options='options' selected='selected'></dd-picker>";
      scope = $rootScope.$new();
      scope.options = [];
      scope.selected = [];
      element = $compile(html)(scope);
      scope.options = ['beagle', 'pug'];
      element.scope().$apply();
    }));
    
    it('tabs created', function() {
      inject(function() {
        expect(element.scope().options).toEqual(scope.options);
        expect(element.isolateScope().tabs).toEqual([{title: 'b', content: ['beagle']}, {title: 'p', content: ['pug']}]);
      });
    });
    
    it('more tabs', function() {
      inject(function() {
        scope.options = ['beagle', 'pug', 'poodle', 'boxer'];
        element.scope().$apply();
        expect(element.scope().options).toEqual(scope.options);
        expect(element.isolateScope().tabs).toEqual([{title: 'b', content: ['beagle', 'boxer']}, {title: 'p', content: ['pug', 'poodle']}]);
      });
    });
    
    it('less tabs', function() {
      inject(function() {
        scope.options = ['boxer'];
        element.scope().$apply();
        expect(element.scope().options).toEqual(scope.options);
        expect(element.isolateScope().tabs).toEqual([{title: 'b', content: ['boxer']}]);
      });
    });
    
    it('toggle option exists', function() {
      inject(function() {
        expect(element.isolateScope().selected).toEqual([]);
        expect(element.scope().selected).toEqual([]);
        element.isolateScope().toggleOption('beagle');
        expect(element.isolateScope().selected).toEqual(['beagle']);
        expect(element.scope().selected).toEqual(['beagle']);
        element.isolateScope().toggleOption('pug');
        expect(element.isolateScope().selected).toEqual(['beagle', 'pug']);
        expect(element.scope().selected).toEqual(['beagle', 'pug']);
        element.isolateScope().toggleOption('beagle');
        expect(element.isolateScope().selected).toEqual(['pug']);
        expect(element.scope().selected).toEqual(['pug']);
      });
    });

    it('remove option exists', function() {
      inject(function() {
        expect(element.isolateScope().selected).toEqual([]);
        expect(element.scope().selected).toEqual([]);
        element.isolateScope().toggleOption('beagle');
        expect(element.isolateScope().selected).toEqual(['beagle']);
        expect(element.scope().selected).toEqual(['beagle']);
        element.isolateScope().removeOption('beagle');
        expect(element.isolateScope().selected).toEqual([]);
        expect(element.scope().selected).toEqual([]);
      });
    });

    it('remove option does not exist', function() {
      inject(function() {
        expect(element.isolateScope().selected).toEqual([]);
        expect(element.scope().selected).toEqual([]);
        element.isolateScope().removeOption('poodle');
        expect(element.isolateScope().selected).toEqual([]);
        expect(element.scope().selected).toEqual([]);
      });
    });

    it('remove option not selected', function() {
      inject(function() {
        expect(element.isolateScope().selected).toEqual([]);
        expect(element.scope().selected).toEqual([]);
        element.isolateScope().removeOption('beagle');
        expect(element.isolateScope().selected).toEqual([]);
        expect(element.scope().selected).toEqual([]);
      });
    });
  });
});
