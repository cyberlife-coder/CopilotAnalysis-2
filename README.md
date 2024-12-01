# GitHub Copilot Analytics Dashboard 📊

Un tableau de bord complet pour analyser l'utilisation de GitHub Copilot dans votre organisation.

## 🌟 Fonctionnalités

### Métriques Détaillées
- **Statistiques Globales**
  - Nombre total de suggestions
  - Taux d'acceptation global
  - Moyenne de suggestions par utilisateur
  - Taux d'utilisation des licences

- **Analyse par Langage**
  - Distribution des suggestions par langage
  - Taux d'acceptation spécifique
  - Statistiques d'utilisation détaillées

- **Suivi des Licences**
  - Nombre total de sièges
  - Sièges actifs et inactifs
  - Nouvelles attributions
  - Invitations en attente

### Visualisations
- Graphiques temporels des suggestions
- Distribution des langages
- Taux d'acceptation quotidiens
- Tableaux de métriques détaillées

## 🚀 Installation

### Option 1: Installation Locale

#### Prérequis
- Python 3.8+
- Node.js et npm
- Compte GitHub avec accès administrateur à une organisation
- Token GitHub avec les scopes appropriés

#### Configuration Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Configuration Frontend
```bash
cd frontend
npm install
```

### Option 2: Installation avec Docker 🐳

#### Prérequis
- Docker
- Docker Compose
- Compte GitHub avec accès administrateur à une organisation
- Token GitHub avec les scopes appropriés

#### Configuration
1. Créez un fichier `.env` dans le dossier backend avec vos informations:
```env
GITHUB_TOKEN=votre_token_github
GITHUB_ORG=votre_organisation
```

2. Lancer l'application avec Docker Compose:
```bash
docker-compose up --build
```

L'application sera accessible sur:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

#### Fonctionnalités Docker Avancées

##### Health Checks
Les conteneurs sont configurés avec des health checks pour assurer leur bon fonctionnement:
- Backend: Vérifie l'endpoint `/api/health` toutes les 30 secondes
- Frontend: Vérifie l'accessibilité du serveur Vite toutes les 30 secondes

##### Politique de Redémarrage
- Les conteneurs redémarrent automatiquement en cas de panne (`restart: unless-stopped`)
- Le frontend attend que le backend soit en bonne santé avant de démarrer

##### Commandes Docker Utiles
```bash
# Vérifier l'état des conteneurs et leur santé
docker-compose ps

# Voir les logs en temps réel
docker-compose logs -f

# Redémarrer un service spécifique
docker-compose restart backend  # ou frontend

# Arrêter les conteneurs
docker-compose down
```

##### Résolution des Problèmes Docker
- **Problèmes de Santé des Conteneurs**
  ```bash
  # Vérifier les logs de santé
  docker inspect --format "{{json .State.Health }}" copilotanalysis-2-backend-1
  ```

- **Problèmes de Réseau**
  ```bash
  # Vérifier la connexion entre les conteneurs
  docker-compose exec frontend curl backend:5000/api/health
  ```

Pour arrêter les conteneurs:
```bash
docker-compose down
```

### Variables d'Environnement
Créez un fichier `.env` dans le dossier backend :
```env
GITHUB_TOKEN=votre_token_github
GITHUB_ORG=votre_organisation
```

## 🔧 Utilisation

### Démarrer le Backend
```bash
cd backend
python app.py
```

### Démarrer le Frontend
```bash
cd frontend
npm start
```

## 🔑 Configuration GitHub

### Token GitHub Requis
Le token doit avoir les permissions suivantes :
- `manage_billing:copilot`
- `read:org`
- `read:user`

### Configuration de l'Organisation
1. Accédez aux paramètres de votre organisation
2. Activez GitHub Copilot
3. Configurez les accès utilisateurs

## 📈 Fonctionnalités Principales

### Analyse des Métriques
- Suivi en temps réel des suggestions
- Analyse des taux d'acceptation
- Statistiques par langage
- Utilisation des licences

### Visualisation des Données
- Graphiques interactifs
- Tableaux détaillés
- Filtres temporels
- Export des données

## 🛠 Architecture

### Backend (Python/Flask)
- API RESTful
- Intégration GitHub API
- Traitement des métriques
- Gestion des erreurs

### Frontend (React)
- Interface Material-UI
- Composants réactifs
- Visualisations Chart.js
- Gestion d'état moderne

## 📋 API Endpoints

### Métriques
- `GET /api/metrics` : Métriques globales
- `GET /api/metrics/daily` : Métriques quotidiennes
- `GET /api/metrics/languages` : Statistiques par langage

### Exports
- `GET /api/export/pdf` : Export PDF
- `GET /api/export/excel` : Export Excel

## 🔒 Sécurité
- Authentification par token
- Validation des entrées
- Gestion sécurisée des secrets
- Logs d'audit

## 📝 License

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

### Points Clés de la Licence
- ✅ Utilisation commerciale autorisée
- ✅ Modification et distribution autorisées
- ✅ Utilisation privée autorisée
- ✅ Pas de garantie fournie
- ℹ️ Obligation de conserver la notice de copyright

### Attribution
Si vous utilisez ce projet, merci d'inclure l'attribution suivante :
```
Basé sur GitHub Copilot Analytics Dashboard (https://github.com/M4k34B3tt3rW0r1D/CopilotAnalysis-2)
Copyright (c) 2024 TUI
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment vous pouvez contribuer :

1. Fork le projet
2. Créez votre branche de fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add: Amazing Feature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Guide de Contribution
- Respectez le style de code existant
- Ajoutez des tests pour les nouvelles fonctionnalités
- Mettez à jour la documentation si nécessaire
- Vérifiez que tous les tests passent

## 📞 Support et Contact

- 📧 Pour les questions techniques : Ouvrez une issue sur GitHub
- 🔧 Pour les problèmes de licence Copilot : Contactez le support GitHub
- 💡 Pour les suggestions : Utilisez les discussions GitHub

## ✨ Remerciements

- L'équipe GitHub pour l'API Copilot
- La communauté open-source
- Tous les contributeurs du projet

---

<div align="center">
Développé avec ❤️ par TUI
</div>

## 🐛 Résolution des Problèmes

### Problèmes Courants
1. **Token invalide**
   - Vérifiez les permissions
   - Régénérez le token

2. **Données manquantes**
   - Vérifiez la connexion API
   - Consultez les logs

3. **Erreurs d'affichage**
   - Effacez le cache
   - Rechargez l'application

4. **Problèmes avec Docker**
   - **Communication Frontend-Backend**
     - Vérifiez que les conteneurs sont sur le même réseau (`app-network`)
     - Assurez-vous que le backend écoute sur `0.0.0.0` et non uniquement sur localhost
     - Vérifiez les logs avec `docker-compose logs`
   
   - **Reconstruction des conteneurs**
     ```bash
     # Arrêter et supprimer les conteneurs existants
     docker-compose down
     
     # Reconstruire et démarrer les conteneurs
     docker-compose up --build --force-recreate
     ```
   
   - **Vérification des conteneurs**
     ```bash
     # Vérifier l'état des conteneurs
     docker-compose ps
     
     # Voir les logs en temps réel
     docker-compose logs -f
     ```

## 📈 Roadmap
- [ ] Métriques utilisateur détaillées
- [ ] Comparaison entre périodes
- [ ] Tableaux de bord personnalisables
- [ ] Intégration CI/CD
- [ ] Tests automatisés
