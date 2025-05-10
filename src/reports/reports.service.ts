import { Injectable } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

@Injectable()
export class ReportsService {
  private states = {
    accounts: 'idle',
    yearly: 'idle',
    fs: 'idle',
  };

  private processingPromise: Promise<void> | null = null;

  state(scope: 'accounts' | 'yearly' | 'fs'): string {
    return this.states[scope];
  }

  async generateReportsAsync(): Promise<void> {
    // Only start a new processing job if none is in progress
    if (!this.processingPromise) {
      this.processingPromise = this.processAllReports().finally(() => {
        this.processingPromise = null;
      });
    }

    return this.processingPromise;
  }

  private async processAllReports(): Promise<void> {
    // Process reports in parallel instead of sequentially
    await Promise.all([
      this.accountsAsync(),
      this.yearlyAsync(),
      this.fsAsync(),
    ]);
  }

  private async accountsAsync(): Promise<void> {
    this.states.accounts = 'starting';
    const start = performance.now();

    try {
      const tmpDir = 'tmp';
      const outputFile = 'out/accounts.csv';
      const accountBalances: Record<string, number> = {};

      // Make sure the output directory exists
      if (!fs.existsSync('out')) {
        fs.mkdirSync('out', { recursive: true });
      }

      // Get all CSV files first to avoid repeated directory reads
      const csvFiles = fs
        .readdirSync(tmpDir)
        .filter((file) => file.endsWith('.csv'));

      // Process files
      for (const file of csvFiles) {
        const filePath = path.join(tmpDir, file);
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const lines = content.trim().split('\n');

        for (const line of lines) {
          const [, account, , debit, credit] = line.split(',');
          if (!accountBalances[account]) {
            accountBalances[account] = 0;
          }
          accountBalances[account] +=
            parseFloat(String(debit || 0)) - parseFloat(String(credit || 0));
        }
      }

      const output = ['Account,Balance'];
      for (const [account, balance] of Object.entries(accountBalances)) {
        output.push(`${account},${balance.toFixed(2)}`);
      }

      await fs.promises.writeFile(outputFile, output.join('\n'));
      this.states.accounts = `finished in ${((performance.now() - start) / 1000).toFixed(2)}`;
    } catch (error) {
      this.states.accounts = `error: ${error instanceof Error ? error.message : String(error)}`;
      throw error;
    }
  }

  private async yearlyAsync(): Promise<void> {
    this.states.yearly = 'starting';
    const start = performance.now();

    try {
      const tmpDir = 'tmp';
      const outputFile = 'out/yearly.csv';
      const cashByYear: Record<string, number> = {};

      // Make sure the output directory exists
      if (!fs.existsSync('out')) {
        fs.mkdirSync('out', { recursive: true });
      }

      // Get all CSV files first
      const csvFiles = fs
        .readdirSync(tmpDir)
        .filter((file) => file.endsWith('.csv') && file !== 'yearly.csv');

      // Process files
      for (const file of csvFiles) {
        const filePath = path.join(tmpDir, file);
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const lines = content.trim().split('\n');

        for (const line of lines) {
          const [date, account, , debit, credit] = line.split(',');
          if (account === 'Cash') {
            const year = new Date(date).getFullYear();
            if (!cashByYear[year]) {
              cashByYear[year] = 0;
            }
            cashByYear[year] +=
              parseFloat(String(debit || 0)) - parseFloat(String(credit || 0));
          }
        }
      }

      const output = ['Financial Year,Cash Balance'];
      Object.keys(cashByYear)
        .sort()
        .forEach((year) => {
          output.push(`${year},${cashByYear[year].toFixed(2)}`);
        });

      await fs.promises.writeFile(outputFile, output.join('\n'));
      this.states.yearly = `finished in ${((performance.now() - start) / 1000).toFixed(2)}`;
    } catch (error) {
      this.states.yearly = `error: ${error instanceof Error ? error.message : String(error)}`;
      throw error;
    }
  }

