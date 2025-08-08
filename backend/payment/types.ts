export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  password: string;
  created_at: Date;
  updated_at: Date;
}

export type UserRole = 'admin' | 'staff' | 'accounting_staff' | 'finance_staff' | 'approver' | 'acknowledger' | 'final_approver' | 'verifier';

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

export type POType = 'Petty Cash' | 'Payment Request' | 'Cash Advance';

export type Department = 'MCorp' | 'MarkPlus inc' | 'MarkPlus Institute' | 'Markteers';

export interface PaymentOrder {
  id: number;
  po_number: string;
  vendor_name: string;
  amount: number;
  due_date: Date;
  description?: string;
  status: PaymentOrderStatus;
  po_type: POType;
  department: Department;
  project_name: string;
  po_date: Date;
  acknowledge_by?: number;
  approval_by?: number;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface POItem {
  id: number;
  payment_order_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit: string;
  created_at: Date;
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
  acknowledge_by_name?: string;
  approval_by_name?: string;
  history: (PaymentOrderHistory & { user_name: string })[];
  attachments: Attachment[];
  items: POItem[];
}
