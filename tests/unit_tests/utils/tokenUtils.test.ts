import { generateToken } from '../../../src/utils/tokenUtils';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('generateToken', () => {
  const mockSign = jwt.sign as jest.Mock;

  beforeEach(() => {
    process.env.JWT_PRIVATE_KEY_BASE64 =
      Buffer.from('test_private_key').toString('base64');
    process.env.JWT_ALGORITHM = 'HS256';
    process.env.JWT_EXPIRES_IN = '3600';
    mockSign.mockClear();
  });

  it('should generate a token with the correct payload and options', () => {
    const payload = { userId: 123 };
    const expectedToken = 'test_token';
    mockSign.mockReturnValue(expectedToken);

    const token = generateToken(payload);

    expect(token).toBe(expectedToken);
    expect(mockSign).toHaveBeenCalledWith(payload, 'test_private_key', {
      algorithm: 'HS256',
      expiresIn: 3600,
    });
  });
});
