/* global ENTER_KEY, ESC_KEY */
const Backbone = require('backbone');
const $ = require('jquery');
Backbone.$ = $;
const _ = require('lodash');
const TodoView = require('./todo-view');

// The Application
// ---------------

// Our overall **AppView** is the top-level piece of UI.
module.exports = Backbone.View.extend({

  // Instead of generating a new element, bind to the existing skeleton of
  // the App already present in the HTML.
  el: '.todoapp',

  // Our template for the line of statistics at the bottom of the app.
  statsTemplate: 'stats.html',

  // Delegated events for creating new items, and clearing completed ones.
  events: {
    'keypress .new-todo': 'createOnEnter',
    'click .clear-completed': 'clearCompleted',
    'click .toggle-all': 'toggleAllComplete'
  },

  // At initialization we bind to the relevant events on the `Todos`
  // collection, when items are added or changed. Kick things off by
  // loading any preexisting todos that might be saved in *localStorage*.
  initialize(options) {
    // debugger;
    this.todos = options.todos;
    this.filter = options.filter;

    this.allCheckbox = this.$('.toggle-all')[0];
    this.$input = this.$('.new-todo');
    this.$footer = this.$('.footer');
    this.$main = this.$('.main');
    this.$list = $('.todo-list');

    this.listenTo(this.todos, 'add', this.addOne);
    this.listenTo(this.todos, 'reset', this.addAll);
    this.listenTo(this.todos, 'change:completed', this.filterOne);
    this.listenTo(this.todos, 'filter', this.filterAll);
    this.listenTo(this.todos, 'all', _.debounce(this.render, 0));

    // Suppresses 'add' events with {reset: true} and prevents the app view
    // from being re-rendered for every model. Only renders when the 'reset'
    // event is triggered at the end of the fetch.
    this.todos.fetch({reset: true});
  },

  // Re-rendering the App just means refreshing the statistics -- the rest
  // of the app doesn't change.
  render() {
    const completed = this.todos.completed().length;
    const remaining = this.todos.remaining().length;

    if (this.todos.length) {
      this.$main.show();
      this.$footer.show();

      this.$footer.html(global.nunjucksEnv.render(this.statsTemplate, {
        completed: completed,
        remaining: remaining
      }));

      this.$('.filters li a')
        .removeClass('selected')
        .filter('[href="#/' + (this.filter.rule || '') + '"]')
        .addClass('selected');
    } else {
      this.$main.hide();
      this.$footer.hide();
    }

    this.allCheckbox.checked = !remaining;
  },

  // Add a single todo item to the list by creating a view for it, and
  // appending its element to the `<ul>`.
  addOne(todo) {
    const view = new TodoView({ model: todo, filter: this.filter });
    this.$list.append(view.render().el);
  },

  // Add all items in the **Todos** collection at once.
  addAll() {
    this.$list.html('');
    this.todos.each(this.addOne, this);
  },

  filterOne(todo) {
    todo.trigger('visible');
  },

  filterAll() {
    this.todos.each(this.filterOne, this);
  },

  // Generate the attributes for a new Todo item.
  newAttributes() {
    return {
      title: this.$input.val().trim(),
      order: this.todos.nextOrder(),
      completed: false
    };
  },

  // If you hit return in the main input field, create new **Todo** model,
  // persisting it to *localStorage*.
  createOnEnter(e) {
    if (e.which === ENTER_KEY && this.$input.val().trim()) {
      this.todos.create(this.newAttributes());
      this.$input.val('');
    }
  },

  // Clear all completed todo items, destroying their models.
  clearCompleted() {
    _.invoke(this.todos.completed(), 'destroy');
    return false;
  },

  toggleAllComplete() {
    const completed = this.allCheckbox.checked;
    this.todos.each(todo => {
      todo.save({
        completed: completed
      });
    });
  }
});
