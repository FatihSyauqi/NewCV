module.exports = {
  apps: [
    {
      name: "frontend-admin",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        PORT: "3002"
      }
    }
  ]
};