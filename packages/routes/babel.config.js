/*
 * EXPORTS
 */
module.exports = __babel => {
  // Use cache.
  __babel.cache(true)

  // Return configuration.
  return {
    'presets': [
      [
        '@babel/preset-env',
        {
          'modules': false
        }
      ]
    ],
    'plugins': [
      '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-proposal-throw-expressions',
      '@babel/plugin-transform-shorthand-properties',
      '@babel/plugin-syntax-export-default-from',
      'babel-plugin-root-import',
      'dynamic-import-node',
      ['@babel/plugin-transform-modules-commonjs', { 'allowTopLevelThis': true }],
      ['@babel/plugin-transform-runtime', { 'regenerator': true }],
      [
        "@babel/plugin-proposal-pipeline-operator",
        {
          "proposal" : "minimal"
        }
      ]
    ],
    'env': {
      'production': {
        'presets': ['minify'],
        'plugins': [
          'transform-remove-console',
          'minify-dead-code-elimination'
        ]
      }
    },
    'ignore': ['**/node_modules/**']
  }
}
