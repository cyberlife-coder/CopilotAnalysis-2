"""
Tests unitaires pour les APIs GitHub Copilot corrigées
"""
import unittest
from unittest.mock import Mock, patch, MagicMock
import json
from datetime import datetime, timedelta

from copilot_api_client import GitHubCopilotAPIClient
from metrics_processor import CopilotMetricsProcessor
from user_manager import CopilotUserManager

class TestGitHubCopilotAPIClient(unittest.TestCase):
    """Tests pour le client API GitHub Copilot"""
    
    def setUp(self):
        self.client = GitHubCopilotAPIClient("test_token", "test_org")
    
    def test_initialization(self):
        """Test l'initialisation du client"""
        self.assertEqual(self.client.token, "test_token")
        self.assertEqual(self.client.org, "test_org")
        self.assertEqual(self.client.base_url, "https://api.github.com")
        self.assertIn("Bearer test_token", self.client.headers["Authorization"])
        self.assertEqual(self.client.headers["Accept"], "application/vnd.github+json")
        self.assertEqual(self.client.headers["X-GitHub-Api-Version"], "2022-11-28")
    
    @patch('copilot_api_client.requests.get')
    def test_get_billing_info_success(self, mock_get):
        """Test la récupération des informations de facturation"""
        mock_response = Mock()
        mock_response.json.return_value = {"seat_breakdown": {"total": 10}}
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        result = self.client.get_billing_info()
        
        self.assertEqual(result, {"seat_breakdown": {"total": 10}})
        mock_get.assert_called_once_with(
            "https://api.github.com/orgs/test_org/copilot/billing",
            headers=self.client.headers
        )
    
    @patch('copilot_api_client.requests.get')
    def test_get_metrics_success(self, mock_get):
        """Test la récupération des métriques"""
        mock_response = Mock()
        mock_response.json.return_value = [{"date": "2024-01-01", "total_active_users": 5}]
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        result = self.client.get_metrics()
        
        self.assertEqual(result, [{"date": "2024-01-01", "total_active_users": 5}])
        mock_get.assert_called_once()
    
    @patch('copilot_api_client.requests.get')
    def test_test_connection_success(self, mock_get):
        """Test la vérification de connexion"""
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        result = self.client.test_connection()
        
        self.assertTrue(result)
    
    @patch('copilot_api_client.requests.get')
    def test_test_connection_failure(self, mock_get):
        """Test l'échec de vérification de connexion"""
        mock_get.side_effect = Exception("Connection failed")
        
        result = self.client.test_connection()
        
        self.assertFalse(result)

