import { Request, Response } from 'express';
import { AppDataSource } from '../appDataSource';
import { User } from '../entity/User';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { getCustomerRecord } from './customerController';
import { UserDto } from '../dto/UserDto';

const getRepository = function (): Repository<User> {
  return AppDataSource.getRepository<User>(User);
};

export const getUsers = async (req: Request, res: Response) => {
  const customer = await getCustomerRecord(parseInt(req.params.customerId));
  if (!customer) {
    res.status(404).json({ message: 'Customer not found' });
    return;
  }
  const users = await getRepository().find({
    where: { customer_id: customer.id },
  });
  res.json(users);
};

export const getUser = async (req: Request, res: Response) => {
  const customer = await getCustomerRecord(parseInt(req.params.customerId));
  if (!customer) {
    res.status(404).json({ message: 'Customer not found' });
    return;
  }
  const user = await getRepository().findOne({
    where: { id: parseInt(req.params.id), customer_id: customer.id },
  });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json(user);
};

export const createUser = async (req: Request, res: Response) => {
  const customer = await getCustomerRecord(parseInt(req.params.customerId));
  if (!customer) {
    res.status(404).json({ message: 'Customer not found' });
    return;
  }
  const userRepository = getRepository();
  const dto = plainToClass(UserDto, req.body);
  const errors = await validate(dto);
  if (errors.length > 0) {
    res.status(400).json({ message: 'Invalid data' });
    return;
  }
  const newUser = new User();
  userRepository.merge(newUser, dto);
  newUser.customer_id = customer.id;
  const result = await userRepository.save(newUser);
  res.json(result);
};

export const updateUser = async (req: Request, res: Response) => {
  const customer = await getCustomerRecord(parseInt(req.params.customerId));
  if (!customer) {
    res.status(404).json({ message: 'Customer not found' });
    return;
  }
  const userRepository = getRepository();
  const user = await userRepository.findOne({
    where: { id: parseInt(req.params.id), customer_id: customer.id },
  });

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  userRepository.merge(user, plainToClass(UserDto, req.body));
  const errors = await validate(user, { skipMissingProperties: true });
  if (errors.length > 0) {
    res.status(400).json({ message: 'Invalid data' });
    return;
  }

  const result = await userRepository.save(user);
  res.json(result);
};

export const deleteUser = async (req: Request, res: Response) => {
  const customer = await getCustomerRecord(parseInt(req.params.customerId));
  if (!customer) {
    res.status(404).json({ message: 'Customer not found' });
    return;
  }
  const user = await getRepository().findOne({
    where: { id: parseInt(req.params.id), customer_id: customer.id },
  });
  if (user) {
    const result = await getRepository().delete(req.params.id);
    res.json(result);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

export const getUserRecord = async (
  customer_id: number,
  user_id: number,
): Promise<User | null> => {
  return await getRepository().findOne({
    where: { id: user_id, customer_id: customer_id },
  });
};
