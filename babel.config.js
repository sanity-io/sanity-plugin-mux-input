// eslint-disable-next-line
module.exports = function(api) {
  api.cache(true)
  const presets = ['@babel/env', '@babel/preset-react']
  const plugins = []
  return {
    presets,
    plugins
  }
}
