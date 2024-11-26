FROM node:20-alpine
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./

# Installer les dépendances
RUN npm install
RUN npm install tailwindcss-animate

# Copier le reste des fichiers
COPY . .

# Exposer le port utilisé par Next.js
EXPOSE 3000

# Démarrer le serveur en mode développement
CMD ["npm", "run", "dev"]
