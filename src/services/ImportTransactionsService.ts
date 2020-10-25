import csvParse from 'csv-parse';
import fs from 'fs';
import { getCustomRepository, getRepository, In } from 'typeorm';
import Category from '../models/Category';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  filePath: string;
}

enum TransactionType {
  income = 'income',
  outcome = 'outcome',
}

interface ParsedTransaction {
  title: string;
  type: TransactionType;
  value: number;
  category: string;
}

interface CSVParsed {
  transactions: ParsedTransaction[];
  categories: string[];
}

class ImportTransactionsService {
  async execute({ filePath: file }: Request): Promise<Transaction[]> {
    const { transactions: transactionsList, categories } = await this.parseCSV(
      file,
    );

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const categoriesRepository = getRepository(Category);
    const existentsCategories = await categoriesRepository.find({
      title: In(categories),
    });
    const existentsCategoriesTitle = existentsCategories.map(
      category => category.title,
    );

    const categoriesToCreate = categories.filter(
      category => !existentsCategoriesTitle.includes(category),
    );

    const newCategories = categoriesRepository.create(
      categoriesToCreate.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const allAvailableCategories = [...newCategories, ...existentsCategories];

    const transactions = transactionsRepository.create(
      transactionsList.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allAvailableCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(transactions);

    return transactions;
  }

  private async parseCSV(filePath: string): Promise<CSVParsed> {
    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: ParsedTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', line => {
      const [title, type, value, category] = line.map((item: string) => item);

      if (!title || !type || !value || !category) return;

      const payload: ParsedTransaction | any = {
        title: String(title),
        type: String(type),
        value: Number(value),
        category: String(category),
      };

      transactions.push(payload);

      if (!categories.includes(category)) {
        categories.push(category);
      }
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    await fs.promises.unlink(filePath);

    return { transactions, categories };
  }
}

export default ImportTransactionsService;
