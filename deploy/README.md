# NexusHR Deployment Guide

## AWS Backend Deployment (ap-south-1, EC2 t2.micro)
1. Launch an Ubuntu 24.04 t2.micro instance in `ap-south-1`.
2. Configure Security Group:
   - **Inbound Rules:** Open port `22` (SSH) and `5000` (Backend API).
3. Connect to the instance via SSH.
4. Upload and run the `aws-setup.sh` script to install Docker and configure swap space:
   ```bash
   chmod +x aws-setup.sh
   ./aws-setup.sh
   ```
   **Important:** Setting up the 2GB swap space is critical because the t2.micro only has 1GB of RAM, and the Node.js backend + Redis container will OOM (Out Of Memory) without it.
5. Clone the repository into `/home/ubuntu/ai_hr_management`.
6. Create a `.env` file in the root directory mirroring `docker-compose.prod.yml` variables:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/nexushr?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=1d
   GEMINI_API_KEY=your_gemini_api_key
   ```
   *(Note: Use MongoDB Atlas M0 free tier to save EC2 memory instead of running Mongo in Docker)*
7. Run the deployment script:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Vercel Frontend Deployment
1. Connect the `nexushr-frontend` repository directory to Vercel.
2. Ensure the build command is `npm run build`.
3. Set the `NEXT_PUBLIC_API_URL` environment variable to point to your EC2 instance:
   - `NEXT_PUBLIC_API_URL=http://<EC2_PUBLIC_IP>:5000/api`
   *(In production, you should map a domain to the EC2 IP and use HTTPS via Nginx/Certbot, changing this to `https://api.yourdomain.com/api`)*
4. Deploy!
