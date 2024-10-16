FROM node:lts AS build
WORKDIR /app-build
COPY package*.json ./
RUN npm install
COPY . .
RUN npm test
RUN npm run build-docker

FROM node:lts
WORKDIR /app
ENV PORT=80
COPY --from=build /app-build/dist .
RUN npm install --omit=dev \
    && rm package-lock.json
CMD ["node", "main.js"]
