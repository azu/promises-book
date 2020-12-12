var Backbone = require('backbone')
  , $ = require('jquery-browserify')
  , _ = {template: require('lodash.template')}
  , View;

Backbone.$ = $;

View = Backbone.View.extend({
  template: _.template('<%= message %>')
, render: function () {
    this.el.innerHTML = (this.template({message: 'Hello From View Line 11'}));

    return this;
  }
});

module.exports = View;
