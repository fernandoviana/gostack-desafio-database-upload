import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const deleted = await transactionsRepository.delete({ id });

    if (deleted.affected === 0) {
      throw new AppError(
        'the transactions with the given id was not found',
        404,
      );
    }
  }
}

export default DeleteTransactionService;
