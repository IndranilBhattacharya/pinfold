module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: { path: __dirname + '/dist' },
  module: { rules: [{ test: /\.css$/, use: ['style-loader', 'css-loader'] }] },
};
