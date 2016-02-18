const Backbone = require('backbone');
const $ = require('jquery');
Backbone.$ = $;
const Todos = require('./collections/todos');
const TodoRouter = require('./routers/router');
const AppView = require('./views/app-view');
require('todomvc-common/base');

global.ENTER_KEY = 13;
global.ESC_KEY = 27;
global.nunjucksEnv = new global.nunjucks.Environment(new global.nunjucks.PrecompiledLoader());

const todos = new Todos();
const filter = {};
global.router = new TodoRouter({todos, filter});
Backbone.history.start();

module.exports = new AppView({todos, filter});
