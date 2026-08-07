module.exports = {
  apps: [
    {
      name: "frontend-cv",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        PORT: "3001"
      }
    }
  ]
};