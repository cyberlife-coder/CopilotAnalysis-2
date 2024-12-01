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

### Prérequis
- Python 3.8+
- Node.js et npm
- Compte GitHub avec accès administrateur à une organisation
- Token GitHub avec les scopes appropriés

### Configuration Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configuration Frontend
```bash
cd frontend
npm install
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

## 🤝 Contribution
1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add: Amazing Feature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📝 License
MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🎯 Roadmap
- [ ] Métriques utilisateur détaillées
- [ ] Comparaison entre périodes
- [ ] Tableaux de bord personnalisables
- [ ] Intégration CI/CD
- [ ] Tests automatisés

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

## 📞 Support
- Ouvrez une issue pour les bugs
- Consultez la documentation GitHub Copilot
- Contactez le support GitHub pour les problèmes de licence

## ✨ Remerciements
- GitHub API Team
- Contributeurs du projet
- Communauté open-source
