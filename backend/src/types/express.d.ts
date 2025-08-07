import { Request } from 'express';
import { User } from './models'; // I will create this type later

export interface AuthenticatedRequest extends Request {
  user?: User;
}
