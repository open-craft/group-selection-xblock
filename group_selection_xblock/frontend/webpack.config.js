const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const FixStyleOnlyEntriesPlugin = require('webpack-fix-style-only-entries');

const optimization = {
  minimizer: [
    new TerserPlugin({
      extractComments: false,
    }),
  ],
};

const postcssPlugins = [
  require('postcss-prefix-selector')({
    prefix: '.group-selection-block',
    exclude: [/^@keyframes/, /^html/, /^:root/],
    transform: (prefix, selector) => {
      if (selector.startsWith('.group-selection-block')) return selector;
      return `${prefix} ${selector}`;
    },
  }),
];

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
                  plugins: postcssPlugins,
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
  // CSS extraction — non-prefixed (for learner view, rendered in iframe)
  {
    name: 'css',
    entry: './src/group_selection.css',
    output: {
      path: path.resolve(__dirname, '../static/css'),
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'group_selection.css',
      }),
      new FixStyleOnlyEntriesPlugin(),
    ],
    optimization: {
      minimizer: [],
    },
  },
  // CSS extraction — prefixed under .group-selection-block (for legacy Studio)
  {
    name: 'css-studio',
    entry: './src/group_selection.css',
    output: {
      path: path.resolve(__dirname, '../static/css'),
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: postcssPlugins,
                },
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'group_selection_studio.css',
      }),
      new FixStyleOnlyEntriesPlugin(),
    ],
    optimization: {
      minimizer: [],
    },
  },
];
