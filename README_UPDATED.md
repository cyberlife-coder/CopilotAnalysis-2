# GitHub Copilot Analytics Dashboard 📊 - Version Corrigée

Application web pour analyser l'utilisation de GitHub Copilot dans votre organisation.

## ⚠️ Version Corrigée - Nouvelles APIs 2024/2025

Cette version corrigée utilise les **nouvelles APIs GitHub Copilot** et résout les problèmes liés à la dépréciation des endpoints `/usage` en février 2025.

### 🔄 Changements principaux
- ✅ **APIs mises à jour** : Utilisation des endpoints `/copilot/metrics` et `/copilot/billing`
- ✅ **Architecture refactorisée** : Code modulaire respectant les principes du software craftsmanship
- ✅ **Tests unitaires** : 9 tests couvrant toutes les fonctionnalités
- ✅ **Fichiers < 500 lignes** : Respect des bonnes pratiques de développement
- ✅ **Migration automatique** : Script pour migrer depuis l'ancienne version

## 🌟 Fonctionnalités

- 📊 Visualisation des métriques Copilot avec le nouveau format API
- 👥 Suivi des utilisateurs actifs/inactifs avec statuts détaillés
- 💻 Statistiques d'utilisation par langage et éditeur
- 🔐 Authentification sécurisée via token GitHub
- 📈 Métriques globales et tendances sur 30 jours
- 🎯 Taux d'acceptation et statistiques de performance

## 🚀 Installation rapide

### Option 1: Migration automatique (si vous avez déjà l'application)
```bash
cd backend
python3 migrate_to_new_api.py
```

### Option 2: Installation complète
```bash
# 1. Cloner le repository
git clone https://github.com/cyberlife-coder/CopilotAnalysis-2.git
cd CopilotAnalysis-2

# 2. Backend
cd backend
pip3 install -r requirements.txt

# 3. Configuration
cp .env.example .env
# Éditer .env avec votre token GitHub et organisation

# 4. Frontend
cd ../frontend
npm install

# 5. Lancement
# Terminal 1 (Backend)
cd backend && python3 app.py

# Terminal 2 (Frontend)
cd frontend && npm run dev
```

## 🔑 Configuration du token GitHub

### Scopes requis
Votre token GitHub doit avoir les permissions suivantes :
- ✅ `manage_billing:copilot` (obligatoire)
- ✅ `read:org` (obligatoire)
- ✅ `read:enterprise` (optionnel, pour les entreprises)

### Génération du token
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Sélectionner les scopes requis
4. Copier le token dans votre fichier `.env`

## 🏗️ Architecture technique

### Backend modulaire
```
backend/
├── app.py                    # Application Flask principale (< 200 lignes)
├── copilot_api_client.py     # Client API GitHub (< 100 lignes)
├── metrics_processor.py     # Processeur de métriques (< 200 lignes)
├── user_manager.py          # Gestionnaire d'utilisateurs (< 150 lignes)
├── test_copilot_api.py      # Tests unitaires complets
└── migrate_to_new_api.py    # Script de migration
```

### APIs utilisées (nouvelles versions)
- `GET /orgs/{org}/copilot/billing` - Informations de facturation
- `GET /orgs/{org}/copilot/billing/seats` - Liste des sièges
- `GET /orgs/{org}/copilot/metrics` - **Nouvelles métriques** (remplace `/usage`)

## 🧪 Tests et qualité

### Exécution des tests
```bash
cd backend
python3 -m unittest test_copilot_api.py -v
```

### Résultats attendus
```
test_process_daily_data ... ok
test_process_metrics_data ... ok
test_get_activity_status ... ok
test_process_users_data ... ok
test_get_billing_info_success ... ok
test_get_metrics_success ... ok
test_initialization ... ok
test_test_connection_failure ... ok
test_test_connection_success ... ok
----------------------------------------------------------------------
Ran 9 tests in 0.003s
OK
```

