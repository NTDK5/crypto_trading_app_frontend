import api from './api'

export interface WalletBalance {
  asset: string
  balance: number
  locked: number
  available: number
}

export interface Transaction {
  id: string
  type: string
  asset: string
  amount: number
  status: string
  createdAt: string
  description?: string
}

export interface DepositRequest {
  asset: string
  amount: number
}

export interface WithdrawRequest {
  asset: string
  amount: number
  address: string
}

export const walletService = {
  async getBalances(): Promise<WalletBalance[]> {
    const response = await api.get<WalletBalance[]>('/wallet/balances')
    return response.data
  },

  async getTransactions(): Promise<Transaction[]> {
    const response = await api.get<Transaction[]>('/wallet/transactions')
    return response.data
  },

  async deposit(data: DepositRequest): Promise<Transaction> {
    const response = await api.post<Transaction>('/wallet/deposit', data)
    return response.data
  },

  async withdraw(data: WithdrawRequest): Promise<Transaction> {
    const response = await api.post<Transaction>('/wallet/withdraw', data)
    return response.data
  },
}

