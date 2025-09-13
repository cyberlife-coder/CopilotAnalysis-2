# GitHub Copilot Analytics & ROI Calculator 📊💰

Application web complète pour analyser l'utilisation de GitHub Copilot dans votre organisation et calculer le retour sur investissement (ROI) avec des métriques réelles.

## 🌟 Fonctionnalités Principales

### 📊 **Analytics Copilot Complet**
- **Métriques d'utilisation** : Lignes suggérées/acceptées, taux d'acceptation
- **Statistiques utilisateurs** : Actifs/inactifs, dernière activité, éditeur utilisé
- **Visualisations avancées** : Graphiques Chart.js pour tendances temporelles
- **Données par langage** : Statistiques détaillées par langage de programmation

### 💰 **Calculateur d'Économie ROI**
- **Calculs basés sur données réelles** : Utilise vos métriques Copilot actuelles
- **Économies de temps** : Automatique (15 min/ligne acceptée basé sur études GitHub)
- **Économies financières** : Basé sur votre TJM et heures travaillées
- **Métriques qualité** : Réduction bugs, amélioration globale
- **Tooltips informatifs** : Chaque métrique explique ses calculs et hypothèses

### 🏗️ **Architecture Moderne**
- **Backend** : Python Flask API avec métriques Copilot
- **Frontend** : React + Material-UI + Chart.js
- **Containerisation** : Docker + Docker Compose
- **Sécurité** : Authentification GitHub token-based

## 🚀 Démarrage Rapide

### Prérequis
- **Node.js** 18+
- **Python** 3.11+
- **Docker** & Docker Compose
- **Token GitHub** avec scopes :
  - `manage_billing:copilot`
  - `read:org`
  - `read:user`

### Installation avec Docker 🐳 (Recommandé)

```bash
# 1. Cloner le repository
git clone https://github.com/cyberlife-coder/CopilotAnalysis-2.git
cd CopilotAnalysis-2

# 2. Créer le fichier .env dans backend/
cp backend/.env.example backend/.env
# Éditer backend/.env avec vos tokens

# 3. Lancer l'application
docker-compose up --build
```

L'application sera accessible sur :
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:5000

### Installation Locale (Alternative)

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
npm run dev

# Backend (terminal séparé)
cd ../backend
flask run
```

## ⚙️ Configuration

### Variables d'Environnement (backend/.env)

```env
# GitHub Configuration
GITHUB_TOKEN=ghp_your_github_token_here
GITHUB_ORG=your_organization_name

# Optionnel : Configuration Frontend (pour Docker)
VITE_API_URL=http://localhost:5000
```

### Token GitHub
1. Aller sur [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Générer un nouveau token avec les scopes requis
3. Copier dans `backend/.env`

## 📊 Fonctionnement du Calculateur ROI

### Données Utilisées
Le calculateur utilise **uniquement vos métriques Copilot réelles** :
- Nombre de lignes acceptées
- Taux d'acceptation moyen
- Nombre d'utilisateurs actifs
- Jours d'activité

### Paramètres à Configurer
- **TJM moyen** (€/jour)
- **Heures travaillées** par jour
- **Jours travaillés** par mois

### Calculs Automatiques
- **Temps économisé** : 15 minutes × lignes acceptées
- **Économies financières** : Temps économisé × coût horaire
- **ROI annuel** : (Économies - Coût Copilot) / Coût Copilot × 100
- **Qualité** : Ajusté selon votre taux d'acceptation réel

## 🚀 Déploiement en Production

### Railway (Recommandé - Gratuit) 🚂

Railway est idéal pour votre setup Docker :

1. **Créer un compte** : https://railway.app
2. **Connecter GitHub** → Sélectionner votre repo
3. **Railway détecte** automatiquement le `docker-compose.yml`
4. **Configuration database** : PostgreSQL fourni automatiquement
5. **URL publique** générée automatiquement

**Avantages Railway** :
- ✅ Support Docker natif
- ✅ Database PostgreSQL gratuite
- ✅ Déploiement automatique depuis GitHub
- ✅ Gratuit (512MB RAM, 1GB storage)

### Autres Options

#### Vercel + Railway
- **Vercel** pour le frontend React
- **Railway** pour le backend Python

#### Netlify + Render
- **Netlify** pour le frontend
- **Render** pour le backend (gratuit avec limites)

## 🛠️ Technologies Utilisées

### Backend
- **Python 3.11+**
- **Flask** : API REST
- **Requests** : API GitHub
- **Docker** : Containerisation

### Frontend
- **React 18** avec Hooks
- **Material-UI (MUI)** : Composants UI
- **Chart.js** : Graphiques et visualisations
- **Vite** : Build tool rapide

### DevOps
- **Docker Compose** : Orchestration
- **Railway** : Hébergement gratuit

## 📸 Démonstration (ancienne version)

<div align="center">
  <img src="screenshots/CopilotAnalysis-2.gif" alt="Démonstration complète" width="100%">
</div>

*Fonctionnalités montrées :*
- Configuration GitHub
- Métriques Copilot en temps réel
- Calculateur ROI avec tooltips
- Statistiques détaillées par utilisateur
- Visualisations par langage

## 🔐 Sécurité

- **Token GitHub** stocké côté serveur uniquement
- **Variables d'environnement** non commitées (`.env` dans `.gitignore`)
- **CORS** configuré pour développement
- **Authentification** requise pour toutes les API

## 🐛 Résolution des Problèmes

### Problèmes Courants

**Erreur "Adjacent JSX elements"**
```bash
# Redémarrer le serveur de développement
npm run dev
```

**Token GitHub invalide**
```bash
# Vérifier les scopes du token
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.github.com/orgs/YOUR_ORG/copilot/billing
```

**Problèmes Docker**
```bash
# Logs détaillés
docker-compose logs -f backend
docker-compose logs -f frontend

# Reconstruction complète
docker-compose down
docker-compose up --build --force-recreate
```

## 📈 Métriques et KPIs

Le dashboard affiche automatiquement :
- **Utilisation des sièges** Copilot
- **Taux d'acceptation** moyen
- **Lignes de code** générées/acceptees
- **Activité par langage** de programmation
- **Évolution temporelle** des métriques
- **ROI calculé** automatiquement

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commiter (`git commit -m 'Add: Amazing Feature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

**MIT License** - Voir [LICENSE](LICENSE)

## 🙏 Crédits

Développé avec ❤️ par [cyberlife-coder](https://github.com/cyberlife-coder)

---

**⭐ Si ce projet vous aide, n'hésitez pas à laisser une étoile !**
