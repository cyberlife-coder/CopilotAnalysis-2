"""
Application Flask pour l'analyse GitHub Copilot - Version corrigée
Utilise les nouvelles APIs GitHub Copilot (2024/2025)
"""
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
import traceback
import logging
from dotenv import load_dotenv

# Import des modules séparés
from copilot_api_client import GitHubCopilotAPIClient
from metrics_processor import CopilotMetricsProcessor
from user_manager import CopilotUserManager

# Configuration du logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Configuration du logging dans un fichier
file_handler = logging.FileHandler('copilot_api.log')
file_handler.setLevel(logging.INFO)
logger.addHandler(file_handler)

# Initialisation de l'application Flask
app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
load_dotenv()

# Configuration globale
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
GITHUB_ORG = os.getenv('GITHUB_ORG')

class CopilotAnalyticsApp:
    """Classe principale de l'application d'analyse Copilot"""
    
    def __init__(self):
        self.api_client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialise le client API si les credentials sont disponibles"""
        if GITHUB_TOKEN and GITHUB_ORG:
            try:
                self.api_client = GitHubCopilotAPIClient(GITHUB_TOKEN, GITHUB_ORG)
                logger.info("API client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize API client: {str(e)}")
    
    def save_token(self, token: str, org: str) -> dict:
        """Sauvegarde le token et l'organisation"""
        try:
            # Validation du token
            test_client = GitHubCopilotAPIClient(token, org)
            if not test_client.test_connection():
                return {"error": "Failed to validate GitHub token"}, 401
            
            # Sauvegarde dans .env
            with open('.env', 'w') as f:
                f.write(f"GITHUB_TOKEN={token}\n")
                f.write(f"GITHUB_ORG={org}\n")
            
            # Rechargement des variables d'environnement
            load_dotenv()
            
            # Mise à jour du client
            self.api_client = test_client
            
            logger.info(f"Token saved and validated for org: {org}")
            return {"message": "Token saved successfully"}
            
        except Exception as e:
            logger.error(f"Error saving token: {str(e)}")
            return {"error": f"Failed to save token: {str(e)}"}, 500
    
    def get_metrics(self, token: str, org: str) -> dict:
        """Récupère les métriques Copilot"""
        try:
            # Création d'un client temporaire si nécessaire
            if not self.api_client or self.api_client.org != org:
                client = GitHubCopilotAPIClient(token.replace('Bearer ', ''), org)
            else:
                client = self.api_client
            
            logger.info(f"Fetching metrics for organization: {org}")
            
            # Récupération des données de facturation
            billing_data = client.get_billing_info()
            logger.debug(f"Billing data received: {billing_data}")
            
            # Récupération des métriques (30 derniers jours)
            metrics_data = client.get_metrics_for_period(30)
            logger.info(f"Received metrics for {len(metrics_data)} days")
            
            # Traitement des données
            daily_metrics, global_metrics, language_stats = (
                CopilotMetricsProcessor.process_metrics_data(metrics_data)
            )
            
            response_data = {
                'billing': billing_data,
                'usage': {
                    'users': daily_metrics,
                    'global_metrics': global_metrics,
                    'language_stats': language_stats
                }
            }
            
            logger.info("Metrics response prepared successfully")
            return response_data
            
        except Exception as e:
            logger.error(f"Error fetching metrics: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {"error": f"Failed to fetch metrics: {str(e)}"}, 500
    
    def get_users(self) -> dict:
        """Récupère les informations des utilisateurs"""
        try:
            if not self.api_client:
                return {"error": "API client not initialized"}, 500
            
            logger.info("Fetching users data")
            
            # Récupération des sièges
            seats_data = self.api_client.get_seats_info()
            logger.info(f"Received seats data for {len(seats_data.get('seats', []))} users")
            
            # Récupération des métriques pour enrichir les données utilisateur
            metrics_data = self.api_client.get_metrics_for_period(30)
            
            # Traitement des données utilisateur
            users = CopilotUserManager.process_users_data(seats_data, metrics_data)
            
            response_data = {
                'total_seats': seats_data.get('total_seats', len(users)),
                'users': users
            }
            
            logger.info(f"Users response prepared with {len(users)} users")
            return response_data
            
        except Exception as e:
            logger.error(f"Error fetching users: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {"error": f"Failed to fetch users: {str(e)}"}, 500

# Instance globale de l'application
copilot_app = CopilotAnalyticsApp()

# Routes Flask
@app.route('/api/save-token', methods=['POST'])
def save_token():
    """Endpoint pour sauvegarder le token GitHub"""
    data = request.json
    token = data.get('token')
    org = data.get('organization')
    
    logger.info(f"Received token request for org: {org}")
    
    if not token or not org:
        return jsonify({"error": "Token and organization are required"}), 400
    
    result = copilot_app.save_token(token, org)
    
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    else:
        return jsonify(result)

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """Endpoint pour récupérer les métriques Copilot"""
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Token manquant'}), 401
        
    org = request.args.get('org')
    if not org:
        return jsonify({'error': 'Organisation manquante'}), 400
    
    result = copilot_app.get_metrics(token, org)
    
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    else:
        return jsonify(result)

@app.route('/api/users', methods=['GET'])
def get_users():
    """Endpoint pour récupérer les utilisateurs"""
    result = copilot_app.get_users()
    
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    else:
        return jsonify(result)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint de vérification de santé"""
    return jsonify({
        "status": "healthy",
        "api_client_initialized": copilot_app.api_client is not None,
        "github_org": GITHUB_ORG,
        "has_token": bool(GITHUB_TOKEN)
    })

if __name__ == '__main__':
    app.run(debug=True)