### Vérification de santé
```bash
curl http://localhost:5000/api/health
```

## 📊 Nouvelles métriques disponibles

### Métriques globales
- Utilisateurs actifs/engagés par jour
- Suggestions de code par langage et éditeur
- Taux d'acceptation détaillés
- Utilisation du chat Copilot (IDE et web)
- Statistiques de pull requests

### Métriques par utilisateur
- Statut d'activité (très actif, actif, inactif, jamais actif)
- Dernière activité et éditeur utilisé
- Informations de siège et type de plan

## 🐳 Déploiement Docker

```bash
# Configuration
echo "GITHUB_TOKEN=your_token" > backend/.env
echo "GITHUB_ORG=your_org" >> backend/.env

# Lancement
docker-compose up --build
```

Accès :
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 🔧 Résolution des problèmes

### Erreurs courantes

#### Token invalide (401)
```json
{"error": "Token manquant"}
```
**Solution** : Vérifier le token dans `.env` et ses permissions

#### Permissions insuffisantes (403)
```json
{"error": "Forbidden"}
```
**Solution** : Vérifier les scopes `manage_billing:copilot` et `read:org`

#### API désactivée (422)
```json
{"error": "Copilot Usage Metrics API setting is disabled"}
```
**Solution** : Activer l'API Copilot Metrics dans les paramètres de l'organisation

#### Pas de données
**Causes** :
- Moins de 5 utilisateurs actifs (limitation GitHub)
- Télémétrie désactivée dans les IDEs
- Organisation récente (< 24h)

## 📚 Documentation complète

- 📋 [Spécifications Fonctionnelles](SPECIFICATIONS_FONCTIONNELLES.md)
- 🔧 [Spécifications Techniques](SPECIFICATIONS_TECHNIQUES.md)
- ⚙️ [Guide de Configuration](GUIDE_CONFIGURATION.md)
- 🔄 [Résumé de Migration](MIGRATION_SUMMARY.md)

## 🆕 Nouveautés de cette version

### Corrections des APIs
- ❌ **Ancien** : `/orgs/{org}/copilot/usage` (déprécié février 2025)
- ✅ **Nouveau** : `/orgs/{org}/copilot/metrics` (format 2024/2025)

### Améliorations techniques
- 🏗️ **Architecture modulaire** : Séparation des responsabilités
- 🧪 **Tests complets** : Couverture de toutes les fonctionnalités
- 📏 **Fichiers courts** : Respect de la limite de 500 lignes
- 🔄 **Migration facile** : Script automatique de mise à jour

### Nouvelles fonctionnalités
- 📊 **Métriques enrichies** : Plus de détails par éditeur et modèle
- 👤 **Statuts utilisateur** : Classification fine de l'activité
- 🔍 **Logging amélioré** : Débogage facilité
- ⚡ **Performance** : Traitement optimisé des données

## 🤝 Support et contribution

### Problèmes connus
- L'API GitHub ne fournit plus de statistiques individuelles par utilisateur dans les métriques (limitation API)
- Les données nécessitent minimum 5 utilisateurs actifs (limitation GitHub)

### Contribution
1. Fork le projet
2. Créer une branche de fonctionnalité
3. Respecter les principes TDD et software craftsmanship
4. Maintenir les fichiers sous 500 lignes
5. Ajouter des tests pour toute nouvelle fonctionnalité

## 📝 License

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🎯 Migration depuis l'ancienne version

Si vous utilisez déjà l'application, la migration est simple :

```bash
cd backend
python3 migrate_to_new_api.py
```

Le script :
- ✅ Sauvegarde automatiquement l'ancienne version
- ✅ Déploie les nouveaux fichiers
- ✅ Met à jour les dépendances
- ✅ Crée un résumé détaillé des changements

En cas de problème, vous pouvez revenir à l'ancienne version :
```bash
mv app.py app_new.py
mv app_old.py app.py
```

**Testez la nouvelle version dès maintenant pour éviter les interruptions de service !**

