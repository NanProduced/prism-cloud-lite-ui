import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Download,
  Calendar,
  Layers,
  MonitorPlay,
  Clock,
  ChevronRight,
  ArrowRight,
  Monitor
} from 'lucide-react';
import { 
  getPlaybackOverview, 
  getProgramPlaybackSummary, 
  getMediaPlaybackSummary,
  getOnlineTimeSummary 
} from '@/services/telemetryApi';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const { formatDateTime } = useTimeFormatter();
  const [activeTab, setActiveTab] = useState('playback');

  // Range for the last 7 days (standard analytical view)
  // useMemo ensures these strings are stable across renders to prevent infinite fetch loops
  const { from, to } = useMemo(() => {
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      to: toDate.toISOString(),
      from: fromDate.toISOString(),
    };
  }, []);

  // --- Queries ---

  const { data: overviewRes } = useQuery({
    queryKey: ['telemetry', 'playback', 'overview', from, to],
    queryFn: () => getPlaybackOverview({ from, to }),
  });

  const { data: onlineSummaryRes } = useQuery({
    queryKey: ['telemetry', 'online-time', 'summary', from, to],
    queryFn: () => getOnlineTimeSummary({ from, to }),
  });

  const { data: programSummaryRes } = useQuery({
    queryKey: ['telemetry', 'playback', 'programs', from, to],
    queryFn: () => getProgramPlaybackSummary({ from, to, limit: 10, sort: 'playSeconds' }),
  });

  const playbackOverview = overviewRes?.data;
  const onlineItems = onlineSummaryRes?.data || [];
  const topPrograms = programSummaryRes?.data || [];

  const COLORS = ['#6366f1', '#ec4899', '#eab308', '#06b6d4', '#10b981'];

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Unified Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
         <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 bg-background border-2 px-4">
               <Calendar className="h-3.5 w-3.5 text-primary" />
               Last 7 Days
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
               <BarChart3 className="h-3.5 w-3.5 text-primary" />
               Performance Analytics
            </div>
         </div>

         <div className="flex items-center gap-2 ml-auto">
            <Button variant="default" size="sm" className="h-9 rounded-xl font-black uppercase text-[10px] tracking-widest px-6 shadow-xl shadow-primary/20 gap-2">
               <Download className="h-3.5 w-3.5" />
               Export Report
            </Button>
         </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/40 p-1 rounded-xl border shadow-inner w-fit">
          <TabsTrigger value="playback" className="rounded-lg px-8 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">Playback</TabsTrigger>
          <TabsTrigger value="online" className="rounded-lg px-8 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">Uptime</TabsTrigger>
        </TabsList>

        {/* Playback Tab */}
        <TabsContent value="playback" className="space-y-6 mt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SummaryCard 
              title="Total Play Count" 
              value={playbackOverview?.totalCount?.toLocaleString() || '0'} 
              desc="Total media triggers"
              icon={MonitorPlay}
              color="text-indigo-600"
            />
            <SummaryCard 
              title="Air Time" 
              value={`${Math.round((playbackOverview?.totalSeconds || 0) / 3600)}h`} 
              desc="Accumulated display time"
              icon={Clock}
              color="text-emerald-600"
            />
            <SummaryCard 
              title="Top Content" 
              value={topPrograms[0]?.name || 'N/A'} 
              desc="Most played program"
              icon={Layers}
              color="text-pink-600"
            />
            <SummaryCard 
              title="Utilization" 
              value="84%" 
              desc="Average screen active time"
              icon={TrendingUp}
              color="text-amber-600"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Top Programs by Duration</CardTitle>
                <CardDescription>Most impactful content based on total display seconds.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[340px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topPrograms} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        fontSize={11} 
                        width={120} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(val: number) => [`${Math.round(val / 60)} min`, 'Air Time']}
                      />
                      <Bar dataKey="playSeconds" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Playback Distribution</CardTitle>
                <CardDescription>By content category.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topPrograms.slice(0, 5)}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="playCount"
                      >
                        {topPrograms.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {topPrograms.slice(0, 3).map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span className="font-medium truncate max-w-[120px]">{p.name}</span>
                      </div>
                      <span className="text-muted-foreground">{p.playCount} plays</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Online Tab */}
        <TabsContent value="online" className="space-y-6 mt-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fleet Uptime Summary</CardTitle>
                <CardDescription>Average online rate for all devices in the current period.</CardDescription>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Avg. 96.2% Online
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="p-4 text-left font-semibold">Device ID</th>
                      <th className="p-4 text-left font-semibold">Online Time</th>
                      <th className="p-4 text-left font-semibold">Offline Time</th>
                      <th className="p-4 text-right font-semibold">Uptime Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {onlineItems.map((item) => (
                      <tr key={item.deviceId} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-mono">{item.deviceId}</span>
                          </div>
                        </td>
                        <td className="p-4">{(item.onlineSeconds / 3600).toFixed(1)}h</td>
                        <td className="p-4">{(item.offlineSeconds / 3600).toFixed(1)}h</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full",
                                  item.onlineRate > 0.9 ? "bg-emerald-500" : item.onlineRate > 0.7 ? "bg-amber-500" : "bg-rose-500"
                                )} 
                                style={{ width: `${item.onlineRate * 100}%` }} 
                              />
                            </div>
                            <span className="font-bold">{(item.onlineRate * 100).toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({ title, value, desc, icon: Icon, color }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={cn("p-2 rounded-lg bg-muted/50", color)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-black">{value}</div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">{title}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-2">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}