import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: 'admin@company.com',
    password: 'changeMe123!',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setDebugInfo('Attempting login...');
    
    try {
      await login(formData.email, formData.password);
      setDebugInfo('Login successful!');
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Extract error message from the response
      let errorMessage = "Login failed";
      let debugMessage = '';
      
      if (error?.message) {
        errorMessage = error.message;
        debugMessage = `Error: ${error.message}`;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
        debugMessage = `API Error: ${error.response.data.message}`;
      } else if (typeof error === 'string') {
        errorMessage = error;
        debugMessage = `String Error: ${error}`;
      } else if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        errorMessage = "Cannot connect to server. Please check if the backend is running.";
        debugMessage = "Network Error: Failed to fetch - backend may not be running";
      } else {
        debugMessage = `Unknown Error: ${JSON.stringify(error)}`;
      }
      
      setDebugInfo(debugMessage);
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const testConnection = async () => {
    setDebugInfo('Testing connection...');
    try {
      // Try to make a simple request to test connectivity
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test', password: 'test' }),
      });
      
      if (response.ok || response.status === 400 || response.status === 401) {
        setDebugInfo('✅ Backend is reachable');
      } else {
        setDebugInfo(`❌ Backend returned status: ${response.status}`);
      }
    } catch (error: any) {
      setDebugInfo(`❌ Connection failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Payment Order System</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Default Login Credentials:</strong><br />
                Email: admin@company.com<br />
                Password: changeMe123!
              </p>
              <p className="text-xs text-blue-700 mt-2">
                The form is pre-filled with default credentials for easy testing.
              </p>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-700">Debug Information:</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={testConnection}
                  className="text-xs h-6"
                >
                  Test Connection
                </Button>
              </div>
              {debugInfo && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600 break-all">{debugInfo}</p>
                </div>
              )}
              {!debugInfo && (
                <p className="text-xs text-gray-500">No debug information yet. Try logging in or test the connection.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