  private async fsAsync(): Promise<void> {
    this.states.fs = 'starting';
    const start = performance.now();

    try {
      const tmpDir = 'tmp';
      const outputFile = 'out/fs.csv';
      const categories = {
        'Income Statement': {
          Revenues: ['Sales Revenue'],
          Expenses: [
            'Cost of Goods Sold',
            'Salaries Expense',
            'Rent Expense',
            'Utilities Expense',
            'Interest Expense',
            'Tax Expense',
          ],
        },
        'Balance Sheet': {
          Assets: [
            'Cash',
            'Accounts Receivable',
            'Inventory',
            'Fixed Assets',
            'Prepaid Expenses',
          ],
          Liabilities: [
            'Accounts Payable',
            'Loan Payable',
            'Sales Tax Payable',
            'Accrued Liabilities',
            'Unearned Revenue',
            'Dividends Payable',
          ],
          Equity: ['Common Stock', 'Retained Earnings'],
        },
      };

      // Make sure the output directory exists
      if (!fs.existsSync('out')) {
        fs.mkdirSync('out', { recursive: true });
      }

      const balances: Record<string, number> = {};
      for (const section of Object.values(categories)) {
        for (const group of Object.values(section)) {
          for (const account of group) {
            balances[account] = 0;
          }
        }
      }

      // Get all CSV files first
      const csvFiles = fs
        .readdirSync(tmpDir)
        .filter((file) => file.endsWith('.csv') && file !== 'fs.csv');

      // Process files
      for (const file of csvFiles) {
        const filePath = path.join(tmpDir, file);
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const lines = content.trim().split('\n');

        for (const line of lines) {
          const [, account, , debit, credit] = line.split(',');

          if (Object.prototype.hasOwnProperty.call(balances, account)) {
            balances[account] +=
              parseFloat(String(debit || 0)) - parseFloat(String(credit || 0));
          }
        }
      }

      const output: string[] = [];
      output.push('Basic Financial Statement');
      output.push('');
      output.push('Income Statement');
      let totalRevenue = 0;
      let totalExpenses = 0;
      for (const account of categories['Income Statement']['Revenues']) {
        const value = balances[account] || 0;
        output.push(`${account},${value.toFixed(2)}`);
        totalRevenue += value;
      }
      for (const account of categories['Income Statement']['Expenses']) {
        const value = balances[account] || 0;
        output.push(`${account},${value.toFixed(2)}`);
        totalExpenses += value;
      }
      output.push(`Net Income,${(totalRevenue - totalExpenses).toFixed(2)}`);
      output.push('');
      output.push('Balance Sheet');
      let totalAssets = 0;
      let totalLiabilities = 0;
      let totalEquity = 0;
      output.push('Assets');
      for (const account of categories['Balance Sheet']['Assets']) {
        const value = balances[account] || 0;
        output.push(`${account},${value.toFixed(2)}`);
        totalAssets += value;
      }
      output.push(`Total Assets,${totalAssets.toFixed(2)}`);
      output.push('');
      output.push('Liabilities');
      for (const account of categories['Balance Sheet']['Liabilities']) {
        const value = balances[account] || 0;
        output.push(`${account},${value.toFixed(2)}`);
        totalLiabilities += value;
      }
      output.push(`Total Liabilities,${totalLiabilities.toFixed(2)}`);
      output.push('');
      output.push('Equity');
      for (const account of categories['Balance Sheet']['Equity']) {
        const value = balances[account] || 0;
        output.push(`${account},${value.toFixed(2)}`);
        totalEquity += value;
      }
      output.push(
        `Retained Earnings (Net Income),${(totalRevenue - totalExpenses).toFixed(2)}`,
      );
      totalEquity += totalRevenue - totalExpenses;
      output.push(`Total Equity,${totalEquity.toFixed(2)}`);
      output.push('');
      output.push(
        `Assets = Liabilities + Equity, ${totalAssets.toFixed(2)} = ${(totalLiabilities + totalEquity).toFixed(2)}`,
      );

      await fs.promises.writeFile(outputFile, output.join('\n'));
      this.states.fs = `finished in ${((performance.now() - start) / 1000).toFixed(2)}`;
    } catch (error) {
      this.states.fs = `error: ${error instanceof Error ? error.message : String(error)}`;
      throw error;
    }
  }
}
