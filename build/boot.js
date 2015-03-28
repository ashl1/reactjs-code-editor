requirejs.config({
  baseUrl: './',

  paths: {
  	'rangy': 'bower_components/rangy/rangy-core',
  	'react': 'bower_components/react/react',
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

require(['build/editor']);
