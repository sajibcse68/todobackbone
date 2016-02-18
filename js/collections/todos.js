const Backbone = require('backbone');
const $ = require('jquery');
Backbone.$ = $;
Backbone.LocalStorage = require('backbone.localstorage');
const Todo = require('../models/todo');

// Todo Collection
// ---------------

// The collection of todos is backed by *localStorage* instead of a remote
// server.
module.exports = Backbone.Collection.extend({
  // Reference to this collection's model.
  model: Todo,

  // Save all of the todo items under this example's namespace.
  localStorage: new Backbone.LocalStorage('todos-backbone'),

  // Filter down the list of all todo items that are finished.
  completed() {
    return this.where({completed: true});
  },

  // Filter down the list to only todo items that are still not finished.
  remaining() {
    return this.where({completed: false});
  },

  // We keep the Todos in sequential order, despite being saved by unordered
  // GUID in the database. This generates the next order number for new items.
  nextOrder() {
    return this.length ? this.last().get('order') + 1 : 1;
  },

  // Todos are sorted by their original insertion order.
  comparator: 'order'
});
