import { Request, Response } from 'express';
import { AppDataSource } from '../appDataSource';
import { Customer } from '../entity/Customer';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CustomerDto } from '../dto/CustomerDto';
import { Location } from '../entity/Location';

const getRepository = function (): Repository<Customer> {
  return AppDataSource.getRepository<Customer>(Customer);
};

export const getCustomers = async (req: Request, res: Response) => {
  const customers = await getRepository().find();
  res.json(customers);
};

export const getCustomer = async (req: Request, res: Response) => {
  const customer = await getRepository().findOneBy({
    id: parseInt(req.params.id),
  });
  if (customer) {
    res.json(customer);
  } else {
    res.status(404).json({ message: 'Customer not found' });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  const customerRepository = getRepository();
  try {
    const newCustomer = plainToClass(CustomerDto, req.body);
    const errors = await validate(newCustomer, { skipMissingProperties: true });
    if (errors.length > 0) {
      res.status(400).json({ message: 'Invalid data' });
      return;
    }

    // Create a new Customer entity and set its properties
    const customer = new Customer();
    customer.name = newCustomer.name;

    const result = await customerRepository.save(customer);
    res.status(200).json(result);
  } catch {
    res.status(400).json({ message: 'Invalid data' });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const customerRepository = getRepository();
    const customer = await customerRepository.findOneBy({
      id: parseInt(req.params.id),
    });

    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    const customerDto = plainToClass(CustomerDto, req.body);
    const errors = await validate(customerDto, { skipMissingProperties: true });

    if (errors.length > 0) {
      res.status(400).json({
        message: 'Invalid data',
        errors: errors.map((error) => Object.values(error.constraints || {})),
      });
      return;
    }

    customerRepository.merge(customer, customerDto);
    const result = await customerRepository.save(customer);
    res.json(result);
    return;
  } catch {
    res.status(500).json({ message: 'Internal server error' });
    return;
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  const customer = await getRepository().findOneBy({
    id: parseInt(req.params.id),
  });
  if (customer) {
    // First delete all related locations
    const locationRepository = AppDataSource.getRepository(Location);
    await locationRepository.delete({ customer: { id: customer.id } });

    // Then delete the customer
    const result = await getRepository().delete(req.params.id);
    res.json(result);
  } else {
    res.status(404).json({ message: 'Customer not found' });
  }
};

export const getCustomerRecord = async (
  customer_id: number,
): Promise<Customer | null> => {
  return await getRepository().findOneBy({ id: customer_id });
};
