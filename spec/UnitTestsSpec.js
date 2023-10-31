//first-jasmine-project/spec/helloWorldSpec.js
const helloWorld = require('../UnitTests.js');


describe("helloWorld", () => {
    it("returns hello world", () => {
      expect(helloWorld()).toBe("hello world");
    });
  });