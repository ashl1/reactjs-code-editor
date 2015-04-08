requirejs.config({
  baseUrl: './build/',

  paths: {
    'rangy': '../bower_components/rangy/rangy-core',
    'react': '../bower_components/react/react',
    'rope':  '../../rope-avl-js/rope',
    'lexer': '../../rope-avl-js/lexer',
  },

  shim: {
    'react': {
      exports: 'React'
    },
    'rangy': {
      exports: 'rangy'
    }
  }
});

require(['editor']);
