export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export type UserRole = 'admin' | 'finance_staff' | 'approver' | 'acknowledger' | 'verifier';

export type PaymentOrderStatus = 
  | 'draft' 
  | 'acknowledge' 
  | 'approval' 
  | 'posting' 
  | 'scheduling' 
  | 'last_approval' 
  | 'verification' 
  | 'release_payment' 
  | 'paid' 
  | 'rejected';

export interface PaymentOrder {
  id: number;
  po_number: string;
  vendor_name: string;
  vendor_email?: string;
  amount: number;
  currency: string;
  due_date: Date;
  description?: string;
  status: PaymentOrderStatus;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentOrderHistory {
  id: number;
  payment_order_id: number;
  status: PaymentOrderStatus;
  action: string;
  user_id: number;
  comments?: string;
  created_at: Date;
}

export interface Attachment {
  id: number;
  payment_order_id: number;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: number;
  created_at: Date;
}

export interface PaymentOrderWithDetails extends PaymentOrder {
  created_by_name: string;
  history: (PaymentOrderHistory & { user_name: string })[];
  attachments: Attachment[];
}
