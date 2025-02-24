import jwt, { Algorithm, SignOptions } from 'jsonwebtoken';

export function generateToken(payload: object): string {
  const algorithm: Algorithm =
    (process.env.JWT_ALGORITHM as Algorithm) || 'RS256';
  const expiresIn = parseInt(process.env.JWT_EXPIRES_IN || '3600', 10);
  const signOptions: SignOptions = { algorithm, expiresIn };

  if (!process.env.JWT_PRIVATE_KEY_BASE64) {
    throw new Error('JWT_PRIVATE_KEY_BASE64 is not defined');
  }

  const privateKey = Buffer.from(
    process.env.JWT_PRIVATE_KEY_BASE64,
    'base64',
  ).toString('utf-8');

  return jwt.sign(payload, privateKey, signOptions);
}
