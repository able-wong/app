import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtUser } from '../types/JwtUser';

/**
 * Retrieves the JWT configuration from environment variables.
 *
 * @throws {Error} If `JWT_PUBLIC_KEY_BASE64` or `JWT_ALGORITHM` environment variables are not defined.
 *
 * @returns {{ publicKey: string, algorithm: jwt.Algorithm }} An object containing the public key and algorithm for JWT verification.
 */
const getJWTConfig = () => {
  if (!process.env.JWT_PUBLIC_KEY_BASE64) {
    throw new Error('JWT_PUBLIC_KEY_BASE64 is not defined');
  }

  const publicKey = Buffer.from(
    process.env.JWT_PUBLIC_KEY_BASE64,
    'base64',
  ).toString('utf-8');

  if (!process.env.JWT_ALGORITHM) {
    throw new Error('JWT_ALGORITHM is not defined');
  }

  const algorithm = process.env.JWT_ALGORITHM as jwt.Algorithm;

  return { publicKey, algorithm };
};

/**
 * Middleware to authenticate JSON Web Tokens (JWT).
 *
 * This middleware function checks for the presence of an authorization header
 * in the incoming request. If the header is present, it extracts the JWT token
 * and verifies it using the public key and algorithm specified in the JWT configuration.
 * If the token is valid, the user information is attached to the request object.
 * If the token is invalid or not present, an appropriate HTTP status code is sent in the response.
 *
 * @param req - The incoming request object.
 * @param res - The outgoing response object.
 * @param next - The next middleware function in the stack.
 *
 * @returns void
 */
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { publicKey, algorithm } = getJWTConfig();
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, publicKey, { algorithms: [algorithm] }, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user as JwtUser;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};
