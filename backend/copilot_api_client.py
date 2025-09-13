"""
Client API GitHub Copilot - Gestion des appels aux nouvelles APIs
"""
import requests
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

class GitHubCopilotAPIClient:
    """Client pour les APIs GitHub Copilot avec support des nouveaux endpoints"""
    
    def __init__(self, token: str, org: str):
        self.token = token
        self.org = org
        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }
    
    def get_billing_info(self) -> Dict:
        """Récupère les informations de facturation Copilot"""
        url = f"{self.base_url}/orgs/{self.org}/copilot/billing"
        logger.info(f"Fetching billing info from: {url}")
        
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        
        return response.json()
    
    def get_seats_info(self, page: int = 1, per_page: int = 50) -> Dict:
        """Récupère les informations des sièges Copilot"""
        url = f"{self.base_url}/orgs/{self.org}/copilot/billing/seats"
        params = {"page": page, "per_page": per_page}
        
        logger.info(f"Fetching seats info from: {url}")
        
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        
        return response.json()
    
    def get_metrics(self, since: Optional[str] = None, until: Optional[str] = None, 
                   page: int = 1, per_page: int = 100) -> List[Dict]:
        """Récupère les métriques Copilot avec le nouveau format"""
        url = f"{self.base_url}/orgs/{self.org}/copilot/metrics"
        
        params = {"page": page, "per_page": per_page}
        if since:
            params["since"] = since
        if until:
            params["until"] = until
            
        logger.info(f"Fetching metrics from: {url} with params: {params}")
        
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        
        return response.json()
    
    def get_metrics_for_period(self, days: int = 30) -> List[Dict]:
        """Récupère les métriques pour une période donnée"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        since = start_date.strftime('%Y-%m-%dT%H:%M:%SZ')
        until = end_date.strftime('%Y-%m-%dT%H:%M:%SZ')
        
        return self.get_metrics(since=since, until=until)
    
    def test_connection(self) -> bool:
        """Test la connexion à l'API GitHub"""
        try:
            url = f"{self.base_url}/orgs/{self.org}"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            logger.info("GitHub API connection test successful")
            return True
        except Exception as e:
            logger.error(f"GitHub API connection test failed: {str(e)}")
            return False

