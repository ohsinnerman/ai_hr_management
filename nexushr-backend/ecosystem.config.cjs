// PM2 process config for the NexusHR backend on AWS EC2.
// Usage on the server:  pm2 start ecosystem.config.cjs --env production
module.exports = {
  apps: [
    {
      name: 'nexushr-api',
      script: 'src/server.js',
      cwd: __dirname,
      instances: 1, // t3.micro has 1 vCPU; keep it single-instance
      exec_mode: 'fork',
      max_memory_restart: '450M', // t3.micro has ~1GB RAM; restart if it leaks
      env: {
        NODE_ENV: 'production',
      },
      // Reads the rest (Mongo/Redis/JWT/S3/Gemini) from nexushr-backend/.env via dotenv.
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      time: true,
    },
  ],
};
