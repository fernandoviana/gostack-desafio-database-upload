// import AppError from '../errors/AppError';

import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

enum Type {
  income = 'income',
  outcome = 'outcome',
}

interface Request {
  title: string;
  type: Type;
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    let categoryFound = await categoriesRepository
      .createQueryBuilder('category')
      .where('LOWER(category.title) = LOWER(:title)', {
        title: category.toLowerCase(),
      })
      .getOne();

    if (!categoryFound) {
      categoryFound = categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(categoryFound);
    }

    if (type === 'outcome') {
      const balance = await transactionsRepository.getBalance();

      const isNegativeBalance = balance.total < value;

      if (isNegativeBalance) {
        throw new AppError('insufficient balance');
      }
    }

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category: categoryFound,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
