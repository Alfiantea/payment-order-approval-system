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
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { useBackend } from '../hooks/useAuth';
import type { POType, Department } from '~backend/payment/types';

interface POItem {
  description: string;
  quantity: number;
  unit_price: number;
  unit: string;
}

export default function CreatePaymentOrder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const backend = useBackend();
  
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

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => backend.payment.listUsers(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => backend.payment.create(data),
    onSuccess: (response) => {
      toast({
        title: "Success",
        description: "Payment order created successfully",
      });
      navigate(`/payment-orders/${response.payment_order.id}`);
    },
    onError: (error) => {
      console.error('Create payment order error:', error);
      toast({
        title: "Error",
        description: "Failed to create payment order",
        variant: "destructive",
      });
    },
  });

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

        {/* Attachment Notice */}
        <Card>
          <CardContent className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Document attachment is mandatory. Please ensure you have the required documents ready to upload after creating the payment order.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={createMutation.isPending}>
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
