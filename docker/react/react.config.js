module.exports = {
  apps: [
    {
      name: "server",
      script: "./build/server/index.js",
      watch: true,
      instances: process.env.INSTANCES
        ? parseInt(process.env.INSTANCES, 10)
        : 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
