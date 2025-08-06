import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Eye } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '../utils/format';
import { useBackend } from '../hooks/useAuth';
import type { PaymentOrderStatus, Department } from '~backend/payment/types';

export default function PaymentOrders() {
  const backend = useBackend();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentOrderStatus | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<Department | 'all'>('all');
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['payment-orders', statusFilter, departmentFilter, search, page],
    queryFn: () => backend.payment.list({
      status: statusFilter === 'all' ? undefined : statusFilter,
      department: departmentFilter === 'all' ? undefined : departmentFilter,
      search: search || undefined,
      limit,
      offset: page * limit,
    }),
  });

  const statusOptions: { value: PaymentOrderStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'acknowledge', label: 'Acknowledge' },
    { value: 'approval', label: 'Approval' },
    { value: 'posting', label: 'Posting' },
    { value: 'scheduling', label: 'Scheduling' },
    { value: 'last_approval', label: 'Last Approval' },
    { value: 'verification', label: 'Verification' },
    { value: 'release_payment', label: 'Release Payment' },
    { value: 'paid', label: 'Paid' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const departmentOptions: { value: Department | 'all'; label: string }[] = [
    { value: 'all', label: 'All Departments' },
    { value: 'MCorp', label: 'MCorp' },
    { value: 'MarkPlus inc', label: 'MarkPlus inc' },
    { value: 'MarkPlus Institute', label: 'MarkPlus Institute' },
    { value: 'Markteers', label: 'Markteers' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payment Orders</h1>
        <Button asChild>
          <Link to="/payment-orders/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by project name, vendor name, or PO number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={departmentFilter} onValueChange={(value) => setDepartmentFilter(value as Department | 'all')}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                {departmentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PaymentOrderStatus | 'all')}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payment Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Payment Orders ({data?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : data?.payment_orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No payment orders found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data?.payment_orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{order.po_number}</h3>
                        <Badge variant={getStatusColor(order.status)} className="capitalize">
                          {order.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {order.department}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {order.po_type}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Project:</span> {order.project_name}
                        </div>
                        <div>
                          <span className="font-medium">Vendor:</span> {order.vendor_name}
                        </div>
                        <div>
                          <span className="font-medium">Amount:</span> {formatCurrency(order.amount, 'IDR')}
                        </div>
                        <div>
                          <span className="font-medium">Due Date:</span> {formatDate(order.due_date)}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        Created by {order.created_by_name} on {formatDate(order.created_at)}
                        {order.acknowledge_by_name && (
                          <span className="ml-4">• Acknowledger: {order.acknowledge_by_name}</span>
                        )}
                        {order.approval_by_name && (
                          <span className="ml-4">• Approver: {order.approval_by_name}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/payment-orders/${order.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.total > limit && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {page * limit + 1} to {Math.min((page + 1) * limit, data.total)} of {data.total} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * limit >= data.total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
