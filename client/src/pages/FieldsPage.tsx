import { useState, useEffect } from 'react';
import { api, type Field, type AgroPolygon } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, MapPin, Edit, Save, X, Wheat, Leaf, Sprout, Download, RefreshCw } from 'lucide-react';

// Crop types with icons and labels
const CROP_TYPES = [
  { value: 'wheat', label: 'Wheat', icon: Wheat },
  { value: 'corn', label: 'Corn', icon: Sprout },
  { value: 'tomato', label: 'Tomato', icon: Leaf },
  { value: 'potato', label: 'Potato', icon: Sprout },
  { value: 'rice', label: 'Rice', icon: Wheat },
  { value: 'soybean', label: 'Soybean', icon: Leaf },
  { value: 'lettuce', label: 'Lettuce', icon: Leaf },
  { value: 'carrot', label: 'Carrot', icon: Sprout },
  { value: 'grape', label: 'Grape', icon: Leaf },
  { value: 'cotton', label: 'Cotton', icon: Sprout },
  { value: 'other', label: 'Other', icon: Leaf },
];

interface FormData {
  name: string;
  polygonId: string;
  cropType: string;
  locationLat: string;
  locationLon: string;
  areaSize: string;
}

const initialFormData: FormData = {
  name: '',
  polygonId: '',
  cropType: '',
  locationLat: '',
  locationLon: '',
  areaSize: '',
};

