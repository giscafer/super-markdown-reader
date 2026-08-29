const { resolve } = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const FriendlyErrors = require('@nuxt/friendly-errors-webpack-plugin')
const SveltePreprocess = require('svelte-preprocess')

module.exports = {
  entry: {
    content: resolve(__dirname, '../src/main.ts'),
    background: resolve(__dirname, '../src/background.ts'),
    popup: resolve(__dirname, '../src/popup/index.ts'),
    offscreen: resolve(__dirname, '../src/offscreen.ts'),
  },
  output: {
    filename: 'js/[name].js',
    path: resolve(__dirname, '../dist/md-reader'),
    publicPath: './',
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        use: {
          loader: 'esbuild-loader',
          options: { loader: 'ts', target: 'esnext' },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.svelte$/,
        use: {
          loader: 'svelte-loader',
          options: {
            preprocess: SveltePreprocess.typescript(),
          },
        },
      },
      {
        test: /\.(css|less)$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              esModule: false,
            },
          },
          'less-loader',
        ],
      },
      {
        test: /\.svg$/,
        use: 'svg-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.woff2$/,
        type: 'asset/resource',
        generator: {
          outputPath: 'fonts',
          publicPath: 'chrome-extension://__MSG_@@extension_id__/fonts/',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.svelte', '.json', '.less'],
    alias: {
      '@': resolve(__dirname, '../src'),
    },
  },
  stats: 'errors-only',
  plugins: [
    new FriendlyErrors(),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: resolve(__dirname, '../src/manifest.json'),
        },
        {
          from: resolve(__dirname, '../src/_locales'),
          to: '_locales',
        },
        {
          from: resolve(__dirname, '../src/images'),
          to: 'images',
        },
        {
          from: resolve(__dirname, '../src/popup/index.html'),
          to: 'popup.html',
        },
        {
          from: resolve(__dirname, '../src/offscreen.html'),
          to: 'offscreen.html',
        },
      ],
    }),
    {
      apply(compiler) {
        compiler.hooks.done.tap('UnpackedHint', stats => {
          if (stats.hasErrors()) {
            return
          }
          console.log(
            '\n  Unpacked extension: dist/md-reader\n  Chrome → chrome://extensions → Load unpacked → select dist/md-reader\n',
          )
        })
      },
    },
  ],
}
