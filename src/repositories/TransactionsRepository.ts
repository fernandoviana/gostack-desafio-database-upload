import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const { income } = await this.createQueryBuilder('transactions')
      .where('transactions.type = :type', {
        type: 'income',
      })
      .select('SUM(transactions.value)', 'income')
      .getRawOne();

    const { outcome } = await this.createQueryBuilder('transactions')
      .where('transactions.type = :type', {
        type: 'outcome',
      })
      .select('SUM(transactions.value)', 'outcome')
      .getRawOne();

    const total = Number(income) - Number(outcome) || 0;

    return {
      income: Number(income) || 0,
      outcome: Number(outcome) || 0,
      total,
    };
  }
}

export default TransactionsRepository;
