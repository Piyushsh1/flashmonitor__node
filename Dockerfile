# install node.js
FROM --platform=linux/amd64 node:18.0.0-alpine

# Install Python and related build tools
RUN apk add --no-cache python3 make g++

# create necessary directories and
# permissions
RUN mkdir -p /home/node/node_modules && chmod -R ug+rw /home/node/

# copy project files.
COPY .build /home/node

# switch to working directory
WORKDIR /home/node

# Install deps.
RUN npm install -g npm@8.6.0 && npm i pnpm pm2 -g && pnpm i --shamefully-hoist

# expose port
EXPOSE 4000
EXPOSE 2775

# Start the Node.js application using PM2
CMD ["pm2-runtime", "start", "index.js", "-i", "max"]
