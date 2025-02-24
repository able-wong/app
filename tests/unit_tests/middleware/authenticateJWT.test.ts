import { Request, Response, NextFunction } from 'express';
import { authenticateJWT } from '../../../src/middleware/authenticateJWT';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { generateToken } from '../../../src/utils/tokenUtils';

dotenv.config();

describe('authenticateJWT middleware', () => {
  it('should send status 401 and not call next with an error if no token is provided', () => {
    const req = { headers: {} } as Request;
    const res = {
      sendStatus: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    authenticateJWT(req, res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should send status 403 and not call next with an error if token is invalid', () => {
    const req = {
      headers: { authorization: 'Bearer invalidtoken' },
    } as Request;
    const res = {
      sendStatus: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    jwt.verify = jest
      .fn()
      .mockImplementation((token, publicKey, options, callback) => {
        callback(new Error('Invalid token'), null);
      });

    authenticateJWT(req, res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next without error if token is valid', () => {
    const req = { headers: { authorization: 'Bearer validtoken' } } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    jwt.verify = jest
      .fn()
      .mockImplementation((token, publicKey, options, callback) =>
        callback(null, { user: 'test' }),
      );

    authenticateJWT(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should add user to req object if token is valid, using actual jwt implementation', () => {
    const payload = { user: 'test' };
    const token = generateToken(payload);
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    authenticateJWT(req, res, next);

    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalledWith();
  });
});
