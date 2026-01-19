// ============================================================================
// Stats Dashboard - Comprehensive statistics visualization
// ============================================================================

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, selectStats, selectBankroll } from '@/store/useGameStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Trophy, Target, BarChart3, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = {
  win: '#22c55e',
  lose: '#ef4444',
  push: '#f59e0b',
  blackjack: '#d4af37',
};

export const StatsDashboard = memo(function StatsDashboard() {
  const stats = useGameStore(selectStats);
  const bankroll = useGameStore(selectBankroll);
  const handHistory = useGameStore(s => s.gameState.handHistory || []);
  
  const winRate = useMemo(() => {
    if (stats.handsPlayed === 0) return 0;
    return (stats.handsWon / stats.handsPlayed) * 100;
  }, [stats.handsWon, stats.handsPlayed]);
  
  const profitLoss = useMemo(() => {
    return stats.totalWon - stats.totalWagered;
  }, [stats.totalWon, stats.totalWagered]);
  
  const bankrollHistory = useMemo(() => {
    // Calculate bankroll progression from hand history
    if (!handHistory || handHistory.length === 0) return [];
    let currentBankroll = 1000; // Starting bankroll
    const history = handHistory.map((hand, index) => {
      currentBankroll += hand.netResult || 0;
      return {
        hand: index + 1,
        bankroll: currentBankroll,
        netResult: hand.netResult || 0,
      };
    });
    return history;
  }, [handHistory]);
  
  const resultsData = useMemo(() => [
    { name: 'Gagnées', value: stats.handsWon, color: COLORS.win },
    { name: 'Perdues', value: stats.handsLost, color: COLORS.lose },
    { name: 'Push', value: stats.handsPushed, color: COLORS.push },
  ], [stats]);
  
  const recentResults = useMemo(() => {
    if (!handHistory || handHistory.length === 0) return [];
    return handHistory.slice(0, 20).map((hand, index) => ({
      hand: index + 1,
      result: (hand.results && hand.results.length > 0) ? hand.results[0]?.result || 'lose' : 'lose',
      payout: hand.totalPayout || 0,
      net: hand.netResult || 0,
    }));
  }, [handHistory]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto space-y-4"
    >
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="charts">Graphiques</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Bankroll Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bankroll</CardTitle>
                <Trophy className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${bankroll.toLocaleString()}</div>
                <p className={cn(
                  "text-xs mt-1",
                  profitLoss >= 0 ? "text-success" : "text-destructive"
                )}>
                  {profitLoss >= 0 ? '+' : ''}${profitLoss.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            
            {/* Win Rate Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de victoire</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.handsWon} / {stats.handsPlayed} mains
                </p>
              </CardContent>
            </Card>
            
            {/* Blackjacks Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Blackjacks</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.blackjacks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.handsPlayed > 0 ? ((stats.blackjacks / stats.handsPlayed) * 100).toFixed(1) : 0}% des mains
                </p>
              </CardContent>
            </Card>
            
            {/* Biggest Win Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Plus gros gain</CardTitle>
                <Trophy className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  ${stats.biggestWin.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Plus grosse perte: ${stats.biggestLoss.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Mains jouées</div>
                <div className="text-2xl font-bold">{stats.handsPlayed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Mains gagnées</div>
                <div className="text-2xl font-bold text-success">{stats.handsWon}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Mains perdues</div>
                <div className="text-2xl font-bold text-destructive">{stats.handsLost}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Push</div>
                <div className="text-2xl font-bold text-warning">{stats.handsPushed}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          {/* Bankroll Evolution */}
          {bankrollHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Évolution du Bankroll</CardTitle>
                <CardDescription>Progression de votre bankroll au fil des mains</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={bankrollHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hand" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                      labelFormatter={(label) => `Main ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="bankroll" 
                      stroke="#d4af37" 
                      strokeWidth={2}
                      name="Bankroll"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          
          {/* Results Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des résultats</CardTitle>
                <CardDescription>Distribution des résultats de vos mains</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={resultsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {resultsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Recent Results Bar Chart */}
            {recentResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Résultats récents</CardTitle>
                  <CardDescription>Dernières 20 mains</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={recentResults}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hand" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => `$${value.toLocaleString()}`}
                      />
                      <Bar dataKey="net" fill="#8884d8">
                        {recentResults.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.net > 0 ? COLORS.win :
                              entry.net < 0 ? COLORS.lose :
                              COLORS.push
                            } 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historique des mains</CardTitle>
              <CardDescription>Dernières mains jouées (max 50)</CardDescription>
            </CardHeader>
            <CardContent>
              {!handHistory || handHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune main jouée pour le moment
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {handHistory.map((hand) => (
                    <motion.div
                      key={hand.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "p-3 rounded-lg border",
                        hand.netResult > 0 ? "bg-success/10 border-success/20" :
                        hand.netResult < 0 ? "bg-destructive/10 border-destructive/20" :
                        "bg-warning/10 border-warning/20"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {new Date(hand.timestamp).toLocaleTimeString()}
                            </span>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded",
                              hand.netResult > 0 ? "bg-success text-success-foreground" :
                              hand.netResult < 0 ? "bg-destructive text-destructive-foreground" :
                              "bg-warning text-warning-foreground"
                            )}>
                              {hand.netResult > 0 ? '+' : ''}${hand.netResult.toFixed(0)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(hand.results?.length || 0)} main{(hand.results?.length || 0) > 1 ? 's' : ''} • 
                            Mise totale: ${(hand.bets?.reduce((a, b) => a + b, 0) || 0).toFixed(0)} • 
                            Payout: ${(hand.totalPayout || 0).toFixed(0)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Statistiques détaillées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total misé</span>
                  <span className="font-semibold">${stats.totalWagered.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total gagné</span>
                  <span className="font-semibold text-success">${stats.totalWon.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Profit/Perte net</span>
                  <span className={cn(
                    "font-semibold",
                    profitLoss >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {profitLoss >= 0 ? '+' : ''}${profitLoss.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Taux de bust</span>
                  <span className="font-semibold">
                    {stats.handsPlayed > 0 
                      ? ((stats.busts / stats.handsPlayed) * 100).toFixed(1) 
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Mise moyenne</span>
                  <span className="font-semibold">
                    ${stats.handsPlayed > 0 
                      ? (stats.totalWagered / stats.handsPlayed).toFixed(0) 
                      : 0}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Résultats par type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Victoires</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-success transition-all"
                        style={{ width: `${winRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-12 text-right">{stats.handsWon}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Défaites</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-destructive transition-all"
                        style={{ 
                          width: `${stats.handsPlayed > 0 ? (stats.handsLost / stats.handsPlayed) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-12 text-right">{stats.handsLost}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Push</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-warning transition-all"
                        style={{ 
                          width: `${stats.handsPlayed > 0 ? (stats.handsPushed / stats.handsPlayed) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-12 text-right">{stats.handsPushed}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Blackjacks</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ 
                          width: `${stats.handsPlayed > 0 ? (stats.blackjacks / stats.handsPlayed) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-12 text-right">{stats.blackjacks}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
});
