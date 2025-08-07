import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Plus, Trash2, Upload, FileText, X } from 'lucide-react';
import api from '../services/api';
import { POType, Department, User } from '../types/models';
import { AxiosError } from 'axios';

interface POItem {
  description: string;
  quantity: number;
  unit_price: number;
  unit: string;
}

interface UploadedFile {
  name: string;
  data: string; // Base64 encoded
  type: string;
  size: number;
}

export default function CreatePaymentOrder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    vendor_name: '',
    due_date: '',
    description: '',
    po_type: 'Payment Request' as POType,
    department: 'MCorp' as Department,
    project_name: '',
    po_date: new Date().toISOString().split('T')[0],
    acknowledge_by: '',
    approval_by: '',
  });

  const [items, setItems] = useState<POItem[]>([
    { description: '', quantity: 1, unit_price: 0, unit: 'pcs' }
  ]);

  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: usersData } = useQuery<{users: User[]}>({
    queryKey: ['users'],
    queryFn: async () => {
        const response = await api.get('/users');
        return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/payment-orders', data),
    onSuccess: (response) => {
      toast({
        title: "Success",
        description: "Payment order created successfully",
      });
      navigate(`/payment-orders/${response.data.payment_order.id}`);
    },
    onError: (error) => {
      console.error('Create payment order error:', error);
      let errorMessage = "Failed to create payment order";
      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message || error.message;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF, Word, Excel, or image files only",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64Data = result.split(',')[1];
        
        setUploadedFile({
          name: file.name,
          data: base64Data,
          type: file.type,
          size: file.size,
        });
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast({
          title: "Upload Error",
          description: "Failed to read the file",
          variant: "destructive",
        });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload the file",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vendor_name || !formData.due_date || !formData.project_name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (items.some(item => !item.description || item.quantity <= 0 || item.unit_price <= 0 || !item.unit)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all item details with valid values",
        variant: "destructive",
      });
      return;
    }

    if (!uploadedFile) {
      toast({
        title: "Validation Error",
        description: "Document upload is mandatory. Please upload a document.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      ...formData,
      due_date: new Date(formData.due_date),
      po_date: new Date(formData.po_date),
      acknowledge_by: formData.acknowledge_by ? parseInt(formData.acknowledge_by) : undefined,
      approval_by: formData.approval_by ? parseInt(formData.approval_by) : undefined,
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit: item.unit,
      })),
      document_filename: uploadedFile.name,
      document_data: uploadedFile.data,
      document_mime_type: uploadedFile.type,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, unit: 'pcs' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof POItem, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const poTypeOptions: POType[] = ['Petty Cash', 'Payment Request', 'Cash Advance'];
  const departmentOptions: Department[] = ['MCorp', 'MarkPlus inc', 'MarkPlus Institute', 'Markteers'];
  const unitOptions = ['pcs', 'kg', 'liter', 'meter', 'hour', 'day', 'month', 'year', 'set', 'box', 'pack'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Create Payment Order</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="po_type">PO Type *</Label>
                <Select value={formData.po_type} onValueChange={(value) => handleInputChange('po_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {poTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentOptions.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_name">Project Name *</Label>
                <Input
                  id="project_name"
                  value={formData.project_name}
                  onChange={(e) => handleInputChange('project_name', e.target.value)}
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor_name">Vendor Name *</Label>
                <Input
                  id="vendor_name"
                  value={formData.vendor_name}
                  onChange={(e) => handleInputChange('vendor_name', e.target.value)}
                  placeholder="Enter vendor name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="po_date">PO Date *</Label>
                <Input
                  id="po_date"
                  type="date"
                  value={formData.po_date}
                  onChange={(e) => handleInputChange('po_date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="acknowledge_by">Acknowledge By</Label>
                <Select value={formData.acknowledge_by} onValueChange={(value) => handleInputChange('acknowledge_by', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select acknowledger" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersData?.users.filter(user => user.role === 'acknowledger' || user.role === 'admin').map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approval_by">Approval By</Label>
                <Select value={formData.approval_by} onValueChange={(value) => handleInputChange('approval_by', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select approver" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersData?.users.filter(user => user.role === 'approver' || user.role === 'admin').map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter payment order description..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Document Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Document Upload *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              {!uploadedFile ? (
                <div className="text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <Label htmlFor="document-upload" className="cursor-pointer">
                      <span className="text-lg font-medium text-gray-900">Upload Document</span>
                      <p className="text-sm text-gray-600 mt-1">
                        Click to select or drag and drop your file here
                      </p>
                    </Label>
                    <Input
                      id="document-upload"
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      className="hidden"
                      disabled={isUploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('document-upload')?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? 'Uploading...' : 'Select File'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    Supported formats: PDF, Word, Excel, JPG, PNG (Max 10MB)
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">{uploadedFile.name}</p>
                      <p className="text-sm text-green-700">
                        {formatFileSize(uploadedFile.size)} • {uploadedFile.type}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Important:</strong> Document upload is mandatory for all payment orders. 
                Please ensure you upload the required supporting documents before submitting.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* PO Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>PO Items</CardTitle>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Description *</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Item description"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Unit *</Label>
                    <Select value={item.unit} onValueChange={(value) => updateItem(index, 'unit', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {unitOptions.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Unit Price (IDR) *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="text-sm text-gray-600">
                    Subtotal: IDR {(item.quantity * item.unit_price).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
            
            <div className="border-t pt-4">
              <div className="text-right">
                <span className="text-lg font-semibold">
                  Total Amount: IDR {getTotalAmount().toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={createMutation.isPending || isUploading}>
            <Save className="h-4 w-4 mr-2" />
            {createMutation.isPending ? 'Creating...' : 'Create Payment Order'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
