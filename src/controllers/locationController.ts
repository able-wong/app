import { Request, Response } from 'express';
import { AppDataSource } from '../appDataSource';
import { Location } from '../entity/Location';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { getCustomerRecord } from './customerController';
import { LocationDto } from '../dto/LocationDto';

const getRepository = function (): Repository<Location> {
  return AppDataSource.getRepository<Location>(Location);
};

export const getLocations = async (req: Request, res: Response) => {
  const customer = await getCustomerRecord(parseInt(req.params.customerId));
  if (!customer) {
    res.status(404).json({ message: 'Customer not found' });
    return;
  }
  const locations = await getRepository().find({
    where: { customer: { id: customer.id } },
  });
  res.json(locations);
};

export const getLocation = async (req: Request, res: Response) => {
  const customer = await getCustomerRecord(parseInt(req.params.customerId));
  if (!customer) {
    res.status(404).json({ message: 'Customer not found' });
    return;
  }
  const location = await getRepository().findOne({
    where: { id: parseInt(req.params.id), customer: { id: customer.id } },
  });
  if (location) {
    res.json(location);
  } else {
    res.status(404).json({ message: 'Location not found' });
  }
};

export const createLocation = async (req: Request, res: Response) => {
  const customer = await getCustomerRecord(parseInt(req.params.customerId));
  if (!customer) {
    res.status(404).json({ message: 'Customer not found' });
    return;
  }
  const dto = plainToClass(LocationDto, req.body);
  let newLocation = new Location();
  const errors = await validate(dto);
  if (errors.length > 0) {
    res.status(400).json({ message: 'Invalid data' });
    return;
  }
  newLocation.customer = customer;
  newLocation = getRepository().merge(newLocation, dto);
  const result = await getRepository().save(newLocation);
  res.json(result);
};

export const updateLocation = async (req: Request, res: Response) => {
  const customer = await getCustomerRecord(parseInt(req.params.customerId));
  if (!customer) {
    res.status(404).json({ message: 'Customer not found' });
    return;
  }

  const locationRepository = getRepository();
  const location = await locationRepository.findOne({
    where: { id: parseInt(req.params.id), customer: { id: customer.id } },
  });
  if (!location) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }

  locationRepository.merge(location, plainToClass(LocationDto, req.body));
  const errors = await validate(location, { skipMissingProperties: true });
  if (errors.length > 0) {
    res.status(400).json({ message: 'Invalid data' });
    return;
  }

  const result = await locationRepository.save(location);
  res.json(result);
};

export const deleteLocation = async (req: Request, res: Response) => {
  const customer = await getCustomerRecord(parseInt(req.params.customerId));
  if (!customer) {
    res.status(404).json({ message: 'Customer not found' });
    return;
  }
  const location = await getRepository().findOne({
    where: { id: parseInt(req.params.id), customer: { id: customer.id } },
  });
  if (location) {
    const result = await getRepository().delete(req.params.id);
    res.json(result);
  } else {
    res.status(404).json({ message: 'Location not found' });
  }
};

export const getLocationRecord = async (
  customer_id: number,
  location_id: number,
): Promise<Location | null> => {
  return await getRepository().findOne({
    where: { id: location_id, customer: { id: customer_id } },
  });
};
