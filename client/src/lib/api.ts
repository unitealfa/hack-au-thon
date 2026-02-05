const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8787')
  .trim()
  .replace(/\/$/, '');

export interface User {
  id: number;
  email: string;
  full_name: string;
  farm_name: string | null;
  created_at: string;
}

export interface Field {
  id: number;
  user_id: number;
  name: string;
  polygon_id: string | null;
  crop_type: string | null;
  location_lat: number | null;
  location_lon: number | null;
  area_size: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sensor {
  id: number;
  field_id: number;
  sensor_type: 'soil_temp_surface' | 'soil_temp_10cm' | 'soil_moisture' | 'soil_ph' | 'air_temp' | 'air_humidity';
  unit: string;
  threshold_min: number;
  threshold_max: number;
  is_active: boolean;
}

export interface Reading {
  id: number;
  sensor_id: number;
  value: number;
  timestamp: string;
  source: string;
  sensor_type: string;
  unit: string;
  threshold_min: number;
  threshold_max: number;
  health: 'healthy' | 'warning' | 'critical';
}

export interface DashboardSensor {
  id: number;
  name: string;
  type: string;
  unit: string;
  thresholds: {
    min: number | null;
    max: number | null;
    optimalMin: number | null;
    optimalMax: number | null;
  };
  currentValue: number | null;
  isHealthy: boolean;
  timestamp: string | null;
  source: string;
}

export interface DashboardData {
  field: {
    id: number;
    name: string;
    cropType: string | null;
    polygonId: string | null;
  };
  sensors: DashboardSensor[];
  summary: {
    totalSensors: number;
    healthySensors: number;
    unhealthySensors: number;
    healthPercentage: number;
    lastUpdate: string | null;
  };
  alerts: {
    id: number;
    sensor_id: number;
    alert_type: string;
    severity: string;
    message: string;
    is_read: boolean;
    created_at: string;
  }[];
}

export interface AgroPolygon {
  id: string;
  name: string;
  center: [number, number];
  area: number; // hectares
  coordinates: [number, number][];
}

// NDVI Types
export interface NDVIDataPoint {
  timestamp: string;
  source: string;
  cloudCoverage: number;
  ndvi: {
    mean: number;
    min: number;
    max: number;
    median: number;
  };
  health: {
    status: 'healthy' | 'moderate' | 'sparse' | 'bare';
    label: string;
    color: string;
  };
}

export interface NDVIData {
  history: NDVIDataPoint[];
  current: NDVIDataPoint | null;
  summary: {
    dataPoints: number;
    averageNDVI: string | null;
    trend: 'improving' | 'stable' | 'declining';
  };
}

// Weather Types
export interface CurrentWeather {
  timestamp: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  clouds: number;
  wind: { speed: number; direction: number };
  weather: { main: string; description: string; icon: string };
  visibility: number;
  uvi: number;
}

export interface ForecastItem {
  timestamp: string;
  temperature: {
    current: number;
    feelsLike: number;
    min: number;
    max: number;
  };
  humidity: number;
  pressure: number;
  clouds: number;
  wind: { speed: number; direction: number };
  weather: { main: string; description: string; icon: string };
  rain: number;
  uvi: number;
}

export interface DailySummary {
  date: string;
  tempMin: string;
  tempMax: string;
  avgHumidity: number;
  totalRain: string;
  conditions: string;
}

export interface WeatherData {
  current: CurrentWeather;
  forecast: ForecastItem[];
  dailySummary: DailySummary[];
}

// GDD Types
export interface GDDInfo {
  startDate: string;
  endDate: string;
  baseTemperature: number;
  accumulatedTemperature: number;
  count: number;
  unit: string;
}

export interface PrecipitationInfo {
  startDate: string;
  endDate: string;
  totalPrecipitation: number;
  count: number;
  unit: string;
}

export interface MaturityEstimate {
  cropType: string;
  requiredGDD: number;
  currentGDD: number;
  progress: number;
  currentStage: string;
  stages: Record<string, number>;
  estimatedDaysToHarvest: number | null;
}

export interface GDDData {
  gdd: GDDInfo;
  precipitation: PrecipitationInfo;
  maturityEstimate: MaturityEstimate;
}

// Satellite Imagery Types
export interface SatelliteImage {
  date: string;
  timestamp: number;
  satellite: string;
  cloudCoverage: number;
  dataCoverage: number;
  images: {
    truecolor: string;
    falsecolor: string;
    ndvi: string;
    evi: string;
    ndwi: string;
  };
  tiles: Record<string, string>;
  stats: Record<string, string>;
}

export interface SatelliteImagesData {
  images: SatelliteImage[];
  count: number;
}

// Combined Analytics
export interface FieldAnalytics {
  ndvi: NDVIDataPoint[] | null;
  currentWeather: CurrentWeather | null;
  forecast: ForecastItem[] | null;
  gdd: GDDInfo | null;
  precipitation: PrecipitationInfo | null;
  errors: {
    ndvi: string | null;
    weather: string | null;
    forecast: string | null;
    gdd: string | null;
    precipitation: string | null;
  };
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async register(email: string, password: string, full_name: string, farm_name?: string) {
    const data = await this.request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, farm_name }),
    });
    this.setToken(data.token);
    return data;
  }

  async getCurrentUser() {
    return this.request<{ user: User }>('/api/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Fields endpoints
  async getFields() {
    const response = await this.request<{ success: boolean; fields: Field[] }>('/api/fields');
    return response.fields;
  }

  async getField(id: number) {
    const response = await this.request<{ success: boolean; field: Field }>(`/api/fields/${id}`);
    return response.field;
  }

  async createField(field: {
    name: string;
    polygonId?: string;
    cropType?: string;
    locationLat?: number;
    locationLon?: number;
    areaSize?: number;
  }) {
    const response = await this.request<{ success: boolean; field: Field; sensorsCreated: number }>('/api/fields', {
      method: 'POST',
      body: JSON.stringify(field),
    });
    return response;
  }

  async updateField(id: number, field: {
    name?: string;
    cropType?: string;
    locationLat?: number;
    locationLon?: number;
    areaSize?: number;
  }) {
    const response = await this.request<{ success: boolean; field: Field }>(`/api/fields/${id}`, {
      method: 'PUT',
      body: JSON.stringify(field),
    });
    return response.field;
  }

  // AgroMonitoring Polygons
  async getAgroPolygons() {
    const response = await this.request<{ success: boolean; polygons: AgroPolygon[] }>('/api/fields/polygons');
    return response.polygons;
  }

  async getAgroPolygon(polygonId: string) {
    const response = await this.request<{ success: boolean; polygon: AgroPolygon }>(`/api/fields/polygons/${polygonId}`);
    return response.polygon;
  }

  // Sensors endpoints
  async getSensorReadings(sensorId: number, hours: number = 168) {
    return this.request<Reading[]>(`/api/sensors/${sensorId}/readings?hours=${hours}`);
  }

  async updateSensorThresholds(sensorId: number, thresholds: { threshold_min: number; threshold_max: number }) {
    return this.request<Sensor>(`/api/sensors/${sensorId}/thresholds`, {
      method: 'PUT',
      body: JSON.stringify(thresholds),
    });
  }

  // Dashboard endpoints
  async getDashboard(fieldId: number) {
    const response = await this.request<{ success: boolean } & DashboardData>(`/api/dashboard/${fieldId}`);
    return response;
  }

  async getDashboardHistory(fieldId: number, days: number = 7) {
    const response = await this.request<{
      success: boolean;
      history: {
        sensor_type: string;
        unit: string;
        readings: { timestamp: string; value: number }[];
      }[];
    }>(`/api/dashboard/${fieldId}/history?days=${days}`);
    return response.history;
  }

  // Analytics endpoints
  async getFieldAnalytics(fieldId: number) {
    return this.request<{
      success: boolean;
      field: { id: number; name: string; polygonId: string };
      analytics: FieldAnalytics;
    }>(`/api/dashboard/${fieldId}/analytics`);
  }

  async getNDVIHistory(fieldId: number, days: number = 30) {
    return this.request<{
      success: boolean;
      field: { id: number; name: string };
      ndvi: NDVIData;
    }>(`/api/dashboard/${fieldId}/ndvi?days=${days}`);
  }

  async getWeatherData(fieldId: number) {
    return this.request<{
      success: boolean;
      field: { id: number; name: string };
      weather: WeatherData;
    }>(`/api/dashboard/${fieldId}/weather`);
  }

  async getGDDData(fieldId: number, days: number = 90, baseTemp: number = 10) {
    return this.request<{
      success: boolean;
      field: { id: number; name: string; cropType: string };
      accumulated: GDDData;
    }>(`/api/dashboard/${fieldId}/gdd?days=${days}&baseTemp=${baseTemp}`);
  }

  async getSatelliteImages(fieldId: number, days: number = 30) {
    return this.request<{
      success: boolean;
      field: { id: number; name: string };
      images: SatelliteImage[];
      count: number;
    }>(`/api/dashboard/${fieldId}/satellite-images?days=${days}`);
  }

  // Agricoole AI endpoints
  async analyzeImage(imageBase64: string) {
    return this.request<{ analysis: string }>('/api/agricoole/analyze', {
      method: 'POST',
      body: JSON.stringify({ image: imageBase64 }),
    });
  }

  async chatAboutPlant(message: string, imageBase64?: string) {
    const body: Record<string, unknown> = {
      user_message: message,
      state: 'CHAT',
      image_present: !!imageBase64,
    };
    if (imageBase64) {
      body.image = { data: imageBase64, mimeType: 'image/jpeg' };
    }
    const result = await this.request<{ ok: boolean; assistant_message?: string; response?: string }>('/api/agricoole/chat', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return { response: result.assistant_message || result.response || '' };
  }
}

export const api = new ApiClient();
