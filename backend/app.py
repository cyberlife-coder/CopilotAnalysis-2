from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import requests
import json
import os
import pandas as pd
from datetime import datetime, timedelta
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from dotenv import load_dotenv
import traceback
import logging

# Configuration du logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Configuration du logging dans un fichier
file_handler = logging.FileHandler('copilot_api.log')
file_handler.setLevel(logging.INFO)
logger.addHandler(file_handler)

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
load_dotenv()

# Configuration
GITHUB_API_BASE = "https://api.github.com"
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
GITHUB_ORG = os.getenv('GITHUB_ORG')

def get_github_headers(token):
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }

def process_daily_metrics(daily_metrics):
    """
    Transforme les métriques quotidiennes en format utilisable par le frontend
    """
    logger.debug(f"Traitement des données quotidiennes")
    
    processed_data = []
    global_metrics = {
        'total_lines_suggested': 0,
        'total_lines_accepted': 0,
        'active_days': 0,
        'total_suggestions': 0,
        'total_users': 0,
        'total_chat_turns': 0,
        'total_chat_acceptances': 0
    }
    
    # Pour suivre les statistiques par langage
    language_stats = {}
    
    try:
        for day_data in daily_metrics:
            logger.debug(f"Traitement du jour: {day_data.get('day')}")
            
            # Statistiques quotidiennes
            total_suggestions = day_data.get('total_suggestions_count', 0)
            total_acceptances = day_data.get('total_acceptances_count', 0)
            
            daily_stats = {
                'day': day_data.get('date', day_data.get('day', 'Unknown')),
                'accepted_suggestions': total_acceptances,
                'rejected_suggestions': total_suggestions - total_acceptances if total_suggestions >= total_acceptances else 0,
                'total_suggestions': total_suggestions,
                'active_users': day_data.get('total_active_users', 0),
                'lines_suggested': day_data.get('total_lines_suggested', 0),
                'lines_accepted': day_data.get('total_lines_accepted', 0),
                'chat_turns': day_data.get('total_chat_turns', 0),
                'chat_acceptances': day_data.get('total_chat_acceptances', 0),
                'acceptance_rate': (total_acceptances / total_suggestions * 100) if total_suggestions > 0 else 0
            }
            
            # Mise à jour des métriques globales
            if daily_stats['total_suggestions'] > 0:
                global_metrics['active_days'] += 1
                global_metrics['total_suggestions'] += daily_stats['total_suggestions']
                global_metrics['total_lines_suggested'] += daily_stats['lines_suggested']
                global_metrics['total_lines_accepted'] += daily_stats['lines_accepted']
                global_metrics['total_users'] = max(global_metrics['total_users'], daily_stats['active_users'])
                global_metrics['total_chat_turns'] += daily_stats['chat_turns']
                global_metrics['total_chat_acceptances'] += daily_stats['chat_acceptances']
            
            # Traitement des statistiques par langage
            for lang_data in day_data.get('breakdown', []):
                lang_name = lang_data.get('language', 'unknown')
                if lang_name not in language_stats:
                    language_stats[lang_name] = {
                        'suggestions': 0,
                        'acceptances': 0,
                        'lines_suggested': 0,
                        'lines_accepted': 0,
                        'active_users': 0,
                        'editor_breakdown': {'vscode': 0, 'visual_studio': 0}
                    }
                
                stats = language_stats[lang_name]
                stats['suggestions'] += lang_data.get('suggestions_count', 0)
                stats['acceptances'] += lang_data.get('acceptances_count', 0)
                stats['lines_suggested'] += lang_data.get('lines_suggested', 0)
                stats['lines_accepted'] += lang_data.get('lines_accepted', 0)
                stats['active_users'] = max(stats['active_users'], lang_data.get('active_users', 0))
                
                # Comptage par éditeur
                editor = lang_data.get('editor', 'unknown')
                if editor in stats['editor_breakdown']:
                    stats['editor_breakdown'][editor] += lang_data.get('suggestions_count', 0)
            
            processed_data.append(daily_stats)
    
    except Exception as e:
        logger.error(f"Erreur lors du traitement des données: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise
    
    # Calcul des métriques moyennes
    if global_metrics['active_days'] > 0:
        global_metrics['average_suggestions_per_day'] = round(global_metrics['total_suggestions'] / global_metrics['active_days'], 2)
        
        total_acceptances = sum(day['accepted_suggestions'] for day in processed_data)
        total_suggestions = sum(day['total_suggestions'] for day in processed_data)
        global_metrics['average_acceptance_rate'] = round((total_acceptances / total_suggestions * 100), 2) if total_suggestions > 0 else 0
        
        if global_metrics['total_users'] > 0:
            global_metrics['average_suggestions_per_user'] = round(global_metrics['total_suggestions'] / global_metrics['total_users'], 2)
        else:
            global_metrics['average_suggestions_per_user'] = 0
            
        # Calcul du taux d'utilisation des sièges
        max_active_users = max((day['active_users'] for day in processed_data), default=0)
        global_metrics['seats_usage_rate'] = round((max_active_users / global_metrics['total_users'] * 100), 2) if global_metrics['total_users'] > 0 else 0
    
    # Ajout des taux d'acceptation pour chaque langage
    for lang_name, stats in language_stats.items():
        stats['acceptance_rate'] = (
            stats['acceptances'] / stats['suggestions'] * 100
        ) if stats['suggestions'] > 0 else 0
    
    # Tri des langages par nombre de suggestions
    language_stats = dict(
        sorted(
            language_stats.items(),
            key=lambda x: x[1]['suggestions'],
            reverse=True
        )
    )
    
    logger.debug(f"Métriques globales: {global_metrics}")
    logger.debug(f"Nombre de langages traités: {len(language_stats)}")
    
    return processed_data, global_metrics, language_stats

@app.route('/api/save-token', methods=['POST'])
def save_token():
    data = request.json
    token = data.get('token')
    org = data.get('organization')
    
    logger.info(f"Received token request with org: {org}")  
    
    if not token or not org:
        return jsonify({"error": "Token and organization are required"}), 400
    
    # Save to .env file
    with open('.env', 'w') as f:
        f.write(f"GITHUB_TOKEN={token}\n")
        f.write(f"GITHUB_ORG={org}\n")
    
    # Reload environment variables
    load_dotenv()
    
    logger.info(f"Saved token and org. Testing GitHub API...")  
    
    # Test the token immediately
    headers = get_github_headers(token)
    try:
        test_response = requests.get(f"{GITHUB_API_BASE}/orgs/{org}", headers=headers)
        test_response.raise_for_status()
        logger.info(f"GitHub API test successful")  
    except Exception as e:
        logger.error(f"GitHub API test failed: {str(e)}")  
        return jsonify({"error": f"Failed to validate GitHub token: {str(e)}"}), 401
    
    return jsonify({"message": "Token saved successfully"})

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    try:
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token manquant'}), 401
            
        org = request.args.get('org')
        if not org:
            return jsonify({'error': 'Organisation manquante'}), 400
            
        headers = {
            'Authorization': token,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        }
        
        logger.info(f"Récupération des métriques pour l'organisation: {org}")
        
        # Récupération des métriques de facturation
        billing_url = f'https://api.github.com/orgs/{org}/copilot/billing'
        billing_response = requests.get(billing_url, headers=headers)
        if billing_response.status_code != 200:
            logger.error(f"Erreur de facturation: {billing_response.status_code} - {billing_response.text}")
            return jsonify({'error': f'Erreur lors de la récupération des données de facturation: {billing_response.text}'}), billing_response.status_code
            
        billing_data = billing_response.json()
        logger.debug(f"Données de facturation reçues: {billing_data}")
        
        # Récupérer les métriques d'utilisation
        from datetime import datetime, timedelta
        
        # Calculer la période (30 derniers jours)
        current_date = datetime.now()
        end_date = current_date.strftime('%Y-%m-%d')
        start_date = (current_date - timedelta(days=30)).strftime('%Y-%m-%d')
        
        logger.info("=== API Usage Request ===")
        logger.info(f"Period: {start_date} to {end_date}")
        
        # Récupérer les métriques d'utilisation
        usage_url = f'https://api.github.com/orgs/{org}/copilot/usage'
        usage_response = requests.get(
            usage_url,
            headers=headers,
            params={
                'start_date': start_date,
                'end_date': end_date
            }
        )
        
        logger.info(f"Status: {usage_response.status_code}")
        if usage_response.status_code != 200:
            error_msg = usage_response.text
            logger.error(f"Error: {error_msg}")
            return jsonify({'error': f'Failed to fetch usage data: {error_msg}'}), usage_response.status_code
            
        usage_data = usage_response.json()
        logger.info(f"Received data: {json.dumps(usage_data, indent=2)}")
        logger.info("=== End API Usage Request ===\n")
        
        # Traitement des données d'utilisation
        daily_metrics, global_metrics, language_stats = process_daily_metrics(usage_data)
        
        response_data = {
            'billing': billing_data,
            'usage': {
                'users': daily_metrics,
                'global_metrics': global_metrics,
                'language_stats': language_stats
            }
        }
        
        logger.info("Réponse préparée avec succès")
        return jsonify(response_data)
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Erreur de requête: {str(e)}")
        return jsonify({'error': f'Erreur de requête: {str(e)}'}), 500
    except Exception as e:
        logger.error(f"Erreur interne: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Erreur interne: {str(e)}'}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        headers = {
            'Authorization': f'Bearer {GITHUB_TOKEN}',
            'Accept': 'application/vnd.github+json'
        }
        
        logger.info("Fetching Copilot data with headers:")
        logger.info(f"Authorization: Bearer {'*' * len(GITHUB_TOKEN)}")
        logger.info(f"Organization: {GITHUB_ORG}")
        
        # Récupérer les sièges
        seats_url = f'https://api.github.com/orgs/{GITHUB_ORG}/copilot/billing/seats'
        logger.info(f"Fetching seats data from: {seats_url}")
        
        seats_response = requests.get(seats_url, headers=headers)
        logger.info(f"Seats response status: {seats_response.status_code}")
        logger.info(f"Seats response headers: {dict(seats_response.headers)}")
        
        if seats_response.status_code != 200:
            logger.error(f"Failed to fetch seats data: {seats_response.status_code}")
            logger.error(f"Response: {seats_response.text}")
            return jsonify({'error': 'Failed to fetch seats data'}), seats_response.status_code
            
        seats_data = seats_response.json()
        logger.info(f"Received seats data for {len(seats_data.get('seats', []))} users")
        
        # Calculer la période (30 derniers jours)
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        
        # Récupérer les métriques d'utilisation
        usage_url = f'https://api.github.com/orgs/{GITHUB_ORG}/copilot/usage'
        logger.info(f"Fetching usage data from: {usage_url}")
        logger.info(f"Date range: {start_date} to {end_date}")
        
        usage_response = requests.get(
            usage_url,
            headers=headers,
            params={
                'start_date': start_date,
                'end_date': end_date
            }
        )
        
        logger.info(f"Usage response status: {usage_response.status_code}")
        logger.info(f"Usage response headers: {dict(usage_response.headers)}")
        
        usage_data = []
        if usage_response.status_code == 200:
            usage_data = usage_response.json()
            logger.info(f"Received usage data: {json.dumps(usage_data, indent=2)}")
        else:
            logger.warning(f"Could not fetch usage data: {usage_response.status_code}")
            logger.warning(f"Response: {usage_response.text}")
        
        # Compiler les statistiques par utilisateur
        user_stats = {}
        for day_data in usage_data:
            logger.debug(f"Processing day: {day_data.get('date')}")
            for user_data in day_data.get('users', []):
                username = user_data.get('user')
                logger.debug(f"Processing user data for {username}: {json.dumps(user_data, indent=2)}")
                
                if username not in user_stats:
                    user_stats[username] = {
                        'total_suggestions': 0,
                        'accepted_suggestions': 0,
                        'rejected_suggestions': 0,
                        'languages': set(),
                        'active_days': set()
                    }
                
                stats = user_stats[username]
                stats['total_suggestions'] += user_data.get('total_suggestions', 0)
                stats['accepted_suggestions'] += user_data.get('accepted_suggestions', 0)
                stats['rejected_suggestions'] += user_data.get('rejected_suggestions', 0)
                stats['languages'].update(user_data.get('languages', []))
                stats['active_days'].add(day_data.get('date'))
                
                logger.debug(f"Updated stats for {username}: {json.dumps({**stats, 'languages': list(stats['languages']), 'active_days': list(stats['active_days'])}, indent=2)}")
        
        # Préparer la réponse
        users = []
        for seat in seats_data.get('seats', []):
            login = seat['assignee']['login']
            stats = user_stats.get(login, {})
            
            total_suggestions = stats.get('total_suggestions', 0)
            acceptance_rate = 0
            if total_suggestions > 0:
                acceptance_rate = (stats.get('accepted_suggestions', 0) / total_suggestions) * 100
            
            user = {
                'login': login,
                'name': seat['assignee'].get('name'),
                'avatar_url': seat['assignee']['avatar_url'],
                'last_activity': seat.get('last_activity_at'),
                'last_editor': seat.get('last_activity_editor'),
                'created_at': seat['created_at'],
                'total_suggestions': total_suggestions,
                'accepted_suggestions': stats.get('accepted_suggestions', 0),
                'rejected_suggestions': stats.get('rejected_suggestions', 0),
                'acceptance_rate': round(acceptance_rate, 2),
                'languages_used': list(stats.get('languages', set())),
                'active_days_count': len(stats.get('active_days', set())),
                'is_active': seat.get('last_activity_at') is not None
            }
            users.append(user)
            logger.debug(f"Prepared user data for {login}: {json.dumps(user, indent=2)}")
        
        response_data = {
            'total_seats': seats_data.get('total_seats', 0),
            'users': users
        }
        logger.info(f"Sending response with {len(users)} users")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error in get_users: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/pdf', methods=['GET'])
def export_pdf():
    token = os.getenv('GITHUB_TOKEN')
    org = os.getenv('GITHUB_ORG')
    
    if not token or not org:
        return jsonify({"error": "Token and organization not configured"}), 400

    headers = get_github_headers(token)
    
    try:
        # Fetch data
        usage_response = requests.get(f"{GITHUB_API_BASE}/orgs/{org}/copilot/usage", headers=headers)
        usage_data = usage_response.json()

        # Create PDF
        filename = f"copilot_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        doc = SimpleDocTemplate(filename, pagesize=letter)
        elements = []

        # Convert data to table format
        data = [['User', 'Suggestions Accepted', 'Suggestions Rejected']]
        for user in usage_data.get('users', []):
            data.append([
                user['user_login'],
                user.get('accepted_suggestions', 0),
                user.get('rejected_suggestions', 0)
            ])

        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(table)
        doc.build(elements)

        return send_file(filename, as_attachment=True)

    except Exception as e:
        logger.error(f"Erreur lors de la génération du PDF: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/export/excel', methods=['GET'])
def export_excel():
    token = os.getenv('GITHUB_TOKEN')
    org = os.getenv('GITHUB_ORG')
    
    if not token or not org:
        return jsonify({"error": "Token and organization not configured"}), 400

    headers = get_github_headers(token)
    
    try:
        # Fetch data
        usage_response = requests.get(f"{GITHUB_API_BASE}/orgs/{org}/copilot/usage", headers=headers)
        usage_data = usage_response.json()

        # Create DataFrame
        users_data = []
        for user in usage_data.get('users', []):
            users_data.append({
                'User': user['user_login'],
                'Suggestions Accepted': user.get('accepted_suggestions', 0),
                'Suggestions Rejected': user.get('rejected_suggestions', 0)
            })

        df = pd.DataFrame(users_data)
        
        # Save to Excel
        filename = f"copilot_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        df.to_excel(filename, index=False)

        return send_file(filename, as_attachment=True)

    except Exception as e:
        logger.error(f"Erreur lors de la génération du fichier Excel: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(debug=True)
