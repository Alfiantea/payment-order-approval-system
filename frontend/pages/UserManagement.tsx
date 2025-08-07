import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  UserCheck,
  Shield,
  Eye,
  CheckCircle,
  FileText
} from 'lucide-react';
import { formatDate } from '../utils/format';
import api from '../services/api';
import { User, UserRole } from '../types/models';
import { AxiosError } from 'axios';

export default function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [createForm, setCreateForm] = useState({
    email: '',
    name: '',
    role: 'finance_staff' as UserRole,
    password: '',
  });

  const [editForm, setEditForm] = useState({
    email: '',
    name: '',
    role: 'finance_staff' as UserRole,
    password: '',
  });

  const { data: usersData, isLoading } = useQuery<{users: User[]}>({
    queryKey: ['users'],
    queryFn: async () => {
        const response = await api.get('/users');
        return response.data;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
        const response = await api.get('/admin/users/stats');
        return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof createForm) => api.post('/admin/users', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      setIsCreateDialogOpen(false);
      setCreateForm({ email: '', name: '', role: 'finance_staff', password: '' });
    },
    onError: (error: AxiosError<{message: string}>) => {
      console.error('Create user error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; email?: string; name?: string; role?: UserRole; password?: string }) => 
      api.put(`/admin/users/${data.id}`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
    },
    onError: (error: AxiosError<{message: string}>) => {
      console.error('Update user error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    },
    onError: (error: AxiosError<{message: string}>) => {
      console.error('Delete user error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete user.",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email || !createForm.name || !createForm.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    if (createForm.password.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(createForm);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editForm.email || !editForm.name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    if (editForm.password && editForm.password.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate({
      id: editingUser.id,
      email: editForm.email,
      name: editForm.name,
      role: editForm.role,
      password: editForm.password || undefined,
    });
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditForm({
      email: user.email,
      name: user.name,
      role: user.role,
      password: '',
    });
    setIsEditDialogOpen(true);
  };

  const roleOptions: { value: UserRole; label: string; icon: React.ReactNode }[] = [
    { value: 'admin', label: 'Admin', icon: <Shield className="h-4 w-4" /> },
    { value: 'finance_staff', label: 'Finance Staff', icon: <FileText className="h-4 w-4" /> },
    { value: 'approver', label: 'Approver', icon: <CheckCircle className="h-4 w-4" /> },
    { value: 'acknowledger', label: 'Acknowledger', icon: <UserCheck className="h-4 w-4" /> },
    { value: 'verifier', label: 'Verifier', icon: <Eye className="h-4 w-4" /> },
  ];

  const getRoleColor = (role: UserRole): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'finance_staff':
        return 'default';
      case 'approver':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    const roleOption = roleOptions.find(option => option.value === role);
    return roleOption?.icon || <Users className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@company.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="create-name">Name *</Label>
                <Input
                  id="create-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full Name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="create-password">Password *</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="create-role">Role *</Label>
                <Select value={createForm.role} onValueChange={(value) => setCreateForm(prev => ({ ...prev, role: value as UserRole }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          {option.icon}
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{statsData?.total_users || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {statsData?.role_breakdown?.map((item: any) => (
          <Card key={item.role}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 capitalize">
                    {item.role.replace('_', ' ')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                </div>
                {getRoleIcon(item.role as UserRole)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Users ({usersData?.users.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : usersData?.users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No users found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {usersData?.users.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        <Badge variant={getRoleColor(user.role)} className="capitalize">
                          <div className="flex items-center gap-1">
                            {getRoleIcon(user.role)}
                            {user.role.replace('_', ' ')}
                          </div>
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Email:</span> {user.email}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span> {formatDate(user.created_at)}
                        </div>
                      </div>
                      {user.updated_at !== user.created_at && (
                        <div className="mt-1 text-sm text-gray-500">
                          Last updated: {formatDate(user.updated_at)}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Dialog open={isEditDialogOpen && editingUser?.id === user.id} onOpenChange={(open) => {
                        if (!open) {
                          setIsEditDialogOpen(false);
                          setEditingUser(null);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-email">Email *</Label>
                              <Input
                                id="edit-email"
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Name *</Label>
                              <Input
                                id="edit-name"
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="edit-password">New Password (optional)</Label>
                              <Input
                                id="edit-password"
                                type="password"
                                value={editForm.password}
                                onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                                placeholder="Leave blank to keep current password"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="edit-role">Role *</Label>
                              <Select value={editForm.role} onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value as UserRole }))}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {roleOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      <div className="flex items-center gap-2">
                                        {option.icon}
                                        {option.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex gap-2 pt-4">
                              <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? 'Updating...' : 'Update User'}
                              </Button>
                              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {user.name}? This action cannot be undone.
                              Users with associated payment orders cannot be deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(user.id)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Breakdown */}
      {statsData?.role_breakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {statsData.role_breakdown.map((item: any) => (
                <div key={item.role} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-center mb-2">
                    {getRoleIcon(item.role as UserRole)}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                  <p className="text-sm text-gray-600 capitalize">
                    {item.role.replace('_', ' ')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
