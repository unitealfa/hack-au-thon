import { useState, useEffect } from 'react';
import { api, type SatelliteImage } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Satellite, Calendar, Cloud, Image as ImageIcon, Loader2 } from 'lucide-react';

interface SatelliteImageryProps {
  fieldId: number;
  days?: number;
}

type ImageType = 'truecolor' | 'falsecolor' | 'ndvi' | 'evi' | 'ndwi';

const imageTypeLabels: Record<ImageType, { label: string; description: string }> = {
  truecolor: { label: 'True Color', description: 'Natural RGB view' },
  falsecolor: { label: 'False Color', description: 'Infrared composite' },
  ndvi: { label: 'NDVI', description: 'Vegetation health' },
  evi: { label: 'EVI', description: 'Enhanced vegetation' },
  ndwi: { label: 'NDWI', description: 'Water content' }
};

export function SatelliteImagery({ fieldId, days = 30 }: SatelliteImageryProps) {
  const [images, setImages] = useState<SatelliteImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<SatelliteImage | null>(null);
  const [imageType, setImageType] = useState<ImageType>('truecolor');
  const [maxCloudCoverage, setMaxCloudCoverage] = useState(100);

  useEffect(() => {
    async function loadImages() {
      try {
        setLoading(true);
        setError(null);
        const response = await api.getSatelliteImages(fieldId, days);
        
        if (response.success && response.images.length > 0) {
          // Sort by date (newest first)
          const sorted = response.images.sort((a, b) => b.timestamp - a.timestamp);
          setImages(sorted);
          setSelectedImage(sorted[0]); // Select the most recent image
        } else {
          setImages([]);
          setError('No satellite images available for this field.');
        }
      } catch (err: any) {
        console.error('Failed to load satellite images:', err);
        setError(err.message || 'Failed to load satellite images');
      } finally {
        setLoading(false);
      }
    }

    loadImages();
  }, [fieldId, days]);

  const filteredImages = images.filter(img => img.cloudCoverage <= maxCloudCoverage);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading satellite imagery...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Satellite className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (images.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Satellite className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No satellite imagery available for this field.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5" />
            Satellite Imagery
          </CardTitle>
          <CardDescription>
            High-resolution satellite views from Landsat 8 and Sentinel-2
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Type Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Image Type</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(imageTypeLabels) as ImageType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setImageType(type)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    imageType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                  title={imageTypeLabels[type].description}
                >
                  {imageTypeLabels[type].label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {imageTypeLabels[imageType].description}
            </p>
          </div>

          {/* Cloud Coverage Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Max Cloud Coverage: {maxCloudCoverage}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={maxCloudCoverage}
              onChange={(e) => setMaxCloudCoverage(parseInt(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Showing {filteredImages.length} of {images.length} images
            </p>
          </div>

          {/* Main Image Display */}
          {selectedImage && (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden border bg-muted">
                <img
                  src={selectedImage.images[imageType]}
                  alt={`${imageType} satellite view`}
                  className="w-full h-auto"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23f0f0f0" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="%23666" font-size="16">Image not available</text></svg>';
                  }}
                />
              </div>

              {/* Image Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2 p-3 rounded-md bg-secondary">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {new Date(selectedImage.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Date</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-md bg-secondary">
                  <Satellite className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{selectedImage.satellite}</div>
                    <div className="text-xs text-muted-foreground">Satellite</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-md bg-secondary">
                  <Cloud className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{selectedImage.cloudCoverage.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Cloud Cover</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-md bg-secondary">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{selectedImage.dataCoverage}%</div>
                    <div className="text-xs text-muted-foreground">Data Coverage</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Image Timeline */}
          <div>
            <label className="text-sm font-medium mb-2 block">Image History</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {filteredImages.map((img) => (
                <button
                  key={img.timestamp}
                  onClick={() => setSelectedImage(img)}
                  className={`shrink-0 w-24 p-2 rounded-md border-2 transition-all ${
                    selectedImage?.timestamp === img.timestamp
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-secondary hover:border-secondary-foreground/20'
                  }`}
                >
                  <div className="aspect-square rounded overflow-hidden mb-1 bg-muted">
                    <img
                      src={img.images[imageType]}
                      alt={`Thumbnail ${new Date(img.date).toLocaleDateString()}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23ccc" width="100" height="100"/></svg>';
                      }}
                    />
                  </div>
                  <div className="text-xs font-medium text-center">
                    {new Date(img.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    {img.cloudCoverage.toFixed(0)}%
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
