module.exports = {
  apps: [
    {
      name: "frontend-admin",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001", // Port dibedakan
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};