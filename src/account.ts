import { BigDecimal, Bytes, ethereum } from '@graphprotocol/graph-ts'

import { Account, AccountBalance, AccountBalanceSnapshot } from '../generated/schema'

import { ZERO } from './helpers/number'

export function getOrCreateAccount(accountAddress: Bytes): Account {
  let accountId = accountAddress.toHex()
  let existingAccount = Account.load(accountId)

  if (existingAccount != null) {
    return existingAccount as Account
  }

  let newAccount = new Account(accountId)
  newAccount.address = accountAddress

  return newAccount
}

function getOrCreateAccountBalance(account: Account): AccountBalance {
  let balanceId = account.id
  let previousBalance = AccountBalance.load(balanceId)

  if (previousBalance != null) {
    return previousBalance as AccountBalance
  }

  let newBalance = new AccountBalance(balanceId)
  newBalance.account = account.id
  newBalance.amount = ZERO.toBigDecimal()

  return newBalance
}

export function increaseAccountBalance(account: Account, amount: BigDecimal): AccountBalance {
  let balance = getOrCreateAccountBalance(account)
  balance.amount = balance.amount.plus(amount)

  return balance
}

export function decreaseAccountBalance(account: Account, amount: BigDecimal): AccountBalance {
  let balance = getOrCreateAccountBalance(account)
  balance.amount = balance.amount.minus(amount)

  return balance
}

export function saveAccountBalanceSnapshot(balance: AccountBalance, event: ethereum.Event): void {
  let snapshot = new AccountBalanceSnapshot(balance.id + '-' + event.block.timestamp.toString())
  snapshot.account = balance.account
  snapshot.amount = balance.amount

  snapshot.block = event.block.number
  snapshot.transaction = event.transaction.hash
  snapshot.timestamp = event.block.timestamp

  snapshot.save()
}
