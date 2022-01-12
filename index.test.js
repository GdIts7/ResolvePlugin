const ResolverFactory = require('enhanced-resolve').ResolverFactory;
const plugin = require('./index.js');
const path = require('path');

describe('test matches', () => {
  thePath('./__mocks__/main')
    .shouldResolveTo('./__mocks__/main/foo.js');

  thePath('./__mocks__/main/bar.js')
    .shouldResolveTo('./__mocks__/main/bar.js');

  thePath('./__mocks__/main/baz.js')
    .shouldResolveTo('./__mocks__/shared/baz.js');
});

function resolveAndCheck(pathToResolve, expectedPath, options) {
  return (done) => {
    const resolver = ResolverFactory.createResolver({
      fileSystem: require('fs'),
      plugins: [new plugin(options)]
    });
    resolver.resolve({}, __dirname, pathToResolve, {}, (err, result) => {
      if (err) { return done(err); }
      expect(result).toEqual(path.resolve(__dirname, expectedPath));
      done();
    });
  }
}

function thePath(basicPath) {
  const options = {
    fromDirectory: path.resolve('./__mocks__/shared'),
    toDirectory: path.resolve('./__mocks__/main')
  };

  return {
    shouldResolveTo(targetPath) {
      it(
        `"${basicPath}" should match to "${targetPath}"`,
        resolveAndCheck(basicPath, targetPath, options)
      );
    }
  }
}
