import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Upload, MessageSquare, Loader2, Sparkles } from 'lucide-react';

export function PlantAnalysisPage() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImage(base64);
      setAnalysis('');
      setChatMessages([]);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!image) return;

    try {
      setLoading(true);
      const base64 = image.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      const result = await api.analyzeImage(base64);
      setAnalysis(result.analysis);
    } catch (err) {
      setAnalysis('Error: ' + (err instanceof Error ? err.message : 'Analysis failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages([...chatMessages, { role: 'user', content: userMessage }]);

    try {
      setChatLoading(true);
      const base64 = image ? image.split(',')[1] : undefined;
      const result = await api.chatAboutPlant(userMessage, base64);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: result.response }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error: ' + (err instanceof Error ? err.message : 'Chat failed'),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-green-600" />
          AI Plant Analysis
        </h1>
        <p className="text-muted-foreground">
          Upload a plant photo to identify issues, get care tips, and ask questions
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Image Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Plant Photo
            </CardTitle>
            <CardDescription>Upload or capture a photo of your plant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              {image ? (
                <div className="space-y-4">
                  <img
                    src={image}
                    alt="Plant"
                    className="max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Change Photo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Take a clear photo of your plant
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Photo
                    </Button>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {image && (
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full gap-2"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze Plant
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>AI-powered plant health assessment</CardDescription>
          </CardHeader>
          <CardContent>
            {analysis ? (
              <div className="prose prose-sm max-w-none">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap text-sm">{analysis}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Upload a photo and click "Analyze Plant" to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Ask About Your Plant
          </CardTitle>
          <CardDescription>Chat with AI to learn more about plant care</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chat Messages */}
          <div className="border rounded-lg p-4 h-64 overflow-y-auto space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Ask questions about plant care, watering, soil, etc.</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Ask a question about your plant..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleChat()}
              disabled={chatLoading}
            />
            <Button onClick={handleChat} disabled={chatLoading || !chatInput.trim()}>
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
