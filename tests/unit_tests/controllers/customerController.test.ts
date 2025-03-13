import { Request, Response } from 'express';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerRecord,
} from '../../../src/controllers/customerController';
import { AppDataSource } from '../../../src/appDataSource';
import { Customer } from '../../../src/entity/Customer';
import { CustomerDto } from '../../../src/dto/CustomerDto';

jest.mock('../../../src/appDataSource');

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

describe('Customer Controller', () => {
  let customerRepository: jest.Mocked<
    ReturnType<typeof AppDataSource.getRepository>
  >;

  beforeAll(() => {
    customerRepository = {} as jest.Mocked<
      ReturnType<typeof AppDataSource.getRepository>
    >;
    customerRepository.find = jest.fn();
    customerRepository.findOneBy = jest.fn();
    customerRepository.create = jest.fn();
    customerRepository.save = jest.fn();
    customerRepository.merge = jest.fn((entity, dto) => {
      Object.assign(entity, dto); // Simulate the merge behavior
      return entity;
    });
    customerRepository.delete = jest.fn();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(
      customerRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getCustomers should return all customers', async () => {
    const req = mockRequest();
    const res = mockResponse();
    const customers = [{ id: 1, name: 'John Doe' }];
    customerRepository.find.mockResolvedValue(customers);

    await getCustomers(req, res);

    expect(customerRepository.find).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(customers);
  });

  test('getCustomer should return a customer by id', async () => {
    const req = mockRequest({ id: '1' });
    const res = mockResponse();
    const customer = { id: 1, name: 'John Doe' };
    customerRepository.findOneBy.mockResolvedValue(customer);

    await getCustomer(req, res);

    expect(customerRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(res.json).toHaveBeenCalledWith(customer);
  });

  test('getCustomer should return 404 if customer not found', async () => {
    const req = mockRequest({ id: '1' }, { name: 'Jane Doe' });
    const res = mockResponse();
    customerRepository.findOneBy.mockResolvedValue(null);

    await getCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
  });

  test('createCustomer should create a new customer', async () => {
    const req = mockRequest({}, { name: 'John Doe' });
    const res = mockResponse();
    const newCustomer = { id: 1, name: 'John Doe' } as unknown as Customer;
    customerRepository.create.mockReturnValue(newCustomer);
    customerRepository.save.mockResolvedValue(newCustomer);

    await createCustomer(req, res);

    expect(customerRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'John Doe',
      }),
    );
    expect(res.json).toHaveBeenCalledWith(newCustomer);
  });

  test('createCustomer should return 400 if data is invalid', async () => {
    const req = mockRequest({}, { name: '' }); // Invalid data
    const res = mockResponse();

    await createCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid data' });
  });

  test('createCustomer should return 400 if an exception is thrown', async () => {
    const req = mockRequest({}, { name: 'John Doe' });
    const res = mockResponse();
    customerRepository.save.mockRejectedValue(new Error('Database error'));

    await createCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid data' });
  });

  test('updateCustomer should update an existing customer', async () => {
    const req = mockRequest({ id: '1' }, { name: 'Jane Doe' });
    const res = mockResponse();
    const customer = new Customer();
    customer.id = 1;
    customer.name = 'John Doe';
    customerRepository.findOneBy.mockResolvedValue(customer);
    customerRepository.save.mockResolvedValue({ ...customer, ...req.body });

    await updateCustomer(req, res);

    expect(customerRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(customerRepository.merge).toHaveBeenCalledWith(
      customer,
      expect.objectContaining({
        name: 'Jane Doe',
      }),
    );
    expect(customerRepository.save).toHaveBeenCalledWith(customer);
    expect(res.json).toHaveBeenCalledWith({ ...customer, ...req.body });
  });

  test('updateCustomer should return 400 if data is invalid', async () => {
    const req = mockRequest({ id: '1' }, { name: '' }); // Invalid data
    const res = mockResponse();
    const customer = { id: 1, name: 'John Doe' };
    customerRepository.findOneBy.mockResolvedValue(customer);

    await updateCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid data' });
  });

  test('updateCustomer should return 400 if an exception is thrown', async () => {
    const req = mockRequest({ id: '1' }, { name: 'Jane Doe' });
    const res = mockResponse();
    const customer = new Customer();
    customer.id = 1;
    customer.name = 'John Doe';
    customerRepository.findOneBy.mockResolvedValue(customer);
    customerRepository.save.mockRejectedValue(new Error('Database error'));

    await updateCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid data' });
  });

  test('updateCustomer should return 404 if customer not found', async () => {
    const req = mockRequest({ id: '1' }, { name: 'Jane Doe' });
    const res = mockResponse();
    customerRepository.findOneBy.mockResolvedValue(null);

    await updateCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
  });

  test('deleteCustomer should delete a customer by id', async () => {
    const req = mockRequest({ id: '1' });
    const res = mockResponse();
    const deleteResult = { affected: 1, raw: {} };
    const customer = { id: 1, name: 'John Doe' } as unknown as Customer;
    customerRepository.delete.mockResolvedValue(deleteResult);
    customerRepository.findOneBy.mockResolvedValue(customer);

    await deleteCustomer(req, res);

    expect(customerRepository.delete).toHaveBeenCalledWith(req.params.id);
    expect(res.json).toHaveBeenCalledWith(deleteResult);
  });

  test('deleteCustomer should return 404 if customer not found', async () => {
    const req = mockRequest({ id: '1' }, { name: 'Jane Doe' });
    const res = mockResponse();
    customerRepository.findOneBy.mockResolvedValue(null);

    await deleteCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
  });

  test('getCustomerRecord should return a customer by id', async () => {
    const customer = { id: 1, name: 'John Doe' };
    customerRepository.findOneBy.mockResolvedValue(customer);

    const result = await getCustomerRecord(1);

    expect(customerRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(result).toEqual(customer);
  });

  test('getCustomerRecord should return null if customer not found', async () => {
    customerRepository.findOneBy.mockResolvedValue(null);

    const result = await getCustomerRecord(1);

    expect(customerRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(result).toBeNull();
  });
});
