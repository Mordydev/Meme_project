// Export configuration paths for easy access
module.exports = {
  typescript: {
    nextjs: require.resolve('./typescript/nextjs.json'),
    base: require.resolve('./typescript/base.json'),
    server: require.resolve('./typescript/server.json')
  }
};
