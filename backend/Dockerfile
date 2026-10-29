
FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc curl wget ca-certificates \
    && wget -q https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb \
       -O /tmp/packages-microsoft-prod.deb \
    && dpkg -i /tmp/packages-microsoft-prod.deb \
    && apt-get update \
    && apt-get install -y --no-install-recommends powershell \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Change this filename if your C source has another name.
RUN gcc C_program/route_planner.c -o C_program/route_planner

EXPOSE 10000

CMD ["npm", "start"]
