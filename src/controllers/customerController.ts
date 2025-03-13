import { Request, Response } from 'express';
import { AppDataSource } from '../appDataSource';
import { Customer } from '../entity/Customer';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CustomerDto } from '../dto/CustomerDto';

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
    const result = await customerRepository.save(newCustomer);
    res.json(result);
  } catch {
    res.status(400).json({ message: 'Invalid data' });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  const customerRepository = getRepository();
  const customer = await customerRepository.findOneBy({
    id: parseInt(req.params.id),
  });

  if (customer) {
    try {
      customerRepository.merge(customer, plainToClass(CustomerDto, req.body));
      const errors = await validate(customer, { skipMissingProperties: true });
      if (errors.length > 0) {
        res.status(400).json({ message: 'Invalid data' });
        return;
      }
      const result = await customerRepository.save(customer);
      res.json(result);
    } catch {
      res.status(400).json({ message: 'Invalid data' });
    }
  } else {
    res.status(404).json({ message: 'Customer not found' });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  const customer = await getRepository().findOneBy({
    id: parseInt(req.params.id),
  });
  if (customer) {
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
