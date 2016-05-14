var expect = require('chai').expect;
var respondable;

describe('respondable', () => {

  beforeEach(() => {
    respondable = require('./index');
  });
  it('should export a function', () => {
    expect(respondable).to.be.a('function');
  });

  it('should require an object as its first arg', () => {
    expect(
      () => respondable()
    ).to.throw(
      'respondable requires an object as its first argument.'
    );
  });

  it('should require a function as its second arg', () => {
    expect(
      () => respondable({})
    ).to.throw(
      'respondable requiers a callback function as itssecond argument'
    );
  });

});
