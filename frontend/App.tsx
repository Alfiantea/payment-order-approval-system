import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PaymentOrders from './pages/PaymentOrders';
import PaymentOrderDetail from './pages/PaymentOrderDetail';
import CreatePaymentOrder from './pages/CreatePaymentOrder';
import UserManagement from './pages/UserManagement';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/payment-orders" element={<PaymentOrders />} />
            <Route path="/payment-orders/new" element={<CreatePaymentOrder />} />
            <Route path="/payment-orders/:id" element={<PaymentOrderDetail />} />
            <Route path="/admin/users" element={<UserManagement />} />
          </Routes>
        </Layout>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}
