const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

const optimization = {
  minimizer: [
    new TerserPlugin({
      extractComments: false,
    }),
  ],
};

module.exports = [
  // Learner bundle
  {
    name: 'learner',
    entry: './src/learner/index.tsx',
    output: {
      path: path.resolve(__dirname, '../static/js'),
      filename: 'group_selection_learner.js',
      library: {
        name: 'GroupSelectionLearner',
        type: 'window',
        export: 'renderBlock',
      },
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    externals: {},
    optimization,
  },
  // Studio bundle
  {
    name: 'studio',
    entry: './src/studio/index.tsx',
    output: {
      path: path.resolve(__dirname, '../static/js'),
      filename: 'group_selection_studio.js',
      library: {
        name: 'GroupSelectionStudio',
        type: 'window',
        export: 'renderBlock',
      },
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    require('postcss-prefix-selector')({
                      prefix: '.group-selection-block',
                      exclude: [/^@keyframes/, /^html/, /^:root/],
                      transform: (prefix, selector) => {
                        if (selector.startsWith('.group-selection-block')) return selector;
                        return `${prefix} ${selector}`;
                      },
                    }),
                  ],
                },
              },
            },
          ],
        },
      ],
    },
    externals: {},
    optimization,
  },
];
