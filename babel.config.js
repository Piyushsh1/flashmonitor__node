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
          'modules': 'auto'
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
      ['module-resolver', { 'root': ['./', './packages/*'] }],
      ['@babel/plugin-transform-modules-commonjs', { 'allowTopLevelThis': true }],
      ['@babel/plugin-transform-runtime', { 'regenerator': true }],
    ],
    "babelrcRoots": [
      ".",
      "packages/*",
    ],
    'ignore': [
      'credential.json',
      '**/dist/**',
      '**/node_modules/**',
      '**/pgdata/**',
      '**/uploads/**',
      '**/.idea/**'
    ]
  }
}
