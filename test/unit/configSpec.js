'use strict';

/* verify config settings are present */

describe('service', function() {
   beforeEach(module('myApp.config'));

   it('should be configured (FBURL was set)', inject(function(FBURL) {
      expect(FBURL).not.toEqual('https://INSTANCE.firebaseio.com');
   }));

   it('should have FBURL beginning with https', inject(function(FBURL) {
      expect(FBURL).toMatch(/^https:\/\/[a-zA-Z_-]+\.firebaseio\.com/i);
   }));

   it('should have S3URL beginning with https', inject(function(S3URL) {
      expect(S3URL).toMatch(/^https:\/\/[a-zA-Z_-]+\.s3\.amazonaws\.com/i);
   }));

   it('should have RELEASE', inject(function(RELEASE) {
      expect(RELEASE).toEqual('test');
   }));

   it('should have a valid SEMVER version', inject(function(version) {
      expect(version).toMatch(/^\d\d*(\.\d+)+$/);
   }));
});
