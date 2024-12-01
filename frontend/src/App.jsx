import { useState, useEffect, useCallback } from 'react'
import { Container, Box, TextField, Button, Paper, Typography, Grid, CircularProgress, Alert, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Card, CardContent, Avatar, Chip } from '@mui/material'
import { Bar, Line, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

function App() {
  const [token, setToken] = useState(localStorage.getItem('githubToken') || '')
  const [org, setOrg] = useState(localStorage.getItem('githubOrg') || '')
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [users, setUsers] = useState([]);
  const [totalSeats, setTotalSeats] = useState(0);

  const fetchMetrics = async () => {
    if (!token || !org) {
      setError('Token and organization name are required');
      return;
    }
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching metrics with token present:', !!token, 'and org:', org)
      const response = await fetch(`http://localhost:5000/api/metrics?org=${encodeURIComponent(org)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Received metrics:', data)
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setMetrics(data)
      fetchUsers(); // Fetch users after metrics are successfully retrieved
    } catch (err) {
      console.error('Error fetching metrics:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    localStorage.setItem('githubToken', token)
    localStorage.setItem('githubOrg', org)
    fetchMetrics()
  }

  const fetchUsers = async () => {
    try {
        const response = await fetch('/api/users');
        const data = await response.json();
        if (response.ok) {
            setUsers(data.users);
            setTotalSeats(data.total_seats);
        } else {
            console.error('Failed to fetch users:', data.error);
        }
    } catch (error) {
        console.error('Error fetching users:', error);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  )

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          GitHub Copilot Analytics
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="GitHub Token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="Organization Name"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  sx={{ height: '100%' }}
                >
                  Fetch Data
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {metrics && (
          <>
            {/* Billing Information */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Informations de Licence Copilot
              </Typography>
              {metrics.billing?.seat_breakdown ? (
                <>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Total des Sièges
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1 }}>
                          {metrics.billing.seat_breakdown.total || 0}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Sièges Actifs
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1 }}>
                          {metrics.billing.seat_breakdown.active_this_cycle || 0}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Sièges Inactifs
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1 }}>
                          {metrics.billing.seat_breakdown.inactive_this_cycle || 0}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Nouveaux Sièges (ce cycle)
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1 }}>
                          {metrics.billing.seat_breakdown.added_this_cycle || 0}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Invitations en Attente
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1 }}>
                          {metrics.billing.seat_breakdown.pending_invitation || 0}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Annulations en Attente
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1 }}>
                          {metrics.billing.seat_breakdown.pending_cancellation || 0}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Configuration
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Type de Plan
                        </Typography>
                        <Typography variant="body1">
                          {metrics.billing.plan_type === 'business' ? 'Business' : 'Enterprise'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Chat IDE
                        </Typography>
                        <Typography variant="body1">
                          {metrics.billing.ide_chat === 'enabled' ? 'Activé' : 'Désactivé'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Chat Plateforme
                        </Typography>
                        <Typography variant="body1">
                          {metrics.billing.platform_chat === 'enabled' ? 'Activé' : 'Désactivé'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          CLI
                        </Typography>
                        <Typography variant="body1">
                          {metrics.billing.cli === 'enabled' ? 'Activé' : 'Désactivé'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </>
              ) : (
                <Typography color="text.secondary">
                  Aucune donnée de licence disponible
                </Typography>
              )}
            </Paper>

            {/* Global Metrics */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Métriques Globales
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 1 }}>
                    <Typography variant="subtitle2">
                      Total Suggestions
                    </Typography>
                    <Typography variant="h4">
                      {metrics.usage?.global_metrics?.total_suggestions || 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: 'success.light', color: 'white', borderRadius: 1 }}>
                    <Typography variant="subtitle2">
                      Taux d'Acceptation Global
                    </Typography>
                    <Typography variant="h4">
                      {`${metrics.usage?.global_metrics?.average_acceptance_rate?.toFixed(1) || '0.0'}%`}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: 'info.light', color: 'white', borderRadius: 1 }}>
                    <Typography variant="subtitle2">
                      Moyenne par Utilisateur
                    </Typography>
                    <Typography variant="h4">
                      {metrics.usage?.global_metrics?.average_suggestions_per_user || 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: 'warning.light', color: 'white', borderRadius: 1 }}>
                    <Typography variant="subtitle2">
                      Utilisation des Sièges
                    </Typography>
                    <Typography variant="h4">
                      {`${metrics.usage?.global_metrics?.seats_usage_rate?.toFixed(1) || '0.0'}%`}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Usage Analytics */}
            <Grid container spacing={3}>
              {/* Suggestions par jour */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Suggestions par Jour
                  </Typography>
                  {metrics.usage?.users && metrics.usage.users.length > 0 ? (
                    <Bar
                      data={{
                        labels: metrics.usage.users.map(day => day.day),
                        datasets: [
                          {
                            label: 'Suggestions Acceptées',
                            data: metrics.usage.users.map(day => day.accepted_suggestions),
                            backgroundColor: 'rgba(75, 192, 192, 0.6)',
                          },
                          {
                            label: 'Suggestions Rejetées',
                            data: metrics.usage.users.map(day => day.rejected_suggestions),
                            backgroundColor: 'rgba(255, 99, 132, 0.6)',
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        scales: {
                          x: { stacked: true },
                          y: { stacked: true },
                        },
                      }}
                    />
                  ) : (
                    <Typography color="text.secondary">Aucune donnée disponible</Typography>
                  )}
                </Paper>
              </Grid>

              {/* Taux d'acceptation */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Taux d'Acceptation par Jour
                  </Typography>
                  {metrics.usage?.users && metrics.usage.users.length > 0 ? (
                    <Line
                      data={{
                        labels: metrics.usage.users.map(day => day.day),
                        datasets: [
                          {
                            label: 'Taux d\'acceptation (%)',
                            data: metrics.usage.users.map(day => {
                              const total = day.total_suggestions;
                              return total > 0 ? (day.accepted_suggestions / total * 100) : 0;
                            }),
                            borderColor: 'rgba(54, 162, 235, 1)',
                            tension: 0.1,
                          },
                          {
                            label: 'Utilisateurs Actifs',
                            data: metrics.usage.users.map(day => day.active_users),
                            borderColor: 'rgba(255, 159, 64, 1)',
                            tension: 0.1,
                            yAxisID: 'y1',
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                              display: true,
                              text: 'Taux d\'acceptation (%)'
                            }
                          },
                          y1: {
                            beginAtZero: true,
                            position: 'right',
                            title: {
                              display: true,
                              text: 'Utilisateurs Actifs'
                            },
                            grid: {
                              drawOnChartArea: false
                            }
                          }
                        },
                      }}
                    />
                  ) : (
                    <Typography color="text.secondary">Aucune donnée disponible</Typography>
                  )}
                </Paper>
              </Grid>

              {/* Métriques supplémentaires */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Métriques Supplémentaires
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                        <Typography variant="subtitle2">Lignes Suggérées</Typography>
                        <Typography variant="h4">
                          {metrics.usage?.global_metrics?.total_lines_suggested || 0}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                        <Typography variant="subtitle2">Lignes Acceptées</Typography>
                        <Typography variant="h4">
                          {metrics.usage?.global_metrics?.total_lines_accepted || 0}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                        <Typography variant="subtitle2">Jours d'Activité</Typography>
                        <Typography variant="h4">
                          {metrics.usage?.global_metrics?.active_days || 0}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                        <Typography variant="subtitle2">Moyenne Suggestions/Jour</Typography>
                        <Typography variant="h4">
                          {(metrics.usage?.global_metrics?.average_suggestions_per_user || 0).toFixed(1)}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            {/* Language Statistics */}
            <Grid container spacing={3} sx={{ mt: 3 }}>
              {/* Pie Chart des langages */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Distribution par Langage
                  </Typography>
                  {metrics.usage?.language_stats ? (
                    <Pie
                      data={{
                        labels: Object.keys(metrics.usage.language_stats),
                        datasets: [{
                          data: Object.values(metrics.usage.language_stats).map(lang => lang.suggestions),
                          backgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                            '#4BC0C0',
                            '#9966FF',
                            '#FF9F40',
                            '#EA80FC',
                            '#B388FF',
                            '#82B1FF',
                            '#80D8FF'
                          ],
                        }],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'right',
                          },
                          title: {
                            display: true,
                            text: 'Suggestions par Langage'
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${value} (${percentage}%)`;
                              }
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <Typography color="text.secondary">Aucune donnée disponible</Typography>
                  )}
                </Paper>
              </Grid>

              {/* Taux d'acceptation par langage */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Taux d'Acceptation par Langage
                  </Typography>
                  {metrics.usage?.language_stats ? (
                    <Bar
                      data={{
                        labels: Object.keys(metrics.usage.language_stats),
                        datasets: [{
                          label: 'Taux d\'acceptation (%)',
                          data: Object.values(metrics.usage.language_stats).map(lang => 
                            (lang.acceptances / lang.suggestions * 100).toFixed(1)
                          ),
                          backgroundColor: '#4BC0C0',
                          borderColor: '#36A2EB',
                          borderWidth: 1,
                        }],
                      }}
                      options={{
                        responsive: true,
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                              display: true,
                              text: 'Taux d\'acceptation (%)'
                            }
                          }
                        },
                        plugins: {
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                const lang = Object.values(metrics.usage.language_stats)[context.dataIndex];
                                return [
                                  `Taux d'acceptation: ${context.raw}%`,
                                  `Acceptées: ${lang.acceptances}`,
                                  `Total: ${lang.suggestions}`
                                ];
                              }
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <Typography color="text.secondary">Aucune donnée disponible</Typography>
                  )}
                </Paper>
              </Grid>

              {/* Statistiques détaillées par langage */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Statistiques détaillées par Langage
                  </Typography>
                  {metrics.usage?.language_stats ? (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Langage</TableCell>
                            <TableCell align="right">Suggestions</TableCell>
                            <TableCell align="right">Acceptées</TableCell>
                            <TableCell align="right">Taux d'Acceptation</TableCell>
                            <TableCell align="right">Lignes Suggérées</TableCell>
                            <TableCell align="right">Lignes Acceptées</TableCell>
                            <TableCell align="right">Utilisateurs Actifs</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(metrics.usage.language_stats).map(([lang, stats]) => (
                            <TableRow key={lang}>
                              <TableCell component="th" scope="row">
                                {lang}
                              </TableCell>
                              <TableCell align="right">{stats.suggestions}</TableCell>
                              <TableCell align="right">{stats.acceptances}</TableCell>
                              <TableCell align="right">
                                {((stats.acceptances / stats.suggestions) * 100).toFixed(1)}%
                              </TableCell>
                              <TableCell align="right">{stats.lines_suggested}</TableCell>
                              <TableCell align="right">{stats.lines_accepted}</TableCell>
                              <TableCell align="right">{stats.active_users}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography color="text.secondary">Aucune donnée disponible</Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>

            {/* Section Activité des Utilisateurs */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>
                Activité des Utilisateurs
              </Typography>
              {users.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Utilisateur</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Dernière Activité</TableCell>
                        <TableCell>Éditeur</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.login}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar src={user.avatar_url} sx={{ width: 24, height: 24 }} />
                              {user.login}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.is_active ? 'Actif' : 'Inactif'}
                              color={user.is_active ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(user.last_activity).toLocaleString('fr-FR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>{user.last_editor}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">Aucune donnée disponible</Typography>
              )}
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total des sièges : {totalSeats}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Utilisateurs actifs : {users.filter(u => u.is_active).length}
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Container>
  )
}

export default App
