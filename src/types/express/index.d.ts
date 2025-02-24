import { JwtUser } from '../JwtUser';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}
