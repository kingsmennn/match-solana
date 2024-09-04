FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies using yarn
RUN yarn install

COPY . /app

EXPOSE 3000

# Use yarn to run the development server
CMD ["yarn", "dev", "--host"]
