# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Install netcat
RUN apt-get update && apt-get install -y netcat-openbsd

# Install tini
RUN apt-get update && apt-get install -y tini

# Copy the source code and tsconfig.json
COPY src ./src
COPY tsconfig.json ./

# Create dist directory
RUN mkdir dist

# Build the project
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the production server using tini
CMD ["tini", "--", "sh", "-c", "while ! nc -z mysql 3306; do sleep 1; done && npm start"]
