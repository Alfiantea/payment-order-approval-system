import { Router } from 'express';
import pool from '../db';
import { authMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/express';
import { PaymentOrder, POItem, Attachment, PaymentOrderHistory } from '../types/models';

const router = Router();

// POST /payment-orders - Create a new payment order
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const {
    vendor_name,
    due_date,
    description,
    po_type,
    department,
    project_name,
    po_date,
    items,
    document_filename,
    document_data,
    document_mime_type,
  } = req.body;
  const created_by = req.user!.id;

  // Basic validation
  if (!vendor_name || !due_date || !po_type || !department || !project_name || !po_date || !items || items.length === 0 || !document_filename || !document_data || !document_mime_type) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
    const poNumber = `PO-${Date.now()}`;

    // Insert payment order
    const paymentOrderRes = await client.query<PaymentOrder>(
      `INSERT INTO payment_orders (po_number, vendor_name, amount, due_date, description, po_type, department, project_name, po_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [poNumber, vendor_name, totalAmount, due_date, description, po_type, department, project_name, po_date, created_by]
    );
    const paymentOrder = paymentOrderRes.rows[0];

    // Insert PO items
    for (const item of items) {
      const totalPrice = item.quantity * item.unit_price;
      await client.query<POItem>(
        'INSERT INTO po_items (payment_order_id, description, quantity, unit_price, total_price, unit) VALUES ($1, $2, $3, $4, $5, $6)',
        [paymentOrder.id, item.description, item.quantity, item.unit_price, totalPrice, item.unit]
      );
    }

    // Insert attachment record
    const fileSize = Math.round((document_data.length * 3) / 4);
    const filePath = `po-documents/${paymentOrder.id}/${document_filename}`;
    await client.query<Attachment>(
      'INSERT INTO attachments (payment_order_id, filename, file_path, file_size, mime_type, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6)',
      [paymentOrder.id, document_filename, filePath, fileSize, document_mime_type, created_by]
    );

    // Insert history entry
    await client.query<PaymentOrderHistory>(
      `INSERT INTO payment_order_history (payment_order_id, status, action, user_id, comments)
       VALUES ($1, 'draft', 'Created payment order', $2, 'Payment order created with document attachment')`,
      [paymentOrder.id, created_by]
    );

    await client.query('COMMIT');

    res.status(201).json({ payment_order: paymentOrder });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /payment-orders - List all payment orders
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { status, department, search, limit = 50, offset = 0 } = req.query;

  const queryParams: any[] = [];
  let whereClauses: string[] = [];
  let paramIndex = 1;

  if (status) {
    whereClauses.push(`po.status = $${paramIndex++}`);
    queryParams.push(status);
  }
  if (department) {
    whereClauses.push(`po.department = $${paramIndex++}`);
    queryParams.push(department);
  }
  if (search) {
    whereClauses.push(`(po.vendor_name ILIKE $${paramIndex} OR po.project_name ILIKE $${paramIndex} OR po.po_number ILIKE $${paramIndex})`);
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) as total FROM payment_orders po ${whereClause}`;
  const countParams = [...queryParams];

  const dataQuery = `
    SELECT
      po.*,
      u1.name as created_by_name,
      u2.name as acknowledge_by_name,
      u3.name as approval_by_name
    FROM payment_orders po
    JOIN users u1 ON po.created_by = u1.id
    LEFT JOIN users u2 ON po.acknowledge_by = u2.id
    LEFT JOIN users u3 ON po.approval_by = u3.id
    ${whereClause}
    ORDER BY po.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  const dataParams = [...queryParams, limit, offset];

  try {
    const totalResult = await pool.query(countQuery, countParams);
    const total = parseInt(totalResult.rows[0].total, 10);

    const dataResult = await pool.query(dataQuery, dataParams);
    const payment_orders = dataResult.rows;

    res.json({ payment_orders, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /payment-orders/:id - Get a single payment order with details
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  try {
    const paymentOrderRes = await pool.query<PaymentOrderWithDetails>(
      `SELECT
        po.*,
        u1.name as created_by_name,
        u2.name as acknowledge_by_name,
        u3.name as approval_by_name
      FROM payment_orders po
      JOIN users u1 ON po.created_by = u1.id
      LEFT JOIN users u2 ON po.acknowledge_by = u2.id
      LEFT JOIN users u3 ON po.approval_by = u3.id
      WHERE po.id = $1`,
      [id]
    );

    if (paymentOrderRes.rows.length === 0) {
      return res.status(404).json({ message: 'Payment order not found' });
    }
    const paymentOrder = paymentOrderRes.rows[0];

    const historyRes = await pool.query(
      `SELECT h.*, u.name as user_name FROM payment_order_history h
       JOIN users u ON h.user_id = u.id
       WHERE h.payment_order_id = $1 ORDER BY h.created_at ASC`,
      [id]
    );
    paymentOrder.history = historyRes.rows;

    const attachmentsRes = await pool.query('SELECT * FROM attachments WHERE payment_order_id = $1 ORDER BY created_at ASC', [id]);
    paymentOrder.attachments = attachmentsRes.rows;

    const itemsRes = await pool.query('SELECT * FROM po_items WHERE payment_order_id = $1 ORDER BY id ASC', [id]);
    paymentOrder.items = itemsRes.rows;

    res.json(paymentOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /payment-orders/:id/status - Update the status of a payment order
router.put('/:id/status', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, comments } = req.body;
  const user_id = req.user!.id;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const currentPORes = await client.query<PaymentOrder>('SELECT * FROM payment_orders WHERE id = $1', [id]);
    if (currentPORes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Payment order not found' });
    }
    const currentPO = currentPORes.rows[0];

    const validTransitions: Record<PaymentOrderStatus, PaymentOrderStatus[]> = {
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

    if (!validTransitions[currentPO.status].includes(status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Invalid status transition from ${currentPO.status} to ${status}` });
    }

    const updatedPORes = await client.query<PaymentOrder>(
      'UPDATE payment_orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    const updatedPO = updatedPORes.rows[0];

    const action = status === 'rejected' ? 'Rejected' : `Moved to ${status}`;
    await client.query(
      'INSERT INTO payment_order_history (payment_order_id, status, action, user_id, comments) VALUES ($1, $2, $3, $4, $5)',
      [id, status, action, user_id, comments]
    );

    await client.query('COMMIT');
    res.json({ payment_order: updatedPO });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router;
