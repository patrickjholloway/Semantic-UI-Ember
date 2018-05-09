/* eslint-env node */
'use strict';

const path = require('path')
const fs = require('fs')

const defaults = {
  import: {
    css: false,
    javascript: true,
    images: true,
    fonts: true
  },
  source: {
    css: 'node_modules/semantic-ui/dist/',
    javascript: 'node_modules/semantic-ui/dist/',
    images: 'node_modules/semantic-ui/dist/themes/default/assets/images',
    fonts: 'node_modules/semantic-ui/dist/themes/default/assets/fonts'
  },
  destination: {
    images: 'assets/themes/default/assets/images',
    fonts: 'assets/themes/default/assets/fonts'
  }
}

const custom = {
  source: {
    css: 'semantic/dist',
    javascript: 'semantic/dist',
    images: 'semantic/dist/themes/default/assets/images',
    fonts: 'semantic/dist/themes/default/assets/fonts'
  }
}

const getDefault = require('./lib/utils/get-default')

const Funnel = require('broccoli-funnel')
const mergeTrees = require('broccoli-merge-trees')
const map = require('broccoli-stew').map

module.exports = {
  name: 'semantic-ui-ember',
  included: function (app) {
    // If the addon has the _findHost() method (in ember-cli >= 2.7.0), we'll just
    // use that. This helps support ember-engines, where we want to find 
    // the 'parent' app
    if (typeof this._findHost === 'function') {
      app = this._findHost();
    }
    const options = (app && app.project.config(app.env)['SemanticUI'])
      || (app && app.project.config(app.env)['semantic-ui-ember'])
      || {};

    if (!fs.existsSync(defaults.source.css) && fs.existsSync(custom.source.css)) {
      defaults.source = custom.source
    }

    const importJavascript = getDefault('import', 'javascript', [options, defaults])
    if (importJavascript) {
      this.sourceJavascript = getDefault('source', 'javascript', [options, defaults]);
      app.import({
        development: 'vendor/semantic.js',
        production: 'vendor/semantic.min.js'
      });
    }

    const importImages = getDefault('import', 'images', [options, defaults])
    if (importImages) {
      const sourceImage = getDefault('source', 'images', [options, defaults])
      const imageOptions = {destDir: getDefault('destination', 'images', [options, defaults])}
      app.import(path.join(sourceImage, 'flags.png'), imageOptions);
    }

    const importFonts = getDefault('import', 'fonts', [options, defaults])
    if (importFonts) {
      const fontExtensions = ['.eot', '.otf', '.svg', '.ttf', '.woff', '.woff2']
      const sourceFont = getDefault('source', 'fonts', [options, defaults])
      const fontOptions = {destDir: getDefault('destination', 'fonts', [options, defaults])}
      for (let i = fontExtensions.length - 1; i >= 0; i--) {
        app.import(path.join(sourceFont, 'icons' + fontExtensions[i]), fontOptions);
      }
    }
  },

  treeForVendor: function(vendorTree) {
    const trees = []

    if (vendorTree) {
      trees.push(vendorTree);
    }

    const sourceJavascript = this.sourceJavascript
    if (sourceJavascript) {
      let semanticJsTree = new Funnel(sourceJavascript, {
        srcDir: '/',
        files: ['semantic.js', 'semantic.min.js']
      })

      semanticJsTree = map(semanticJsTree,
          (content) => `if (typeof FastBoot === 'undefined') { ${content} }`);

      trees.push(semanticJsTree);
    }

    return mergeTrees(trees);
  }
};
