# GCP VM Deployment (Debian 13 + Docker)

Run these commands inside your GCE VM SSH terminal. Replace the placeholder values before running the container.

## 1. Install Docker

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER
newgrp docker
```

Verify Docker is installed:

```bash
docker --version
```

## 2. Clone the repository

```bash
cd ~
git clone https://github.com/AbbasSk2004/vista-hotel-backend.git
cd vista-hotel-backend
```

## 3. Build the Docker image

```bash
docker build -t vista-hotel-backend .
```

## 4. Run the container in the background

Replace the placeholder values with your real secrets before running:

```bash
docker run -d \
  --name vista-hotel-backend \
  --restart unless-stopped \
  -p 8000:8000 \
  -e MONGO_URI="mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/hotel_management" \
  -e JWT_SECRET="replace-with-a-long-random-secret-key" \
  vista-hotel-backend
```

## 5. Verify the deployment

```bash
docker ps
docker logs vista-hotel-backend
curl http://localhost:8000/api/health
```

Expected health response:

```json
{"status":"ok"}
```

## Useful maintenance commands

Stop the container:

```bash
docker stop vista-hotel-backend
```

Start it again:

```bash
docker start vista-hotel-backend
```

Pull latest code and redeploy:

```bash
cd ~/vista-hotel-backend
git pull
docker build -t vista-hotel-backend .
docker stop vista-hotel-backend
docker rm vista-hotel-backend
docker run -d \
  --name vista-hotel-backend \
  --restart unless-stopped \
  -p 8000:8000 \
  -e MONGO_URI="mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/hotel_management" \
  -e JWT_SECRET="replace-with-a-long-random-secret-key" \
  vista-hotel-backend
```

## Firewall note

If the API is not reachable from outside the VM, open port 8000 in your GCP VPC firewall rules and ensure the VM has a tag or rule that allows `tcp:8000`.
