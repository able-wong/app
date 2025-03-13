import { Request, Response } from 'express';
import {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  getLocationRecord,
} from '../../../src/controllers/locationController';
import { AppDataSource } from '../../../src/appDataSource';
import { Location } from '../../../src/entity/Location';
import { getCustomerRecord } from '../../../src/controllers/customerController';
import { Customer } from '../../../src/entity';

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

describe('Location Controller', () => {
  let locationRepository: jest.Mocked<
    ReturnType<typeof AppDataSource.getRepository>
  >;

  beforeAll(() => {
    locationRepository = {} as jest.Mocked<
      ReturnType<typeof AppDataSource.getRepository>
    >;
    locationRepository.find = jest.fn();
    locationRepository.findOneBy = jest.fn();
    locationRepository.create = jest.fn();
    locationRepository.save = jest.fn();
    locationRepository.merge = jest.fn((entity, dto) => {
      Object.assign(entity, dto); // Simulate the merge behavior
      return entity;
    });
    locationRepository.delete = jest.fn();
    locationRepository.findOne = jest.fn();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(
      locationRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getLocations should return all locations', async () => {
    const req = mockRequest({ customerId: '1' });
    const res = mockResponse();
    const locations = [{ id: 1, name: 'Location 1' }];
    locationRepository.find.mockResolvedValue(locations);
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await getLocations(req, res);

    expect(locationRepository.find).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(locations);
  });

  test('getLocations should return 404 if customer not found', async () => {
    const req = mockRequest({ customerId: '1' });
    const res = mockResponse();
    locationRepository.find.mockResolvedValue([]);
    (getCustomerRecord as jest.Mock).mockResolvedValue(null);

    await getLocations(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
  });

  test('getLocation should return a location by id', async () => {
    const req = mockRequest({ id: '1', customerId: '1' });
    const res = mockResponse();
    const location = { id: 1, name: 'Location 1' };
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });
    locationRepository.findOne = jest.fn().mockResolvedValue(location); // Mock findOne

    await getLocation(req, res);

    expect(locationRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1, customer: { id: 1 } },
    });
    expect(res.json).toHaveBeenCalledWith(location);
  });

  test('getLocation should return 404 if customer not found', async () => {
    const req = mockRequest({ customerId: '1', id: '1' });
    const res = mockResponse();
    (getCustomerRecord as jest.Mock).mockResolvedValue(null);

    await getLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
  });

  test('getLocation should return 404 if location not found', async () => {
    const req = mockRequest({ customerId: '1', id: '1' });
    const res = mockResponse();
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });
    locationRepository.findOne.mockResolvedValue(null);

    await getLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Location not found' });
  });

  test('createLocation should create a new location', async () => {
    const req = mockRequest(
      { customerId: '1' },
      { name: 'Location 1', address: '123 Street' },
    );
    const res = mockResponse();
    const newLocation = { id: 1, name: 'Location 1', address: '123 Street' };
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });
    locationRepository.save.mockResolvedValue(newLocation);

    await createLocation(req, res);

    expect(locationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Location 1', address: '123 Street' }),
    );
    expect(res.json).toHaveBeenCalledWith(newLocation);
  });

  test('createLocation should return 400 for invalid data', async () => {
    const req = mockRequest(
      { customerId: '1' },
      { created_at: 'Invalid Data' },
    );
    const res = mockResponse();
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await createLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid data' });
  });

  test('createLocation should return 404 if customer not found', async () => {
    const req = mockRequest({ customerId: '1' }, { name: 'Location 1' });
    const res = mockResponse();
    (getCustomerRecord as jest.Mock).mockResolvedValue(null);

    await createLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
  });

  test('createLocation should return 400 for invalid data', async () => {
    const req = mockRequest(
      { customerId: '1' },
      { created_at: 'Invalid Data' },
    );
    const res = mockResponse();
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await createLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid data' });
  });

  test('updateLocation should update an existing location', async () => {
    const req = mockRequest(
      { id: '1', customerId: '1' },
      { name: 'Updated Location', address: '456 Avenue' },
    );
    const res = mockResponse();
    const location = new Location();
    location.id = 1;
    location.name = 'Location 1';
    location.address = '123 Street';
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });
    locationRepository.findOne.mockResolvedValue(location);
    locationRepository.save.mockResolvedValue({ ...location, ...req.body });

    await updateLocation(req, res);

    expect(locationRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1, customer: { id: 1 } },
      }),
    );
    expect(locationRepository.merge).toHaveBeenCalledWith(location, {
      name: 'Updated Location',
      address: '456 Avenue',
    });
    expect(locationRepository.save).toHaveBeenCalledWith(location);
    expect(res.json).toHaveBeenCalledWith({ ...location, ...req.body });
  });

  test('updateLocation should return 400 for invalid data', async () => {
    const req = mockRequest(
      { id: '1', customerId: '1' },
      { invalidField: 'Invalid Data' },
    );
    const res = mockResponse();
    const location = { id: 1, name: 'Location 1' };
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });
    locationRepository.findOne.mockResolvedValue(location);

    await updateLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid data' });
  });

  test('updateLocation should return 400 for invalid data', async () => {
    const req = mockRequest(
      { id: '1', customerId: '1' },
      { invalidField: 'Invalid Data' },
    );
    const res = mockResponse();
    const location = { id: 1, name: 'Location 1' };
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });
    locationRepository.findOne.mockResolvedValue(location);

    await updateLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid data' });
  });

  test('updateLocation should return 404 if location not found', async () => {
    const req = mockRequest(
      { id: '1', customerId: '1' },
      { name: 'Updated Location' },
    );
    const res = mockResponse();
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });
    locationRepository.findOne.mockResolvedValue(null);

    await updateLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Location not found' });
  });

  test('updateLocation should return 404 if customer not found', async () => {
    const req = mockRequest(
      { customerId: '1', id: '1' },
      { name: 'Updated Location' },
    );
    const res = mockResponse();
    (getCustomerRecord as jest.Mock).mockResolvedValue(null);

    await updateLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
  });

  test('deleteLocation should delete a location by id', async () => {
    const req = mockRequest({ id: '1', customerId: '1' });
    const res = mockResponse();
    const deleteResult = { affected: 1, raw: {} };
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });
    locationRepository.findOne.mockResolvedValue({ id: 1 });
    locationRepository.delete.mockResolvedValue(deleteResult);

    await deleteLocation(req, res);

    expect(locationRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1, customer: { id: 1 } } }),
    );
    expect(locationRepository.delete).toHaveBeenCalledWith(req.params.id);
    expect(res.json).toHaveBeenCalledWith(deleteResult);
  });

  test('deleteLocation should return 404 if location not found', async () => {
    const req = mockRequest({ id: '1', customerId: '1' });
    const res = mockResponse();
    (getCustomerRecord as jest.Mock).mockResolvedValue({ id: 1 });
    locationRepository.findOne.mockResolvedValue(null);

    await deleteLocation(req, res);

    expect(locationRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1, customer: { id: 1 } } }),
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Location not found' });
  });

  test('deleteLocation should return 404 if customer not found', async () => {
    const req = mockRequest({ customerId: '1', id: '1' });
    const res = mockResponse();
    (getCustomerRecord as jest.Mock).mockResolvedValue(null);

    await deleteLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
  });

  test('getLocationRecord should return a location by customer_id and location_id', async () => {
    const customer_id = 1;
    const location_id = 1;
    const location = { id: 1, name: 'Location 1', customer: { id: 1 } };
    locationRepository.findOne.mockResolvedValue(location);

    const result = await getLocationRecord(customer_id, location_id);

    expect(locationRepository.findOne).toHaveBeenCalledWith({
      where: { id: location_id, customer: { id: customer_id } },
    });
    expect(result).toEqual(location);
  });

  test('getLocationRecord should return null if location not found', async () => {
    const customer_id = 1;
    const location_id = 1;
    locationRepository.findOne.mockResolvedValue(null);

    const result = await getLocationRecord(customer_id, location_id);

    expect(locationRepository.findOne).toHaveBeenCalledWith({
      where: { id: location_id, customer: { id: customer_id } },
    });
    expect(result).toBeNull();
  });
});
