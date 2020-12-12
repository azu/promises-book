var converter = require('../');
var assert = require('assert');

describe('converter', function() {
	
  it('should convert relative images', function(){
    var html = '<img src="foo.png">';
    var converted = converter.convert(html, 'http://mysite.com');
    assert.equal('<img src="http://mysite.com/foo.png">', converted);
  });

  it('should convert relative images with slash at the beginning', function(){
    var html = '<img src="/foo.png">';
    var converted = converter.convert(html, 'http://mysite.com');
    assert.equal('<img src="http://mysite.com/foo.png">', converted);
  });

  it('should convert relative images with slash at the beginning and trailing slash for base url', function(){
    var html = '<img src="/foo.png">';
    var converted = converter.convert(html, 'http://mysite.com/');
    assert.equal('<img src="http://mysite.com/foo.png">', converted);
  });

  it('should convert relative links', function(){
    var html = '<a href="mypage">';
    var converted = converter.convert(html, 'http://mysite.com');
    assert.equal('<a href="http://mysite.com/mypage">', converted);
  });

  it('should not convert absolute links', function(){
    var html = '<a href="http://google.com">';
    var converted = converter.convert(html, 'http://mysite.com');
    assert.equal('<a href="http://google.com">', converted);
  });
});