class TestCopilotMetricsProcessor(unittest.TestCase):
    """Tests pour le processeur de métriques"""
    
    def setUp(self):
        self.sample_metrics_data = [
            {
                "date": "2024-01-01",
                "total_active_users": 10,
                "total_engaged_users": 8,
                "copilot_ide_code_completions": {
                    "total_engaged_users": 8,
                    "editors": [
                        {
                            "name": "vscode",
                            "models": [
                                {
                                    "name": "default",
                                    "languages": [
                                        {
                                            "name": "python",
                                            "total_engaged_users": 5,
                                            "total_code_suggestions": 100,
                                            "total_code_acceptances": 80,
                                            "total_code_lines_suggested": 200,
                                            "total_code_lines_accepted": 160
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                "copilot_ide_chat": {
                    "editors": [
                        {
                            "name": "vscode",
                            "models": [
                                {
                                    "name": "default",
                                    "total_chats": 20,
                                    "total_chat_insertion_events": 10,
                                    "total_chat_copy_events": 5
                                }
                            ]
                        }
                    ]
                }
            }
        ]
    
    def test_process_metrics_data(self):
        """Test le traitement des données de métriques"""
        daily_stats, global_metrics, language_stats = (
            CopilotMetricsProcessor.process_metrics_data(self.sample_metrics_data)
        )
        
        # Vérification des statistiques quotidiennes
        self.assertEqual(len(daily_stats), 1)
        day_stat = daily_stats[0]
        self.assertEqual(day_stat['day'], '2024-01-01')
        self.assertEqual(day_stat['total_active_users'], 10)
        self.assertEqual(day_stat['total_engaged_users'], 8)
        self.assertEqual(day_stat['total_suggestions'], 100)
        self.assertEqual(day_stat['total_acceptances'], 80)
        self.assertEqual(day_stat['acceptance_rate'], 80.0)
        
        # Vérification des métriques globales
        self.assertEqual(global_metrics['active_days'], 1)
        self.assertEqual(global_metrics['total_suggestions'], 100)
        self.assertEqual(global_metrics['total_acceptances'], 80)
        
        # Vérification des statistiques par langage
        self.assertIn('python', language_stats)
        python_stats = language_stats['python']
        self.assertEqual(python_stats['suggestions'], 100)
        self.assertEqual(python_stats['acceptances'], 80)
        self.assertEqual(python_stats['acceptance_rate'], 80.0)
    
    def test_process_daily_data(self):
        """Test le traitement des données quotidiennes"""
        day_data = self.sample_metrics_data[0]
        result = CopilotMetricsProcessor._process_daily_data(day_data)
        
        self.assertEqual(result['day'], '2024-01-01')
        self.assertEqual(result['total_suggestions'], 100)
        self.assertEqual(result['total_acceptances'], 80)
        self.assertEqual(result['rejected_suggestions'], 20)
        self.assertEqual(result['acceptance_rate'], 80.0)
        self.assertEqual(result['chat_turns'], 20)

class TestCopilotUserManager(unittest.TestCase):
    """Tests pour le gestionnaire d'utilisateurs"""
    
    def setUp(self):
        self.sample_seats_data = {
            "total_seats": 2,
            "seats": [
                {
                    "assignee": {
                        "login": "user1",
                        "name": "User One",
                        "avatar_url": "https://example.com/avatar1.png"
                    },
                    "last_activity_at": "2024-01-01T10:00:00Z",
                    "last_activity_editor": "vscode",
                    "created_at": "2023-01-01T00:00:00Z",
                    "plan_type": "business"
                },
                {
                    "assignee": {
                        "login": "user2",
                        "name": "User Two",
                        "avatar_url": "https://example.com/avatar2.png"
                    },
                    "last_activity_at": None,
                    "last_activity_editor": None,
                    "created_at": "2023-01-01T00:00:00Z",
                    "plan_type": "business"
                }
            ]
        }
        self.sample_metrics_data = []
    
    def test_process_users_data(self):
        """Test le traitement des données utilisateur"""
        users = CopilotUserManager.process_users_data(
            self.sample_seats_data, 
            self.sample_metrics_data
        )
        
        self.assertEqual(len(users), 2)
        
        # Test du premier utilisateur (actif)
        user1 = users[0]
        self.assertEqual(user1['login'], 'user1')
        self.assertEqual(user1['name'], 'User One')
        self.assertIsNotNone(user1['last_activity'])
        self.assertIsInstance(user1['days_since_last_activity'], int)
        
        # Test du deuxième utilisateur (inactif)
        user2 = users[1]
        self.assertEqual(user2['login'], 'user2')
        self.assertIsNone(user2['last_activity'])
        self.assertIsNone(user2['days_since_last_activity'])
        self.assertEqual(user2['activity_status'], 'never_active')
    
    def test_get_activity_status(self):
        """Test la détermination du statut d'activité"""
        self.assertEqual(
            CopilotUserManager._get_activity_status(None), 
            'never_active'
        )
        self.assertEqual(
            CopilotUserManager._get_activity_status(5), 
            'very_active'
        )
        self.assertEqual(
            CopilotUserManager._get_activity_status(15), 
            'active'
        )
        self.assertEqual(
            CopilotUserManager._get_activity_status(60), 
            'inactive'
        )
        self.assertEqual(
            CopilotUserManager._get_activity_status(120), 
            'very_inactive'
        )

if __name__ == '__main__':
    unittest.main()

