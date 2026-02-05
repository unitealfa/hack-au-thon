import { useEffect, useState } from 'react';
import { api, type NDVIData, type WeatherData, type GDDData } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Leaf, 
  Cloud, 
  Sun,
  Droplets,
  Wind,
  Thermometer,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Calendar,
  Sprout,
  CloudRain,
  Snowflake,
  CloudSun
} from 'lucide-react';

interface FieldAnalyticsProps {
  fieldId: number;
  fieldName: string;
  polygonId: string | null;
}

const weatherIcons: Record<string, typeof Sun> = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Drizzle: Droplets,
  Snow: Snowflake,
  Thunderstorm: CloudRain,
  Mist: Cloud,
  Fog: Cloud,
  Haze: CloudSun,
};

const ndviColors: Record<string, string> = {
  healthy: 'bg-green-500',
  moderate: 'bg-yellow-500',
  sparse: 'bg-orange-500',
  bare: 'bg-red-500',
};

export function FieldAnalytics({ fieldId, fieldName: _fieldName, polygonId }: FieldAnalyticsProps) {
  const [ndviData, setNdviData] = useState<NDVIData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [gddData, setGddData] = useState<GDDData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (polygonId) {
      loadAnalytics();
    } else {
      setLoading(false);
    }
  }, [fieldId, polygonId]);

  const loadAnalytics = async () => {
    setLoading(true);
    setErrors({});

    // Load each endpoint separately to capture specific errors
    try {
      const ndviResult = await api.getNDVIHistory(fieldId);
      setNdviData(ndviResult.ndvi);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load NDVI';
      setErrors(e => ({ ...e, ndvi: message }));
    }

    try {
      const weatherResult = await api.getWeatherData(fieldId);
      setWeatherData(weatherResult.weather);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load weather';
      setErrors(e => ({ ...e, weather: message }));
    }

    try {
      const gddResult = await api.getGDDData(fieldId);
      setGddData(gddResult.accumulated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load GDD';
      setErrors(e => ({ ...e, gdd: message }));
    }

    setLoading(false);
  };

  if (!polygonId) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">Analytics Unavailable</CardTitle>
          <CardDescription className="text-yellow-700">
            Link an AgroMonitoring polygon to this field to access NDVI, weather, and growth data.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getWeatherIcon = (condition: string) => {
    const Icon = weatherIcons[condition] || Cloud;
    return <Icon className="h-8 w-8" />;
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Field Analytics</h2>
          <p className="text-muted-foreground">Satellite imagery, weather, and growth tracking</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAnalytics} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* NDVI Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-600" />
              <CardTitle>Vegetation Health (NDVI)</CardTitle>
            </div>
            {ndviData?.current && (
              <Badge className={`${ndviColors[ndviData.current.health.status]} text-white`}>
                {ndviData.current.health.label}
              </Badge>
            )}
          </div>
          <CardDescription>
            Normalized Difference Vegetation Index from satellite imagery
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errors.ndvi ? (
            <p className="text-red-500 text-sm">{errors.ndvi}</p>
          ) : ndviData ? (
            <div className="space-y-4">
              {/* Current NDVI Display */}
              <div className="flex items-center gap-8">
                <div>
                  <div className="text-4xl font-bold text-green-600">
                    {ndviData.current?.ndvi.mean.toFixed(2) || 'N/A'}
                  </div>
                  <p className="text-sm text-muted-foreground">Current NDVI</p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-medium">{ndviData.summary.averageNDVI || 'N/A'}</span>
                    {getTrendIcon(ndviData.summary.trend)}
                  </div>
                  <p className="text-sm text-muted-foreground">30-day Average ({ndviData.summary.trend})</p>
                </div>
                <div>
                  <div className="text-lg font-medium">{ndviData.summary.dataPoints}</div>
                  <p className="text-sm text-muted-foreground">Data Points</p>
                </div>
              </div>

              {/* NDVI Scale */}
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Vegetation Scale</p>
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div className="bg-red-500 flex-1" title="Bare Soil (0-0.2)" />
                  <div className="bg-orange-500 flex-1" title="Sparse (0.2-0.4)" />
                  <div className="bg-yellow-500 flex-1" title="Moderate (0.4-0.6)" />
                  <div className="bg-green-500 flex-1" title="Healthy (0.6-1.0)" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0 (Bare)</span>
                  <span>0.2</span>
                  <span>0.4</span>
                  <span>0.6</span>
                  <span>1.0 (Healthy)</span>
                </div>
              </div>

              {/* Recent NDVI History */}
              {ndviData.history.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Recent Readings</p>
                  <div className="flex gap-1 items-end h-16">
                    {ndviData.history.slice(-20).map((item, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-t ${ndviColors[item.health.status]} opacity-80 hover:opacity-100 transition-opacity`}
                        style={{ height: `${Math.max(10, item.ndvi.mean * 100)}%` }}
                        title={`${new Date(item.timestamp).toLocaleDateString()}: ${item.ndvi.mean.toFixed(3)}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No NDVI data available</p>
          )}
        </CardContent>
      </Card>

      {/* Weather Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Current Weather */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {weatherData?.current && getWeatherIcon(weatherData.current.weather.main)}
              <div>
                <CardTitle>Current Weather</CardTitle>
                <CardDescription>{weatherData?.current?.weather.description || 'Loading...'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {errors.weather ? (
              <p className="text-red-500 text-sm">{errors.weather}</p>
            ) : weatherData?.current ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">{weatherData.current.temperature.toFixed(1)}°C</div>
                    <p className="text-xs text-muted-foreground">Feels like {weatherData.current.feelsLike.toFixed(1)}°C</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{weatherData.current.humidity}%</div>
                    <p className="text-xs text-muted-foreground">Humidity</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="text-lg font-medium">{weatherData.current.wind.speed} m/s</div>
                    <p className="text-xs text-muted-foreground">Wind Speed</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-lg font-medium">{weatherData.current.clouds}%</div>
                    <p className="text-xs text-muted-foreground">Cloud Cover</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No weather data available</p>
            )}
          </CardContent>
        </Card>

        {/* 5-Day Forecast */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <CardTitle>5-Day Forecast</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {errors.weather ? (
              <p className="text-red-500 text-sm">{errors.weather}</p>
            ) : weatherData?.dailySummary && weatherData.dailySummary.length > 0 ? (
              <div className="space-y-2">
                {weatherData.dailySummary.slice(0, 5).map((day, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="w-24">
                      <span className="text-sm font-medium">
                        {i === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs text-muted-foreground truncate">{day.conditions}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{day.tempMax}°</span>
                      <span className="text-muted-foreground">{day.tempMin}°</span>
                      {parseFloat(day.totalRain) > 0 && (
                        <span className="text-blue-500 flex items-center">
                          <Droplets className="h-3 w-3 mr-1" />
                          {day.totalRain}mm
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No forecast data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* GDD / Growth Progress Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-green-600" />
            <CardTitle>Growth Progress (GDD)</CardTitle>
          </div>
          <CardDescription>
            Growing Degree Days - track crop maturity progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errors.gdd ? (
            <p className="text-red-500 text-sm">{errors.gdd}</p>
          ) : gddData ? (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">
                    {gddData.maturityEstimate.currentStage.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {gddData.maturityEstimate.progress}% complete
                  </span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                    style={{ width: `${gddData.maturityEstimate.progress}%` }}
                  />
                </div>
              </div>

              {/* GDD Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{gddData.maturityEstimate.currentGDD}</div>
                  <p className="text-xs text-muted-foreground">Current GDD</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{gddData.maturityEstimate.requiredGDD}</div>
                  <p className="text-xs text-muted-foreground">Required GDD</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-700">{gddData.gdd.baseTemperature}°C</div>
                  <p className="text-xs text-muted-foreground">Base Temperature</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">{gddData.precipitation.totalPrecipitation.toFixed(1)}mm</div>
                  <p className="text-xs text-muted-foreground">Total Precipitation</p>
                </div>
              </div>

              {/* Growth Stages */}
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Growth Stages for {gddData.maturityEstimate.cropType}</p>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {Object.entries(gddData.maturityEstimate.stages).map(([stage, gdd]) => {
                    const isPast = gddData.maturityEstimate.currentGDD >= gdd;
                    const isCurrent = gddData.maturityEstimate.currentStage === stage;
                    return (
                      <div
                        key={stage}
                        className={`flex-shrink-0 px-3 py-2 rounded-lg text-center ${
                          isCurrent 
                            ? 'bg-green-500 text-white' 
                            : isPast 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <div className="text-xs font-medium capitalize">{stage.replace('_', ' ')}</div>
                        <div className="text-xs">{gdd} GDD</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No GDD data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
