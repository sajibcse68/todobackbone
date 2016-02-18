const Backbone = require('backbone');
const $ = require('jquery');
Backbone.$ = $;

// Todo Router
// ----------
module.exports = Backbone.Router.extend({
  constructor(options) {
    Backbone.Router.prototype.constructor.call(this, options);
    this.todos = options.todos;
    this.filter = options.filter;
  },

  routes: {
    '*filter': 'setFilter'
  },

  setFilter(param) {
    // Set the current filter to be used
    this.filter.rule = param || '';

    // Trigger a collection filter event, causing hiding/unhiding
    // of Todo view items
    this.todos.trigger('filter');
  }
});
