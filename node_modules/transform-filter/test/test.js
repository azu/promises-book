'use strict';
describe('filter-transform', function(){

  var sinon = require('sinon');
  var match = sinon.match;
  var chai = require('chai');
  chai.use(require('sinon-chai'));
  var expect = chai.expect;

  var proxyquire = require('proxyquire');

  var transformFilter;

  var transform, through, path;

  var optsObj = {};

  beforeEach(function () {
    transform = sinon.spy();
    through = sinon.spy();
    path = {relative:sinon.stub(), resolve:sinon.stub()};
    path.resolve.withArgs('.').returns('/absolute');
    path.resolve.withArgs('/').returns('/');
    path.resolve.withArgs('../absolute2').returns('/absolute2');
    optsObj = {};

    transformFilter = proxyquire('..',{
      'through' : through,
      'path' : path
    });
  });

  function runPaths(filterInstance, opts, var_filenames){
    var i, l = arguments.length;

    for(i = 2; i < l;  ++i){
      path.relative.withArgs('/absolute', '/absolute/' + arguments[i]).returns(arguments[i]);
      path.relative.withArgs('/', '/absolute/' + arguments[i]).returns('/absolute/' + arguments[i]);
    }

    for(i = 2; i < l; ++i){
      filterInstance('/absolute/' + arguments[i], opts);
    }
  }

  it('include only', function() {
    runPaths(transformFilter('modA/*.js', transform), optsObj,
      'modA/test.js',
      'modA/test.coffee',
      'modB/test.js'
    );

    expect(through.callCount).to.equal(2);
    expect(transform).to.have.been.calledOnce
      .and.calledWith('/absolute/modA/test.js', optsObj);
  });


  it('exclude only', function() {
    runPaths(transformFilter(null, '**/*.coffee', transform), optsObj,
      'modA/test.js',
      'modA/test.coffee',
      'modB/test.js'
    );

    expect(through.callCount).to.equal(1);
    expect(transform).to.have.been.calledTwice
      .and.calledWith('/absolute/modA/test.js', optsObj)
      .and.calledWith('/absolute/modB/test.js', optsObj);
  });

  it('exclude via !include', function() {
    runPaths(transformFilter('**/*.!(coffee)', transform), optsObj,
      'modA/test.js',
      'modA/test.coffee',
      'modB/test.js'
    );

    expect(through.callCount).to.equal(1);
    expect(transform).to.have.been.calledTwice
      .and.calledWith('/absolute/modA/test.js', optsObj)
      .and.calledWith('/absolute/modB/test.js', optsObj);
  });

  it('both include and exclude', function() {
    runPaths(transformFilter('modA/**', '**/*.coffee', transform), optsObj,
      'modA/test.js',
      'modA/test.coffee',
      'modB/test.js'
    );

    expect(through.callCount).to.equal(2);
    expect(transform).to.have.been.calledOnce
      .and.calledWith('/absolute/modA/test.js', optsObj);
  });

  it('both include and exclude - simplified args', function() {
    runPaths(transformFilter(transform, {include: 'modA/**', exclude: '**/*.coffee'} ), optsObj,
      'modA/test.js',
      'modA/test.coffee',
      'modB/test.js'
    );

    expect(through.callCount).to.equal(2);
    expect(transform).to.have.been.calledOnce
      .and.calledWith('/absolute/modA/test.js', optsObj);
  });

  it('multiple patterns in array', function() {
    runPaths(transformFilter(['modA/**', 'modB/**'], ['**/*.coffee','**/*.md'], transform), optsObj,
      'modA/test.js',
      'modA/test.coffee',
      'modA/test.md',
      'modB/test.js',
      'modB/test.coffee',
      'modC/test.js',
      'modC/test.coffee'
    );

    expect(through.callCount).to.equal(5);
    expect(transform).to.have.been.calledTwice
      .and.calledWith('/absolute/modA/test.js', optsObj)
      .and.calledWith('/absolute/modB/test.js', optsObj);
  });

  it('this stays bound on wrapped functions', function () {
    var context = {};
    runPaths(transformFilter(null,transform).bind(context), optsObj, 'modA/test.js');
    expect(transform).to.have.been.calledOn(context);
  });

  it('base can be modified', function() {
    runPaths(transformFilter(transform, {include:['modA/**', '**/modB/**'], exclude: ['**/*.md'], base:'/'}), optsObj,
      'modA/test.js',
      'modA/test.coffee',
      'modA/test.md',
      'modB/test.js',
      'modB/test.coffee',
      'modC/test.js',
      'modC/test.coffee'
    );

    expect(through.callCount).to.equal(5);
    expect(transform).to.have.been.calledTwice
      .and.calledWith('/absolute/modB/test.coffee', optsObj)
      .and.calledWith('/absolute/modB/test.js', optsObj);
  });
});