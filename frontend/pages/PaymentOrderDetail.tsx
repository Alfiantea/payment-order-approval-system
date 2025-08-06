import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Calendar,
  DollarSign,
  Building,
  FileText,
  Package
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '../utils/format';
import { useBackend } from '../hooks/useAuth';
import type { PaymentOrderStatus } from '~backend/payment/types';

export default function PaymentOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const backend = useBackend();
  
  const [comments, setComments] = useState('');

  const { data: paymentOrder, isLoading } = useQuery({
    queryKey: ['payment-order', id],
    queryFn: () => backend.payment.get({ id: parseInt(id!) }),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { status: PaymentOrderStatus; comments?: string }) =>
      backend.payment.updateStatus({
        id: parseInt(id!),
        status: data.status,
        comments: data.comments,
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment order status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['payment-order', id] });
      setComments('');
    },
    onError: (error) => {
      console.error('Update status error:', error);
      toast({
        title: "Error",
        description: "Failed to update payment order status",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!paymentOrder) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Payment order not found.</p>
      </div>
    );
  }

  const getNextStatuses = (currentStatus: PaymentOrderStatus): PaymentOrderStatus[] => {
    const transitions: Record<PaymentOrderStatus, PaymentOrderStatus[]> = {
      draft: ['acknowledge', 'rejected'],
      acknowledge: ['approval', 'rejected'],
      approval: ['posting', 'rejected'],
      posting: ['scheduling', 'rejected'],
      scheduling: ['last_approval', 'rejected'],
      last_approval: ['verification', 'rejected'],
      verification: ['release_payment', 'rejected'],
      release_payment: ['paid'],
      paid: [],
      rejected: ['draft']
    };
    return transitions[currentStatus] || [];
  };

  const nextStatuses = getNextStatuses(paymentOrder.status);

  const handleStatusUpdate = (status: PaymentOrderStatus) => {
    updateStatusMutation.mutate({ status, comments });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Payment Order Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  {paymentOrder.po_number}
                  <Badge variant={getStatusColor(paymentOrder.status)} className="capitalize">
                    {paymentOrder.status.replace('_', ' ')}
                  </Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">PO Type</p>
                    <p className="font-medium">{paymentOrder.po_type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium">{paymentOrder.department}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Project Name</p>
                    <p className="font-medium">{paymentOrder.project_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Vendor</p>
                    <p className="font-medium">{paymentOrder.vendor_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-medium text-lg">
                      {formatCurrency(paymentOrder.amount, 'IDR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">PO Date</p>
                    <p className="font-medium">{formatDate(paymentOrder.po_date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className="font-medium">{formatDate(paymentOrder.due_date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Created By</p>
                    <p className="font-medium">{paymentOrder.created_by_name}</p>
                    <p className="text-sm text-gray-500">{formatDate(paymentOrder.created_at)}</p>
                  </div>
                </div>
              </div>

              {(paymentOrder.acknowledge_by_name || paymentOrder.approval_by_name) && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {paymentOrder.acknowledge_by_name && (
                      <div>
                        <p className="text-sm text-gray-600">Acknowledge By</p>
                        <p className="font-medium">{paymentOrder.acknowledge_by_name}</p>
                      </div>
                    )}
                    {paymentOrder.approval_by_name && (
                      <div>
                        <p className="text-sm text-gray-600">Approval By</p>
                        <p className="font-medium">{paymentOrder.approval_by_name}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {paymentOrder.description && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Description</p>
                  <p className="text-gray-900">{paymentOrder.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PO Items */}
          <Card>
            <CardHeader>
              <CardTitle>PO Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentOrder.items?.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      <span className="text-sm font-medium">
                        IDR {item.total_price.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{item.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Quantity: {item.quantity} {item.unit}</span>
                      <span>Unit Price: IDR {item.unit_price.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="text-right">
                    <span className="text-lg font-semibold">
                      Total: IDR {paymentOrder.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentOrder.history.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                    <div className="flex-shrink-0 mt-1">
                      {entry.status === 'rejected' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : entry.status === 'paid' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{entry.action}</p>
                        <Badge variant="outline" className="text-xs capitalize">
                          {entry.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        by {entry.user_name} on {formatDate(entry.created_at)}
                      </p>
                      {entry.comments && (
                        <p className="text-sm text-gray-700 mt-1 italic">"{entry.comments}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {nextStatuses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add comments (optional)..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  {nextStatuses.map((status) => (
                    <Button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={updateStatusMutation.isPending}
                      variant={status === 'rejected' ? 'destructive' : 'default'}
                      className="w-full justify-start capitalize"
                    >
                      {status === 'rejected' ? (
                        <XCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {status === 'rejected' ? 'Reject' : `Move to ${status.replace('_', ' ')}`}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {paymentOrder.status === 'paid' && (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="font-medium text-green-700">Payment Completed</p>
                <p className="text-sm text-gray-600">This payment order has been fully processed.</p>
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentOrder.attachments?.length > 0 ? (
                <div className="space-y-2">
                  {paymentOrder.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{attachment.filename}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No attachments uploaded</p>
                  <p className="text-xs text-red-600 mt-1">Attachment is mandatory</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
