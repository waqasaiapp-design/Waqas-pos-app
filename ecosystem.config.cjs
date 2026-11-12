module.exports = {
  apps: [
    {
      name: 'waqas-pos',
      script: 'server.cjs',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
  ],
};
