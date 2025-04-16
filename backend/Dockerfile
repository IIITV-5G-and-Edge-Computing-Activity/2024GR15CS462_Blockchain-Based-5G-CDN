# Use an official Node.js runtime as the base image
FROM node:16

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json first (to cache npm install layer)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port that the app will run on
EXPOSE 5000

# Run the app
CMD ["node", "edgeNode.js"]
