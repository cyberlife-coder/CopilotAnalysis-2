# GitHub Copilot Analytics Dashboard 📊

Application web pour analyser l'utilisation de GitHub Copilot dans votre organisation.

## 🌟 Fonctionnalités

- 📊 Visualisation des métriques Copilot
- 👥 Suivi des utilisateurs actifs/inactifs
- 💻 Statistiques d'utilisation détaillées
- 🔐 Authentification sécurisée via token GitHub

## 🚀 Prérequis

- Node.js
- Python 3.11+
- Docker et Docker Compose
- Token GitHub avec les scopes :
  - `manage_billing:copilot`
  - `read:org`
  - `read:user`

## ⚙️ Installation

### Option 1: Installation Locale

1. Cloner le repository :
```bash
git clone https://github.com/cyberlife-coder/CopilotAnalysis-2.git
cd CopilotAnalysis-2
```

2. Backend (Python/Flask) :
```bash
cd backend
python -m venv venv
source venv/bin/activate  # ou `venv\Scripts\activate` sous Windows
pip install -r requirements.txt
```

3. Frontend (React) :
```bash
cd frontend
npm install
```

4. Créer un fichier `.env` dans le dossier backend :
```env
GITHUB_TOKEN=votre_token_github
GITHUB_ORG=votre_organisation
```

5. Lancer l'application :
```bash
# Terminal 1 (Backend)
cd backend
flask run

# Terminal 2 (Frontend)
cd frontend
npm run dev
```

### Option 2: Installation avec Docker 🐳

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

## 📸 Démonstration

<div align="center">
  <img src="screenshots/CopilotAnalysis-2.gif" alt="Démonstration de GitHub Copilot Analytics" width="100%">
</div>

*Cette animation montre les principales fonctionnalités de l'application :*
- Configuration avec token GitHub et nom de l'organisation
- Affichage des métriques Copilot (sièges actifs/inactifs)
- Visualisation des statistiques d'utilisation
- Liste détaillée des utilisateurs et leurs activités

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
Basé sur GitHub Copilot Analytics Dashboard (https://github.com/cyberlife-coder/CopilotAnalysis-2)
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

## 🐛 Résolution des Problèmes

### Problèmes Docker Courants

- **Le conteneur backend ne démarre pas**
  ```bash
  # Vérifier les logs
  docker-compose logs backend
  ```

- **Problèmes de connexion frontend-backend**
  ```bash
  # Vérifier la configuration réseau
  docker network ls
  docker-compose ps
  ```

- **Voir les logs en temps réel**
  ```bash
  docker-compose logs -f
  ```

## 💡 Idées d'Améliorations
- [ ] Export des données en PDF/Excel
- [ ] Filtres de date personnalisés
- [ ] Comparaison entre périodes
- [ ] Tableaux de bord personnalisables
- [ ] Notifications d'utilisation
