"""
Gestionnaire d'utilisateurs GitHub Copilot - Traitement des données de sièges
"""
import logging
from typing import Dict, List
from datetime import datetime

logger = logging.getLogger(__name__)

class CopilotUserManager:
    """Gestionnaire pour les utilisateurs et sièges Copilot"""
    
    @staticmethod
    def process_users_data(seats_data: Dict, metrics_data: List[Dict]) -> List[Dict]:
        """
        Traite les données des utilisateurs en combinant sièges et métriques
        
        Args:
            seats_data: Données des sièges depuis l'API billing/seats
            metrics_data: Données des métriques depuis l'API metrics
            
        Returns:
            Liste des utilisateurs avec leurs statistiques
        """
        logger.debug(f"Processing {len(seats_data.get('seats', []))} seats")
        
        # Compiler les statistiques par utilisateur depuis les métriques
        user_stats = CopilotUserManager._compile_user_stats(metrics_data)
        
        # Préparer la liste des utilisateurs
        users = []
        for seat in seats_data.get('seats', []):
            user = CopilotUserManager._process_user_seat(seat, user_stats)
            users.append(user)
        
        logger.debug(f"Processed {len(users)} users")
        return users
    
    @staticmethod
    def _compile_user_stats(metrics_data: List[Dict]) -> Dict[str, Dict]:
        """Compile les statistiques par utilisateur depuis les métriques"""
        user_stats = {}
        
        for day_data in metrics_data:
            date = day_data.get('date')
            
            # Traitement des complétions de code IDE
            ide_completions = day_data.get('copilot_ide_code_completions', {})
            CopilotUserManager._process_ide_completions_for_users(
                ide_completions, user_stats, date
            )
            
            # Traitement du chat IDE
            ide_chat = day_data.get('copilot_ide_chat', {})
            CopilotUserManager._process_ide_chat_for_users(
                ide_chat, user_stats, date
            )
        
        return user_stats
    
    @staticmethod
    def _process_ide_completions_for_users(ide_completions: Dict, user_stats: Dict, date: str):
        """Traite les complétions IDE pour extraire les stats utilisateur"""
        # Note: La nouvelle API ne fournit pas de données par utilisateur individuel
        # dans les métriques, seulement des agrégations
        # Cette fonction est préparée pour une future évolution de l'API
        pass
    
    @staticmethod
    def _process_ide_chat_for_users(ide_chat: Dict, user_stats: Dict, date: str):
        """Traite le chat IDE pour extraire les stats utilisateur"""
        # Note: Même limitation que pour les complétions
        pass
    
    @staticmethod
    def _process_user_seat(seat: Dict, user_stats: Dict) -> Dict:
        """Traite les données d'un siège utilisateur"""
        assignee = seat.get('assignee', {})
        login = assignee.get('login', '')
        
        # Récupération des stats utilisateur (vides pour l'instant car l'API ne les fournit pas)
        stats = user_stats.get(login, {
            'total_suggestions': 0,
            'accepted_suggestions': 0,
            'rejected_suggestions': 0,
            'languages': [],
            'active_days': 0,
            'acceptance_rate': 0,
            'lines_suggested': 0,
            'lines_accepted': 0,
            'chat_turns': 0,
            'chat_acceptances': 0
        })
        
        # Formatage de la dernière activité
        last_activity = seat.get('last_activity_at')
        if last_activity:
            try:
                last_activity_date = datetime.fromisoformat(
                    last_activity.replace('Z', '+00:00')
                )
                days_since_activity = (datetime.now().replace(tzinfo=None) - 
                                     last_activity_date.replace(tzinfo=None)).days
            except:
                days_since_activity = None
        else:
            days_since_activity = None
        
        user = {
            'login': login,
            'name': assignee.get('name'),
            'avatar_url': assignee.get('avatar_url'),
            'last_activity': last_activity,
            'last_activity_editor': seat.get('last_activity_editor'),
            'last_authenticated_at': seat.get('last_authenticated_at'),
            'created_at': seat.get('created_at'),
            'updated_at': seat.get('updated_at'),
            'pending_cancellation_date': seat.get('pending_cancellation_date'),
            'plan_type': seat.get('plan_type', 'business'),
            'days_since_last_activity': days_since_activity,
            
            # Statistiques d'utilisation
            'total_suggestions': stats['total_suggestions'],
            'accepted_suggestions': stats['accepted_suggestions'],
            'rejected_suggestions': stats['rejected_suggestions'],
            'acceptance_rate': stats['acceptance_rate'],
            'languages': stats['languages'],
            'active_days': stats['active_days'],
            'lines_suggested': stats['lines_suggested'],
            'lines_accepted': stats['lines_accepted'],
            'chat_turns': stats['chat_turns'],
            'chat_acceptances': stats['chat_acceptances'],
            
            # Statut d'activité
            'is_active': days_since_activity is not None and days_since_activity <= 30,
            'activity_status': CopilotUserManager._get_activity_status(days_since_activity)
        }
        
        return user
    
    @staticmethod
    def _get_activity_status(days_since_activity: int) -> str:
        """Détermine le statut d'activité d'un utilisateur"""
        if days_since_activity is None:
            return 'never_active'
        elif days_since_activity <= 7:
            return 'very_active'
        elif days_since_activity <= 30:
            return 'active'
        elif days_since_activity <= 90:
            return 'inactive'
        else:
            return 'very_inactive'

