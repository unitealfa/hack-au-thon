import { useEffect, useState } from 'react';
import { api, type Reading } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const sensorLabels: Record<string, string> = {
  soil_temp_surface: 'Soil Temp (Surface)',
  soil_temp_10cm: 'Soil Temp (10cm)',
  soil_moisture: 'Soil Moisture',
  soil_ph: 'Soil pH',
  air_temp: 'Air Temperature',
  air_humidity: 'Air Humidity',
};

interface SensorChartProps {
  sensorId: number;
  sensorType: string;
  unit: string;
  thresholds: {
    min: number;
    max: number;
  };
}

export function SensorChart({ sensorId, sensorType, unit, thresholds }: SensorChartProps) {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReadings();
  }, [sensorId]);

  const loadReadings = async () => {
    try {
      const data = await api.getSensorReadings(sensorId, 168); // 7 days
      setReadings(data);
    } catch (err) {
      console.error('Failed to load readings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-64" />;
  }

  const chartData = readings.map(r => ({
    time: new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: r.value,
  })).reverse();

  const chartConfig = {
    value: {
      label: sensorLabels[sensorType] || sensorType,
      color: 'hsl(var(--chart-1))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {sensorLabels[sensorType] || sensorType}
        </CardTitle>
        <CardDescription>
          Last 7 days ({unit})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="time" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ReferenceLine 
                y={thresholds.min} 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="3 3"
                label={{ value: 'Min', position: 'insideBottomRight', fontSize: 10 }}
              />
              <ReferenceLine 
                y={thresholds.max} 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="3 3"
                label={{ value: 'Max', position: 'insideTopRight', fontSize: 10 }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="var(--color-value)" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
