import api from './api'

export interface WalletBalance {
  asset: string
  balance: number
  locked?: number
  available?: number
  // Backend may return these field names
  lockedBalance?: number
  availableBalance?: number
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
  fundPassword?: string
}

export const walletService = {
  async getBalances(): Promise<WalletBalance[]> {
    const response = await api.get<{ success: boolean; data: any[] }>('/wallet/balances')
    // Transform backend response to match expected format
    return (response.data.data || []).map((b: any) => ({
      asset: b.asset,
      balance: b.balance,
      locked: b.lockedBalance ?? b.locked ?? 0,
      available: b.availableBalance ?? b.available ?? (b.balance - (b.lockedBalance ?? b.locked ?? 0)),
      // Keep original fields for compatibility
      lockedBalance: b.lockedBalance,
      availableBalance: b.availableBalance,
    }))
  },

  async getTransactions(): Promise<Transaction[]> {
    const response = await api.get<{ success: boolean; data: Transaction[] }>('/wallet/transactions')
    return response.data.data
  },

  async deposit(data: DepositRequest): Promise<Transaction> {
    const response = await api.post<{ success: boolean; data: Transaction }>('/wallet/deposit', data)
    return response.data.data
  },

  async withdraw(data: WithdrawRequest): Promise<Transaction> {
    const response = await api.post<{ success: boolean; data: Transaction }>('/wallet/withdraw', data)
    return response.data.data
  },
}

