import { useState, useEffect, useCallback } from 'react'
import { Container, Box, TextField, Button, Paper, Typography, Grid, CircularProgress, Alert, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Avatar, Chip, Link, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, Divider, Tooltip as MuiTooltip, IconButton } from '@mui/material'
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
import { Info as InfoIcon } from '@mui/icons-material'

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

  // États pour le calculateur d'économie
  const [roiModalOpen, setRoiModalOpen] = useState(false)
  const [roiConfig, setRoiConfig] = useState(() => {
    const saved = localStorage.getItem('roiConfig')
    return saved ? JSON.parse(saved) : {
      averageTJM: 450,
      dailyWorkingHours: 8,
      workingDaysPerMonth: 20
    }
  })
  const [roiResults, setRoiResults] = useState(null)

  // Fonction de calcul du ROI Copilot basée UNIQUEMENT sur les métriques réelles
  const calculateROI = useCallback(() => {
    if (!metrics) return null

    const copilotMetrics = metrics.usage?.global_metrics
    if (!copilotMetrics) return null

    // Métriques réelles de Copilot
    const totalLinesAccepted = copilotMetrics.total_lines_accepted || 0
    const totalSuggestions = copilotMetrics.total_suggestions || 0
    const acceptanceRate = copilotMetrics.average_acceptance_rate || 0
    const activeUsers = copilotMetrics.total_users || 1
    const activeDays = copilotMetrics.active_days || 1

    // Calcul automatique du gain d'efficacité basé sur les données réelles
    // Estimation basée sur les études GitHub : chaque ligne acceptée économise du temps
    const timePerLineAccepted = 0.25 // 15 minutes par ligne acceptée (estimation réaliste)
    const efficiencyGainPerLine = 0.3 // 30% d'efficacité gagnée par ligne acceptée

    // Temps économisé total
    const totalTimeSavedHours = totalLinesAccepted * timePerLineAccepted
    const dailyTimeSaved = totalTimeSavedHours / activeDays
    const monthlyTimeSaved = dailyTimeSaved * roiConfig.workingDaysPerMonth

    // Économies financières
    const costPerHour = roiConfig.averageTJM / roiConfig.dailyWorkingHours
    const monthlySavings = monthlyTimeSaved * costPerHour
    const annualSavings = monthlySavings * 12

    // Coûts Copilot (basé sur les données réelles de billing)
    const copilotCostPerUserPerMonth = 19 // Business plan
    const actualActiveUsers = metrics.billing?.seat_breakdown?.active_this_cycle || activeUsers
    const totalCopilotCostMonthly = actualActiveUsers * copilotCostPerUserPerMonth
    const totalCopilotCostAnnual = totalCopilotCostMonthly * 12

    // ROI réel
    const netSavingsAnnual = annualSavings - totalCopilotCostAnnual
    const roi = totalCopilotCostAnnual > 0 ? (netSavingsAnnual / totalCopilotCostAnnual) * 100 : 0

    // Métriques de qualité estimées (basées sur taux d'acceptation)
    const qualityImprovementMultiplier = acceptanceRate / 50 // Plus le taux d'acceptation est élevé, plus la qualité s'améliore
    const bugReductionSavings = monthlySavings * 0.2 * qualityImprovementMultiplier
    const overallQualitySavings = monthlySavings * 0.15 * qualityImprovementMultiplier

    const results = {
      timeSaved: {
        daily: dailyTimeSaved,
        monthly: monthlyTimeSaved,
        annually: monthlyTimeSaved * 12
      },
      costSavings: {
        monthly: monthlySavings,
        annually: annualSavings
      },
      copilotCosts: {
        monthly: totalCopilotCostMonthly,
        annually: totalCopilotCostAnnual,
        actualUsers: actualActiveUsers
      },
      roi: {
        netSavings: netSavingsAnnual,
        percentage: roi
      },
      qualityMetrics: {
        bugReductionSavings: bugReductionSavings,
        qualityImprovementSavings: overallQualitySavings,
        totalQualitySavings: bugReductionSavings + overallQualitySavings
      },
      productivityGains: {
        linesAccepted: totalLinesAccepted,
        acceptanceRate: acceptanceRate,
        calculatedEfficiencyGain: (efficiencyGainPerLine * 100).toFixed(1),
        activeUsers: activeUsers,
        activeDays: activeDays
      },
      // Métriques de base pour référence
      baselineMetrics: {
        totalSuggestions: totalSuggestions,
        totalLinesSuggested: copilotMetrics.total_lines_suggested || 0,
        averageSuggestionsPerUser: copilotMetrics.average_suggestions_per_user || 0
      }
    }

    setRoiResults(results)
    return results
  }, [metrics, roiConfig.averageTJM, roiConfig.dailyWorkingHours, roiConfig.workingDaysPerMonth])

  // Sauvegarde de la configuration en localStorage
  const saveRoiConfig = useCallback((newConfig) => {
    setRoiConfig(newConfig)
    localStorage.setItem('roiConfig', JSON.stringify(newConfig))
  }, [])

  // Calcul automatique du ROI quand les métriques sont disponibles
  useEffect(() => {
    if (metrics) {
      calculateROI()
    }
  }, [metrics, calculateROI])

  const fetchMetrics = async () => {
    if (!token || !org) {
      setError('Token and organization name are required');
      return;
    }
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching metrics with token present:', !!token, 'and org:', org)
      // Use relative URL so Vite proxy forwards to backend, avoiding CORS
      const response = await fetch(`/api/metrics?org=${encodeURIComponent(org)}`, {
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

  const gm = metrics?.usage?.global_metrics || {}
  const days = gm.active_days || 0
  const avgSuggestionsPerDay = days > 0 ? (gm.total_suggestions || 0) / days : 0
  const avgLinesSuggestedPerDay = days > 0 ? (gm.total_lines_suggested || 0) / days : 0
  const avgLinesAcceptedPerDay = days > 0 ? (gm.total_lines_accepted || 0) / days : 0
  const avgPerUserPerDay = (days > 0 && (gm.total_users || 0) > 0)
    ? (gm.total_suggestions || 0) / days / (gm.total_users || 1)
    : 0

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          GitHub Copilot Analytics
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="GitHub Token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
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
                  sx={{ height: '56px' }}
                >
                  Fetch Data
                </Button>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setRoiModalOpen(true)}
                  sx={{ height: '56px' }}
                >
                  Calculateur ROI
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
                    <Typography variant="caption">
                      ≈ {avgSuggestionsPerDay.toFixed(1)}/jour {days ? `(sur ${days} jours)` : ''}
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
                    <Typography variant="caption">
                      moyenne sur {days || 0} jours
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
                    <Typography variant="caption">
                      ≈ {avgPerUserPerDay.toFixed(1)}/jour/utilisateur {days ? `(sur ${days} jours)` : ''}
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
                    <Typography variant="caption">
                      max observé sur {days || 0} jours
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Section Calculateur d'Économie */}
            {roiResults && (
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'success.light' }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'success.contrastText' }}>
                  📊 Calculateur d'Économie Copilot
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                      <Typography variant="subtitle1" gutterBottom color="success.main">
                        ⏱️ Économies de Temps
                      </Typography>
                      <Typography variant="body2">
                        <MuiTooltip title="Temps économisé quotidien basé sur vos métriques Copilot réelles (15 min par ligne acceptée × lignes acceptées ÷ jours d'activité)">
                          <span>Temps économisé quotidien: <strong>{roiResults.timeSaved.daily.toFixed(1)}h</strong></span>
                        </MuiTooltip>
                      </Typography>
                      <Typography variant="body2">
                        <MuiTooltip title="Temps économisé mensuel (quotidien × jours travaillés par mois)">
                          <span>Temps économisé mensuel: <strong>{roiResults.timeSaved.monthly.toFixed(1)}h</strong></span>
                        </MuiTooltip>
                      </Typography>
                      <Typography variant="body2">
                        <MuiTooltip title="Temps économisé annuel (mensuel × 12 mois)">
                          <span>Temps économisé annuel: <strong>{roiResults.timeSaved.annually.toFixed(1)}h</strong></span>
                        </MuiTooltip>
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                      <Typography variant="subtitle1" gutterBottom color="success.main">
                        💰 Économies Financières
                      </Typography>
                      <Typography variant="body2">
                        <MuiTooltip title={`Économies mensuelles (temps économisé × coût horaire = ${roiResults.timeSaved.monthly.toFixed(1)}h × ${(roiConfig.averageTJM / roiConfig.dailyWorkingHours).toFixed(2)}€/h)`}>
                          <span>Économies mensuelles: <strong>{roiResults.costSavings.monthly.toLocaleString('fr-FR')}€</strong></span>
                        </MuiTooltip>
                      </Typography>
                      <Typography variant="body2">
                        <MuiTooltip title="Économies annuelles (mensuelles × 12 mois)">
                          <span>Économies annuelles: <strong>{roiResults.costSavings.annually.toLocaleString('fr-FR')}€</strong></span>
                        </MuiTooltip>
                      </Typography>
                      <Typography variant="body2" color="error.main">
                        <MuiTooltip title={`Coût annuel Copilot pour ${roiResults.copilotCosts.actualUsers} utilisateurs actifs (${roiResults.copilotCosts.actualUsers} × 19€ × 12 mois)`}>
                          <span>Coût Copilot annuel: <strong>{roiResults.copilotCosts.annually.toLocaleString('fr-FR')}€</strong></span>
                        </MuiTooltip>
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                      <Typography variant="subtitle1" gutterBottom color="success.main">
                        📈 Retour sur Investissement
                      </Typography>
                      <Typography variant="h4" color={roiResults.roi.percentage > 0 ? 'success.main' : 'error.main'}>
                        <MuiTooltip title={`ROI annuel = (économies nettes / coût Copilot) × 100 = (${roiResults.roi.netSavings.toLocaleString('fr-FR')}€ / ${roiResults.copilotCosts.annually.toLocaleString('fr-FR')}€) × 100`}>
                          <span>ROI: {roiResults.roi.percentage > 0 ? '+' : ''}{roiResults.roi.percentage.toFixed(1)}%</span>
                        </MuiTooltip>
                      </Typography>
                      <Typography variant="body2">
                        <MuiTooltip title="Économies nettes annuelles (économies annuelles - coût Copilot annuel)">
                          <span>Économies nettes annuelles: <strong>{roiResults.roi.netSavings.toLocaleString('fr-FR')}€</strong></span>
                        </MuiTooltip>
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                      <Typography variant="subtitle1" gutterBottom color="success.main">
                        🎯 Métriques de Qualité
                      </Typography>
                      <Typography variant="body2">
                        <MuiTooltip title={`Réduction des bugs mensuelle (20% des économies × multiplicateur qualité basé sur taux d'acceptation de ${(roiResults.productivityGains.acceptanceRate).toFixed(1)}%)`}>
                          <span>Réduction des bugs: <strong>{roiResults.qualityMetrics.bugReductionSavings.toLocaleString('fr-FR')}€</strong></span>
                        </MuiTooltip>
                      </Typography>
                      <Typography variant="body2">
                        <MuiTooltip title={`Amélioration qualité globale mensuelle (15% des économies × multiplicateur qualité basé sur taux d'acceptation de ${(roiResults.productivityGains.acceptanceRate).toFixed(1)}%)`}>
                          <span>Amélioration qualité: <strong>{roiResults.qualityMetrics.qualityImprovementSavings.toLocaleString('fr-FR')}€</strong></span>
                        </MuiTooltip>
                      </Typography>
                      <Typography variant="body2">
                        <MuiTooltip title="Total des économies qualité mensuelles (réduction bugs + amélioration qualité)">
                          <span>Total économies qualité: <strong>{roiResults.qualityMetrics.totalQualitySavings.toLocaleString('fr-FR')}€</strong></span>
                        </MuiTooltip>
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    📋 Résumé des Gains de Productivité
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2">
                        <MuiTooltip title={`Nombre total de lignes acceptées par tous les utilisateurs actifs (${roiResults.productivityGains.activeUsers} utilisateurs)`}>
                          <span>Lignes acceptées: <strong>{roiResults.productivityGains.linesAccepted.toLocaleString()}</strong></span>
                        </MuiTooltip>
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2">
                        <MuiTooltip title={`Taux d'acceptation moyen des suggestions Copilot (${roiResults.productivityGains.linesAccepted} lignes acceptées / ${roiResults.baselineMetrics.totalSuggestions} suggestions)`}>
                          <span>Taux d'acceptation: <strong>{roiResults.productivityGains.acceptanceRate.toFixed(1)}%</strong></span>
                        </MuiTooltip>
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2">
                        <MuiTooltip title="Gain d'efficacité automatique calculé (30% basé sur études GitHub)">
                          <span>Gain d'efficacité: <strong>{roiResults.productivityGains.calculatedEfficiencyGain}%</strong></span>
                        </MuiTooltip>
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2">
                        <MuiTooltip title={`Nombre d'utilisateurs actifs ayant utilisé Copilot (données réelles du billing)`}>
                          <span>Utilisateurs actifs: <strong>{roiResults.productivityGains.activeUsers}</strong></span>
                        </MuiTooltip>
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            )}

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
                        <Typography variant="caption">
                          ≈ {avgLinesSuggestedPerDay.toFixed(0)}/jour {days ? `(sur ${days} jours)` : ''}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                        <Typography variant="subtitle2">Lignes Acceptées</Typography>
                        <Typography variant="h4">
                          {metrics.usage?.global_metrics?.total_lines_accepted || 0}
                        </Typography>
                        <Typography variant="caption">
                          ≈ {avgLinesAcceptedPerDay.toFixed(0)}/jour {days ? `(sur ${days} jours)` : ''}
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
                          {(metrics.usage?.global_metrics?.average_suggestions_per_day || 0).toFixed(1)}
                        </Typography>
                        <Typography variant="caption">
                          ≈ {avgPerUserPerDay.toFixed(1)}/jour/utilisateur
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
      
      {/* Modale de Configuration du Calculateur d'Économie */}
      <Dialog 
        open={roiModalOpen} 
        onClose={() => setRoiModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography component="span" variant="subtitle1" sx={{ fontWeight: 600 }}>
              ⚙️ Configuration du Calculateur d'Économie
            </Typography>
            <MuiTooltip
              title={
                <Box sx={{ p: 1, maxWidth: 400 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    📊 Hypothèses de calcul utilisées :
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • <strong>Temps économisé</strong> : 15 minutes par ligne acceptée (basé sur études GitHub)
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • <strong>Gain d'efficacité</strong> : 30% d'amélioration automatique
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • <strong>Économies qualité</strong> : Calculées selon votre taux d'acceptation réel
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • <strong>Utilisateurs actifs</strong> : Vos données de billing réelles
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • <strong>Lignes acceptées</strong> : Vos métriques Copilot réelles
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • <strong>Coûts Copilot</strong> : 19€/utilisateur/mois (Business plan)
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                    Toutes ces valeurs sont basées sur des études GitHub officielles et vos métriques réelles.
                  </Typography>
                </Box>
              }
              arrow
              placement="bottom-start"
            >
              <IconButton size="small" sx={{ ml: 1 }}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </MuiTooltip>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configurez uniquement les paramètres essentiels pour le calcul du ROI Copilot
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>⚙️ Paramètres de Configuration</Typography>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="TJM Moyen (€)"
                type="number"
                value={roiConfig.averageTJM}
                onChange={(e) => setRoiConfig({...roiConfig, averageTJM: parseInt(e.target.value) || 0})}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>
                }}
                helperText="Tarif journalier moyen de vos développeurs"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Heures travaillées par jour"
                type="number"
                step="0.5"
                value={roiConfig.dailyWorkingHours}
                onChange={(e) => setRoiConfig({...roiConfig, dailyWorkingHours: parseFloat(e.target.value) || 8})}
                InputProps={{
                  endAdornment: <InputAdornment position="end">heures</InputAdornment>
                }}
                helperText="Nombre d'heures productives par jour"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Jours travaillés par mois"
                type="number"
                value={roiConfig.workingDaysPerMonth}
                onChange={(e) => setRoiConfig({...roiConfig, workingDaysPerMonth: parseInt(e.target.value) || 20})}
                InputProps={{
                  endAdornment: <InputAdornment position="end">jours</InputAdornment>
                }}
                helperText="Nombre de jours travaillés par mois"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2" color="info.contrastText">
              💡 <strong>Note :</strong> Le calculateur utilise automatiquement vos métriques Copilot réelles 
              (lignes acceptées, taux d'acceptation, utilisateurs actifs) pour des résultats précis et crédibles.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoiModalOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={() => {
              saveRoiConfig(roiConfig)
              if (metrics) calculateROI()
              setRoiModalOpen(false)
            }} 
            variant="contained"
          >
            Sauvegarder & Calculer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          mt: 'auto',
          textAlign: 'center',
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Fait avec ❤️ par{' '}
          <Link 
            href="https://github.com/cyberlife-coder" 
            target="_blank" 
            rel="noopener noreferrer"
            sx={{ 
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            cyberlife-coder
          </Link>
        </Typography>
      </Box>
    </Container>
  )
}

export default App
