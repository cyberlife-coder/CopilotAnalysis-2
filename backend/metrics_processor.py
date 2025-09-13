"""
Processeur de métriques GitHub Copilot - Traitement du nouveau format API
"""
import logging
from typing import Dict, List, Tuple
from collections import defaultdict

logger = logging.getLogger(__name__)

class CopilotMetricsProcessor:
    """Processeur pour les nouvelles métriques GitHub Copilot"""
    
    @staticmethod
    def process_metrics_data(metrics_data: List[Dict]) -> Tuple[List[Dict], Dict, Dict]:
        """
        Traite les données de métriques du nouveau format API
        
        Returns:
            Tuple[daily_stats, global_metrics, language_stats]
        """
        logger.debug(f"Processing {len(metrics_data)} days of metrics data")
        
        processed_data = []
        global_metrics = {
            'total_active_users': 0,
            'total_engaged_users': 0,
            'active_days': 0,
            'total_suggestions': 0,
            'total_acceptances': 0,
            'total_lines_suggested': 0,
            'total_lines_accepted': 0,
            'total_chat_turns': 0,
            'total_chat_insertions': 0,
            'total_chat_copies': 0
        }
        
        language_stats = defaultdict(lambda: {
            'suggestions': 0,
            'acceptances': 0,
            'lines_suggested': 0,
            'lines_accepted': 0,
            'engaged_users': 0,
            'acceptance_rate': 0
        })
        
        try:
            for day_data in metrics_data:
                daily_stats = CopilotMetricsProcessor._process_daily_data(day_data)
                processed_data.append(daily_stats)
                
                # Mise à jour des métriques globales
                if daily_stats['total_active_users'] > 0:
                    global_metrics['active_days'] += 1
                    global_metrics['total_active_users'] = max(
                        global_metrics['total_active_users'], 
                        daily_stats['total_active_users']
                    )
                    global_metrics['total_engaged_users'] = max(
                        global_metrics['total_engaged_users'], 
                        daily_stats['total_engaged_users']
                    )
                    global_metrics['total_suggestions'] += daily_stats['total_suggestions']
                    global_metrics['total_acceptances'] += daily_stats['total_acceptances']
                    global_metrics['total_lines_suggested'] += daily_stats['lines_suggested']
                    global_metrics['total_lines_accepted'] += daily_stats['lines_accepted']
                    global_metrics['total_chat_turns'] += daily_stats['chat_turns']
                    global_metrics['total_chat_insertions'] += daily_stats['chat_insertions']
                    global_metrics['total_chat_copies'] += daily_stats['chat_copies']
                
                # Traitement des statistiques par langage
                CopilotMetricsProcessor._process_language_stats(day_data, language_stats)
            
            # Calcul des métriques moyennes
            CopilotMetricsProcessor._calculate_averages(global_metrics, processed_data)
            
            # Calcul des taux d'acceptation par langage
            for lang_stats in language_stats.values():
                if lang_stats['suggestions'] > 0:
                    lang_stats['acceptance_rate'] = round(
                        (lang_stats['acceptances'] / lang_stats['suggestions']) * 100, 2
                    )
            
            # Tri des langages par nombre de suggestions
            language_stats = dict(
                sorted(language_stats.items(), 
                      key=lambda x: x[1]['suggestions'], 
                      reverse=True)
            )
            
        except Exception as e:
            logger.error(f"Error processing metrics data: {str(e)}")
            raise
        
        logger.debug(f"Processed {len(processed_data)} days, {len(language_stats)} languages")
        return processed_data, global_metrics, language_stats
    
    @staticmethod
    def _process_daily_data(day_data: Dict) -> Dict:
        """Traite les données d'une journée"""
        daily_stats = {
            'day': day_data.get('date', 'Unknown'),
            'total_active_users': day_data.get('total_active_users', 0),
            'total_engaged_users': day_data.get('total_engaged_users', 0),
            'total_suggestions': 0,
            'total_acceptances': 0,
            'lines_suggested': 0,
            'lines_accepted': 0,
            'chat_turns': 0,
            'chat_insertions': 0,
            'chat_copies': 0,
            'acceptance_rate': 0
        }
        
        # Traitement des complétions de code IDE
        ide_completions = day_data.get('copilot_ide_code_completions', {})
        for editor in ide_completions.get('editors', []):
            for model in editor.get('models', []):
                for language in model.get('languages', []):
                    daily_stats['total_suggestions'] += language.get('total_code_suggestions', 0)
                    daily_stats['total_acceptances'] += language.get('total_code_acceptances', 0)
                    daily_stats['lines_suggested'] += language.get('total_code_lines_suggested', 0)
                    daily_stats['lines_accepted'] += language.get('total_code_lines_accepted', 0)
        
        # Traitement du chat IDE
        ide_chat = day_data.get('copilot_ide_chat', {})
        for editor in ide_chat.get('editors', []):
            for model in editor.get('models', []):
                daily_stats['chat_turns'] += model.get('total_chats', 0)
                daily_stats['chat_insertions'] += model.get('total_chat_insertion_events', 0)
                daily_stats['chat_copies'] += model.get('total_chat_copy_events', 0)
        
        # Calcul du taux d'acceptation
        if daily_stats['total_suggestions'] > 0:
            daily_stats['acceptance_rate'] = round(
                (daily_stats['total_acceptances'] / daily_stats['total_suggestions']) * 100, 2
            )
        
        # Calcul des suggestions rejetées
        daily_stats['rejected_suggestions'] = (
            daily_stats['total_suggestions'] - daily_stats['total_acceptances']
        )
        
        return daily_stats
    
    @staticmethod
    def _process_language_stats(day_data: Dict, language_stats: Dict):
        """Traite les statistiques par langage pour une journée"""
        ide_completions = day_data.get('copilot_ide_code_completions', {})
        
        for editor in ide_completions.get('editors', []):
            for model in editor.get('models', []):
                for language in model.get('languages', []):
                    lang_name = language.get('name', 'unknown')
                    stats = language_stats[lang_name]
                    
                    stats['suggestions'] += language.get('total_code_suggestions', 0)
                    stats['acceptances'] += language.get('total_code_acceptances', 0)
                    stats['lines_suggested'] += language.get('total_code_lines_suggested', 0)
                    stats['lines_accepted'] += language.get('total_code_lines_accepted', 0)
                    stats['engaged_users'] = max(
                        stats['engaged_users'], 
                        language.get('total_engaged_users', 0)
                    )
    
    @staticmethod
    def _calculate_averages(global_metrics: Dict, processed_data: List[Dict]):
        """Calcule les métriques moyennes"""
        if global_metrics['active_days'] > 0:
            global_metrics['average_suggestions_per_day'] = round(
                global_metrics['total_suggestions'] / global_metrics['active_days'], 2
            )
            
            if global_metrics['total_suggestions'] > 0:
                global_metrics['average_acceptance_rate'] = round(
                    (global_metrics['total_acceptances'] / global_metrics['total_suggestions']) * 100, 2
                )
            
            if global_metrics['total_engaged_users'] > 0:
                global_metrics['average_suggestions_per_user'] = round(
                    global_metrics['total_suggestions'] / global_metrics['total_engaged_users'], 2
                )
            
            # Calcul du taux d'utilisation des sièges
            max_active_users = max((day['total_active_users'] for day in processed_data), default=0)
            if global_metrics['total_active_users'] > 0:
                global_metrics['seats_usage_rate'] = round(
                    (max_active_users / global_metrics['total_active_users']) * 100, 2
                )