export function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  
  // Polygon picker state
  const [polygons, setPolygons] = useState<AgroPolygon[]>([]);
  const [polygonsLoading, setPolygonsLoading] = useState(false);
  const [polygonsError, setPolygonsError] = useState('');
  const [polygonDialogOpen, setPolygonDialogOpen] = useState(false);

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getFields();
      setFields(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fields');
    } finally {
      setLoading(false);
    }
  };

  const loadPolygons = async () => {
    try {
      setPolygonsLoading(true);
      setPolygonsError('');
      const data = await api.getAgroPolygons();
      setPolygons(data);
    } catch (err) {
      setPolygonsError(err instanceof Error ? err.message : 'Failed to load polygons');
    } finally {
      setPolygonsLoading(false);
    }
  };

  const handleSelectPolygon = (polygon: AgroPolygon) => {
    setFormData({
      ...formData,
      polygonId: polygon.id,
      name: formData.name || polygon.name,
      locationLat: polygon.center?.[1]?.toString() || '',
      locationLon: polygon.center?.[0]?.toString() || '',
      areaSize: polygon.area?.toString() || '',
    });
    setPolygonDialogOpen(false);
    setSuccess(`Polygon "${polygon.name}" selected - coordinates and area filled automatically!`);
  };

  const handleCreate = () => {
    setIsEditing(true);
    setEditingField(null);
    setFormData(initialFormData);
    setError('');
    setSuccess('');
  };

  const handleEdit = (field: Field) => {
    setIsEditing(true);
    setEditingField(field);
    setFormData({
      name: field.name,
      polygonId: field.polygon_id || '',
      cropType: field.crop_type || '',
      locationLat: field.location_lat?.toString() || '',
      locationLon: field.location_lon?.toString() || '',
      areaSize: field.area_size?.toString() || '',
    });
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingField(null);
    setFormData(initialFormData);
  };

  const handleSave = async () => {
    try {
      setError('');
      setSuccess('');
      setSaving(true);

      const payload = {
        name: formData.name,
        polygonId: formData.polygonId || undefined,
        cropType: formData.cropType || undefined,
        locationLat: formData.locationLat ? parseFloat(formData.locationLat) : undefined,
        locationLon: formData.locationLon ? parseFloat(formData.locationLon) : undefined,
        areaSize: formData.areaSize ? parseFloat(formData.areaSize) : undefined,
      };

      if (editingField) {
        await api.updateField(editingField.id, payload);
        setSuccess('Field updated successfully!');
      } else {
        const result = await api.createField(payload);
        setSuccess(`Field created with ${result.sensorsCreated} sensors configured!`);
      }

      await loadFields();
      handleCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save field');
    } finally {
      setSaving(false);
    }
  };

  const getCropIcon = (cropType: string | null) => {
    const crop = CROP_TYPES.find(c => c.value === cropType);
    if (crop) {
      const Icon = crop.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <Leaf className="h-4 w-4" />;
  };

  const formatCoordinates = (lat: number | null, lon: number | null) => {
    if (lat === null || lon === null) return null;
    return `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
  };

  if (loading && fields.length === 0) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fields</h1>
          <p className="text-muted-foreground">Manage your farm fields and sensor configurations</p>
        </div>
        {!isEditing && (
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Field
          </Button>
        )}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-700 text-base">Error</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-700 text-base">Success</CardTitle>
            <CardDescription className="text-green-600">{success}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>{editingField ? 'Edit Field' : 'New Field'}</CardTitle>
            <CardDescription>
              {editingField 
                ? 'Update field information' 
                : 'Add a new field - sensors will be auto-configured with optimal thresholds based on crop type'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Field Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., North Field, Corn Field A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cropType">Crop Type</Label>
                <Select
                  value={formData.cropType}
                  onValueChange={(value) => setFormData({ ...formData, cropType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a crop type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CROP_TYPES.map((crop) => (
                      <SelectItem key={crop.value} value={crop.value}>
                        <div className="flex items-center gap-2">
                          <crop.icon className="h-4 w-4" />
                          {crop.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Sensor thresholds will be optimized for this crop
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Location Coordinates</Label>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="locationLat" className="text-xs text-muted-foreground">Latitude</Label>
                  <Input
                    id="locationLat"
                    type="number"
                    step="0.0001"
                    placeholder="e.g., 48.8566"
                    value={formData.locationLat}
                    onChange={(e) => setFormData({ ...formData, locationLat: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locationLon" className="text-xs text-muted-foreground">Longitude</Label>
                  <Input
                    id="locationLon"
                    type="number"
                    step="0.0001"
                    placeholder="e.g., 2.3522"
                    value={formData.locationLon}
                    onChange={(e) => setFormData({ ...formData, locationLon: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Area */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="areaSize">Area Size (hectares)</Label>
                <Input
                  id="areaSize"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 5.5"
                  value={formData.areaSize}
                  onChange={(e) => setFormData({ ...formData, areaSize: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="polygonId">AgroMonitoring Polygon ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="polygonId"
                    placeholder="e.g., 6983e1db1be1fb0008fa39a2"
                    value={formData.polygonId}
                    onChange={(e) => setFormData({ ...formData, polygonId: e.target.value })}
                    className="flex-1"
                  />
                  <Dialog open={polygonDialogOpen} onOpenChange={setPolygonDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setPolygonDialogOpen(true);
                          loadPolygons();
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Import
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Import Polygon from AgroMonitoring</DialogTitle>
                        <DialogDescription>
                          Select a polygon from your AgroMonitoring account. This will auto-fill coordinates and area.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            {polygons.length} polygon(s) found
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={loadPolygons}
                            disabled={polygonsLoading}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${polygonsLoading ? 'animate-spin' : ''}`} />
                            Refresh
                          </Button>
                        </div>
                        
                        {polygonsError && (
                          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                            {polygonsError}
                          </div>
                        )}
                        
                        {polygonsLoading ? (
                          <div className="space-y-2">
                            <Skeleton className="h-16" />
                            <Skeleton className="h-16" />
                            <Skeleton className="h-16" />
                          </div>
                        ) : polygons.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No polygons found in your AgroMonitoring account.</p>
                            <p className="text-sm mt-2">
                              Create a polygon at{' '}
                              <a 
                                href="https://agromonitoring.com/create-polygon" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                agromonitoring.com
                              </a>
                            </p>
                          </div>
                        ) : (
                          <div className="max-h-80 overflow-y-auto space-y-2">
                            {polygons.map((polygon) => (
                              <Card 
                                key={polygon.id} 
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleSelectPolygon(polygon)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-medium">{polygon.name}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        ID: {polygon.id}
                                      </p>
                                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                        {polygon.area && (
                                          <span>📐 {polygon.area.toFixed(2)} ha</span>
                                        )}
                                        {polygon.center && (
                                          <span>📍 {polygon.center[1]?.toFixed(4)}°, {polygon.center[0]?.toFixed(4)}°</span>
                                        )}
                                      </div>
                                    </div>
                                    <Button size="sm" variant="secondary">
                                      Select
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for real soil data. Create polygons at{' '}
                  <a
                    href="https://agromonitoring.com/create-polygon"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    AgroMonitoring
                  </a>
                </p>
              </div>
            </div>

            {/* Info box */}
            {!editingField && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <h4 className="font-medium text-blue-900 mb-1">Automatic Sensor Configuration</h4>
                <p className="text-sm text-blue-700">
                  When you create a field, 6 sensors will be automatically configured with scientifically-backed 
                  thresholds from FAO and USDA guidelines:
                </p>
                <ul className="text-sm text-blue-700 mt-2 list-disc list-inside">
                  <li>Soil Temperature (Surface & 10cm depth)</li>
                  <li>Soil Moisture & pH</li>
                  <li>Air Temperature & Humidity</li>
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                onClick={handleSave} 
                disabled={!formData.name || saving} 
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={handleCancel} variant="outline" className="gap-2" disabled={saving}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Fields</CardTitle>
          <CardDescription>
            {fields.length} field{fields.length !== 1 ? 's' : ''} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No fields yet</h3>
              <p className="text-muted-foreground mb-4">Add your first field to start monitoring</p>
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Field
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Crop</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>API Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">{field.name}</TableCell>
                    <TableCell>
                      {field.crop_type ? (
                        <div className="flex items-center gap-2">
                          {getCropIcon(field.crop_type)}
                          <span className="capitalize">{field.crop_type}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatCoordinates(field.location_lat, field.location_lon) ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{formatCoordinates(field.location_lat, field.location_lon)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {field.area_size ? (
                        <span>{field.area_size} ha</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {field.polygon_id ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          No API
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleEdit(field)}
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
