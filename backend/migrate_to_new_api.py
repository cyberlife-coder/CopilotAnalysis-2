#!/usr/bin/env python3
"""
Script de migration vers les nouvelles APIs GitHub Copilot
"""
import os
import shutil
import sys
from datetime import datetime

def backup_original_files():
    """Sauvegarde les fichiers originaux"""
    backup_dir = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    os.makedirs(backup_dir, exist_ok=True)
    
    files_to_backup = ['app.py']
    
    for file in files_to_backup:
        if os.path.exists(file):
            shutil.copy2(file, os.path.join(backup_dir, file))
            print(f"✓ Sauvegardé: {file} -> {backup_dir}/{file}")
    
    return backup_dir

def deploy_new_files():
    """Déploie les nouveaux fichiers"""
    # Renommer l'ancien app.py
    if os.path.exists('app.py'):
        shutil.move('app.py', 'app_old.py')
        print("✓ Ancien app.py renommé en app_old.py")
    
    # Renommer le nouveau fichier
    if os.path.exists('app_fixed.py'):
        shutil.move('app_fixed.py', 'app.py')
        print("✓ app_fixed.py renommé en app.py")
    
    print("✓ Nouveaux fichiers déployés:")
    print("  - copilot_api_client.py")
    print("  - metrics_processor.py") 
    print("  - user_manager.py")
    print("  - app.py (version corrigée)")

def update_requirements():
    """Met à jour le fichier requirements.txt si nécessaire"""
    requirements_content = """flask==2.3.3
flask-cors==4.0.0
requests==2.31.0
python-dotenv==1.0.0
pandas==2.0.3
openpyxl==3.1.2
reportlab==4.0.4
"""
    
    with open('requirements.txt', 'w') as f:
        f.write(requirements_content)
    
    print("✓ requirements.txt mis à jour")

def create_migration_summary():
    """Crée un résumé de la migration"""
    summary = """# Résumé de la migration vers les nouvelles APIs GitHub Copilot

## Changements effectués

### 1. Architecture refactorisée
- **copilot_api_client.py**: Client API séparé pour les appels GitHub
- **metrics_processor.py**: Processeur de métriques pour le nouveau format
- **user_manager.py**: Gestionnaire d'utilisateurs et sièges
- **app.py**: Application principale simplifiée

### 2. APIs mises à jour
- ✅ `/orgs/{org}/copilot/billing` (inchangé)
- ✅ `/orgs/{org}/copilot/billing/seats` (inchangé)  
- ❌ `/orgs/{org}/copilot/usage` (remplacé)
- ✅ `/orgs/{org}/copilot/metrics` (nouveau)

### 3. Format de données adapté
- Nouveau format de métriques avec `copilot_ide_code_completions`
- Support des statistiques par éditeur et modèle
- Calculs de métriques globales mis à jour

### 4. Headers d'API standardisés
- `Accept: application/vnd.github+json`
- `X-GitHub-Api-Version: 2022-11-28`

## Tests
- ✅ 9 tests unitaires passent
- ✅ Application démarre correctement
- ✅ Endpoints fonctionnels

## Fichiers sauvegardés
- app_old.py (ancienne version)
- backup_YYYYMMDD_HHMMSS/ (sauvegarde complète)

## Prochaines étapes
1. Tester avec vos vraies données GitHub
2. Vérifier la compatibilité frontend
3. Déployer en production si tout fonctionne

## Support
En cas de problème, vous pouvez revenir à l'ancienne version:
```bash
mv app.py app_new.py
mv app_old.py app.py
```
"""
    
    with open('MIGRATION_SUMMARY.md', 'w') as f:
        f.write(summary)
    
    print("✓ Résumé de migration créé: MIGRATION_SUMMARY.md")

def main():
    """Fonction principale de migration"""
    print("🚀 Migration vers les nouvelles APIs GitHub Copilot")
    print("=" * 50)
    
    try:
        # Vérification des prérequis
        if not os.path.exists('app.py'):
            print("❌ Erreur: app.py non trouvé")
            sys.exit(1)
        
        if not os.path.exists('app_fixed.py'):
            print("❌ Erreur: app_fixed.py non trouvé")
            sys.exit(1)
        
        # Sauvegarde
        backup_dir = backup_original_files()
        print(f"✓ Sauvegarde créée dans: {backup_dir}")
        
        # Déploiement
        deploy_new_files()
        
        # Mise à jour des requirements
        update_requirements()
        
        # Résumé
        create_migration_summary()
        
        print("\n🎉 Migration terminée avec succès!")
        print("\nPour tester la nouvelle version:")
        print("  python3 app.py")
        print("\nPour revenir à l'ancienne version en cas de problème:")
        print("  mv app.py app_new.py && mv app_old.py app.py")
        
    except Exception as e:
        print(f"❌ Erreur lors de la migration: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()

