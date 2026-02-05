import { useEffect, useState } from 'react';
import { api, type DashboardData, type Field } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FieldAnalytics } from '@/components/FieldAnalytics';
import { 
  Thermometer, 
  Droplets, 
  TestTube, 
  Wind, 
  CloudRain,
  TrendingUp,
  AlertTriangle,
  Activity,
  Clock,
  Gauge,
  Leaf
} from 'lucide-react';

const sensorIcons: Record<string, typeof Thermometer> = {
  soil_temp_surface: Thermometer,
  soil_temp_10cm: Thermometer,
  soil_moisture: Droplets,
  soil_ph: TestTube,
  air_temp: Wind,
  air_humidity: CloudRain,
};

const sensorLabels: Record<string, string> = {
  soil_temp_surface: 'Soil Temp (Surface)',
  soil_temp_10cm: 'Soil Temp (10cm)',
  soil_moisture: 'Soil Moisture',
  soil_ph: 'Soil pH',
  air_temp: 'Air Temperature',
  air_humidity: 'Air Humidity',
};

export function DashboardPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFields();
  }, []);

  useEffect(() => {
    if (selectedFieldId) {
      loadDashboard(selectedFieldId);
    }
  }, [selectedFieldId]);

  const loadFields = async () => {
    try {
      const data = await api.getFields();
      setFields(data);
      if (data.length > 0 && !selectedFieldId) {
        setSelectedFieldId(data[0].id);
      }
      if (data.length === 0) {
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fields');
      setLoading(false);
    }
  };

  const loadDashboard = async (fieldId: number) => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getDashboard(fieldId);
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getHealthBadge = (isHealthy: boolean) => {
    if (isHealthy) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Healthy</Badge>;
    }
    return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Alert</Badge>;
  };

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return 'No data';
    const date = new Date(ts);
    return date.toLocaleString();
  };

  if (loading && !dashboard) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>No Fields Yet</CardTitle>
            <CardDescription>
              Create your first field in the Fields page to start monitoring
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Please wait while we load your dashboard</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const unreadAlerts = dashboard.alerts.filter(a => !a.is_read).length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header with Field Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {dashboard.field.cropType ? `${dashboard.field.cropType} field` : 'Field'} monitoring
          </p>
        </div>
        <div className="flex items-center gap-4">
          {fields.length > 1 && (
            <Select
              value={selectedFieldId?.toString()}
              onValueChange={(v) => setSelectedFieldId(parseInt(v))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field) => (
                  <SelectItem key={field.id} value={field.id.toString()}>
                    {field.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {unreadAlerts > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              {unreadAlerts} Alert{unreadAlerts > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.summary.healthPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {dashboard.summary.healthySensors}/{dashboard.summary.totalSensors} sensors healthy
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sensors</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.summary.totalSensors}</div>
            <p className="text-xs text-muted-foreground">
              {dashboard.summary.unhealthySensors > 0 
                ? `${dashboard.summary.unhealthySensors} need attention`
                : 'All operating normally'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Update</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{formatTimestamp(dashboard.summary.lastUpdate)}</div>
            <p className="text-xs text-muted-foreground">
              {dashboard.field.polygonId ? 'API connected' : 'Simulated data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Sensors and Analytics */}
      <Tabs defaultValue="sensors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sensors" className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Sensors
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            Field Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sensors" className="space-y-6">
          {/* Current Readings */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Current Readings</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dashboard.sensors.map((sensor) => {
                const Icon = sensorIcons[sensor.type] || Thermometer;
                return (
                  <Card key={sensor.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {sensorLabels[sensor.type] || sensor.name}
                      </CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end justify-between">
                        <div>
                          {sensor.currentValue !== null ? (
                            <>
                              <div className="text-2xl font-bold">
                                {sensor.currentValue.toFixed(1)} {sensor.unit}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Optimal: {sensor.thresholds.optimalMin ?? '?'} - {sensor.thresholds.optimalMax ?? '?'} {sensor.unit}
                              </p>
                            </>
                          ) : (
                            <div className="text-lg text-muted-foreground">No data yet</div>
                          )}
                        </div>
                        {sensor.currentValue !== null && getHealthBadge(sensor.isHealthy)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Alerts Section */}
          {dashboard.alerts.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                Recent Alerts
              </h2>
              <div className="space-y-2">
                {dashboard.alerts.map((alert) => (
                  <Card key={alert.id} className={alert.is_read ? 'opacity-60' : ''}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {alert.severity}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <FieldAnalytics 
            fieldId={dashboard.field.id}
            fieldName={dashboard.field.name}
            polygonId={dashboard.field.polygonId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
