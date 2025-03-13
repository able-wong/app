import { Request, Response } from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserRecord,
} from '../../../src/controllers/userController';
import { AppDataSource } from '../../../src/appDataSource';
import { User } from '../../../src/entity/User';
import { getCustomerRecord } from '../../../src/controllers/customerController';

jest.mock('../../../src/appDataSource');
jest.mock('../../../src/controllers/customerController');

const mockRequest = (params = {}, body = {}) =>
  ({
    params,
    body,
  } as Request);

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('User Controller', () => {
  let userRepository: jest.Mocked<
    ReturnType<typeof AppDataSource.getRepository>
  >;

  beforeAll(() => {
    userRepository = {} as jest.Mocked<
      ReturnType<typeof AppDataSource.getRepository>
    >;
    userRepository.find = jest.fn();
    userRepository.findOne = jest.fn();
    userRepository.create = jest.fn();
    userRepository.save = jest.fn();
    userRepository.merge = jest.fn((entity, dto) => {
      Object.assign(entity, dto); // Simulate the merge behavior
      return entity;
    });
    userRepository.delete = jest.fn();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(userRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getUsers should return all users', async () => {
    const req = mockRequest({ customerId: '1' });
    const res = mockResponse();
    const users = [{ id: 1, firstName: 'John', lastName: 'Doe', age: 30 }];
    userRepository.find.mockResolvedValue(users);
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await getUsers(req, res);

    expect(userRepository.find).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(users);
  });

  test('getUsers should return 404 if customer not found', async () => {
    const req = mockRequest({ customerId: '1' });
    const res = mockResponse();
    (getCustomerRecord as jest.Mock).mockResolvedValue(null);

    await getUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
  });

  test('getUser should return a user by id', async () => {
    const req = mockRequest({ id: '1', customerId: '1' });
    const res = mockResponse();
    const user = { id: 1, firstName: 'John', lastName: 'Doe', age: 30 };
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });
    userRepository.findOne.mockResolvedValue(user);

    await getUser(req, res);

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1, customer_id: 1 },
    });
    expect(res.json).toHaveBeenCalledWith(user);
  });

  test('getUser should return 404 if customer not found', async () => {
    const req = mockRequest({ id: '1', customerId: '1' });
    const res = mockResponse();
    (getCustomerRecord as jest.Mock).mockResolvedValue(null);

    await getUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
  });

  test('getUser should return 404 if user not found', async () => {
    const req = mockRequest({ id: '1', customerId: '1' });
    const res = mockResponse();
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });
    userRepository.findOne.mockResolvedValue(null);

    await getUser(req, res);

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1, customer_id: 1 },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  test('createUser should create a new user', async () => {
    const req = mockRequest(
      { customerId: '1' },
      { firstName: 'John', lastName: 'Doe', age: 30 },
    );
    const res = mockResponse();
    const newUser = new User();
    newUser.id = 1;
    newUser.firstName = 'John';
    newUser.lastName = 'Doe';
    newUser.age = 30;
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });
    userRepository.save.mockResolvedValue(newUser);

    await createUser(req, res);

    expect(userRepository.save).toHaveBeenCalledWith(expect.any(User));
    expect(res.json).toHaveBeenCalledWith(newUser);
  });

  test('createUser should return 400 if data is invalid', async () => {
    const req = mockRequest({ customerId: '1' }, { age: 'John' });
    const res = mockResponse();
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid data' });
  });

  test('createUser should return 404 if customer not found', async () => {
    const req = mockRequest(
      { customerId: '1' },
      { firstName: 'John', lastName: 'Doe', age: 30 },
    );
    const res = mockResponse();
    (getCustomerRecord as jest.Mock).mockResolvedValue(null);

    await createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
  });

  test('updateUser should update an existing user', async () => {
    const req = mockRequest(
      { id: '1', customerId: '1' },
      { firstName: 'Jane' },
    );
    const res = mockResponse();
    const user = new User();
    user.id = 1;
    user.firstName = 'John';
    user.lastName = 'Doe';
    user.age = 30;
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });
    userRepository.findOne.mockResolvedValue(user);
    userRepository.save.mockResolvedValue({ ...user, ...req.body });

    await updateUser(req, res);

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1, customer_id: 1 },
    });
    expect(userRepository.merge).toHaveBeenCalledWith(user, req.body);
    expect(userRepository.save).toHaveBeenCalledWith({ ...user, ...req.body });
    expect(res.json).toHaveBeenCalledWith({ ...user, ...req.body });
  });

  test('updateUser should return 400 if data is invalid', async () => {
    const req = mockRequest({ id: '1', customerId: '1' }, { firstName: '' }); // Invalid data
    const res = mockResponse();
    const user = { id: 1, firstName: 'John', lastName: 'Doe', age: 30 };
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });
    userRepository.findOne.mockResolvedValue(user);

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid data' });
  });

  test('updateUser should return 404 if customer not found', async () => {
    const req = mockRequest(
      { id: '1', customerId: '1' },
      { firstName: 'Jane' },
    );
    const res = mockResponse();
    (getCustomerRecord as jest.Mock).mockResolvedValue(null);

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
  });

  test('updateUser should return 404 if user not found', async () => {
    const req = mockRequest(
      { id: '1', customerId: '1' },
      { firstName: 'Jane' },
    );
    const res = mockResponse();
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });
    userRepository.findOne.mockResolvedValue(null);

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  test('deleteUser should delete a user by id', async () => {
    const req = mockRequest({ id: '1', customerId: '1' });
    const res = mockResponse();
    const deleteResult = { affected: 1, raw: {} };
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });
    userRepository.findOne.mockResolvedValue({ id: 1 });
    userRepository.delete.mockResolvedValue(deleteResult);

    await deleteUser(req, res);

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1, customer_id: 1 },
    });
    expect(userRepository.delete).toHaveBeenCalledWith(req.params.id);
    expect(res.json).toHaveBeenCalledWith(deleteResult);
  });

  test('deleteUser should return 404 if user not found', async () => {
    const req = mockRequest({ id: '1', customerId: '1' });
    const res = mockResponse();
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });
    userRepository.findOne.mockResolvedValue(null);

    await deleteUser(req, res);

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1, customer_id: 1 },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  test('deleteUser should return 404 if customer not found', async () => {
    const req = mockRequest({ id: '1', customerId: '1' });
    const res = mockResponse();
    (getCustomerRecord as jest.Mock).mockResolvedValue(null);

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
  });
});

describe('getUserRecord', () => {
  let userRepository: jest.Mocked<
    ReturnType<typeof AppDataSource.getRepository>
  >;

  beforeAll(() => {
    userRepository = {} as jest.Mocked<
      ReturnType<typeof AppDataSource.getRepository>
    >;
    userRepository.findOne = jest.fn();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(userRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return a user record by customer_id and user_id', async () => {
    const user = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      age: 30,
      customer_id: 1,
    };
    userRepository.findOne.mockResolvedValue(user);

    const result = await getUserRecord(1, 1);

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1, customer_id: 1 },
    });
    expect(result).toEqual(user);
  });

  test('should return null if user record not found', async () => {
    userRepository.findOne.mockResolvedValue(null);

    const result = await getUserRecord(1, 1);

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1, customer_id: 1 },
    });
    expect(result).toBeNull();
  });
});
