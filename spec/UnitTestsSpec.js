//first-jasmine-project/spec/helloWorldSpec.js
const helloWorld = require('../UnitTests.js')

describe("helloWorld", () => {
    it("returns hello world", () => {
      var actual = helloWorld();
      expect(actual).toBe("hello world");
    });
  })