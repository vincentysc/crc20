import { BigInt } from "@graphprotocol/graph-ts"
import {
  Crc20,
  Approval,
  Burn,
  LogSetAuthority,
  LogSetOwner,
  Mint,
  Start,
  Stop,
  Transfer,
  __CronosSendToEthereum,
  __CronosSendToIbc
} from "../generated/Crc20/Crc20"

import { toDecimal, ONE, ZERO } from './helpers/number'
import { log } from '@graphprotocol/graph-ts'

import {
  decreaseAccountBalance,
  getOrCreateAccount,
  increaseAccountBalance,
  saveAccountBalanceSnapshot,
} from './account'

const GENESIS_ADDRESS = '0x0000000000000000000000000000000000000000'

export function handleApproval(event: Approval): void {
  // // Entities can be loaded from the store using a string ID; this ID
  // // needs to be unique across all entities of the same type
  // let entity = ExampleEntity.load(event.transaction.from.toHex())

  // // Entities only exist after they have been saved to the store;
  // // `null` checks allow to create entities on demand
  // if (entity == null) {
  //   entity = new ExampleEntity(event.transaction.from.toHex())

  //   // Entity fields can be set using simple assignments
  //   entity.count = BigInt.fromI32(0)
  // }

  // // BigInt and BigDecimal math are supported
  // entity.count = entity.count + BigInt.fromI32(1)

  // // Entity fields can be set based on event parameters
  // entity.src = event.params.src
  // entity.guy = event.params.guy

  // // Entities can be written to the store with `.save()`
  // entity.save()

  // // Note: If a handler doesn't require existing field values, it is faster
  // // _not_ to load the entity from the store. Instead, create it fresh with
  // // `new Entity(...)`, set the fields that should be updated and save the
  // // entity back to the store. Fields that were not set or unset remain
  // // unchanged, allowing for partial updates to be applied.

  // // It is also possible to access smart contracts from mappings. For
  // // example, the contract that has emitted the event can be connected to
  // // with:
  // //
  // // let contract = Contract.bind(event.address)
  // //
  // // The following functions can then be called on this contract to access
  // // state variables and other data:
  // //
  // // - contract.allowance(...)
  // // - contract.approve(...)
  // // - contract.approve(...)
  // // - contract.authority(...)
  // // - contract.balanceOf(...)
  // // - contract.decimals(...)
  // // - contract.name(...)
  // // - contract.native_denom(...)
  // // - contract.owner(...)
  // // - contract.stopped(...)
  // // - contract.symbol(...)
  // // - contract.totalSupply(...)
  // // - contract.transfer(...)
  // // - contract.transferFrom(...)
}

export function handleBurn(event: Burn): void {
  let amount = toDecimal(event.params.wad, 6)
  // source account
  let sourceAccount = getOrCreateAccount(event.params.guy)

  let decreaseAccountBalance = decreaseAccountBalance(sourceAccount, amount)
  decreaseAccountBalance.block = event.block.number
  decreaseAccountBalance.modified = event.block.timestamp
  decreaseAccountBalance.transaction = event.transaction.hash


  log.debug('handleBurn, sourceAccount: {}, amount: {}, block: {}, transation: {}', [
    event.params.guy.toHex().toString(),
    amount.toString(),
    decreaseAccountBalance.block.toString(),
    decreaseAccountBalance.transaction.toString(),
  ])

  sourceAccount.save()
  decreaseAccountBalance.save()

  // To provide information about evolution of account balances
  saveAccountBalanceSnapshot(decreaseAccountBalance, event)
}

export function handleLogSetAuthority(event: LogSetAuthority): void {}

export function handleLogSetOwner(event: LogSetOwner): void {}

export function handleMint(event: Mint): void {
  let amount = toDecimal(event.params.wad, 6)
  // destination account
  let destinationAccount = getOrCreateAccount(event.params.guy)


  let eventEntity = handleMintEvent(amount, event.params.src, event)

  let increaseAccountBalance = increaseAccountBalance(destinationAccount, amount)
  increaseAccountBalance.block = event.block.number
  increaseAccountBalance.modified = event.block.timestamp
  increaseAccountBalance.transaction = event.transaction.hash

  log.debug('handleMint, sourceAccount: {}, amount: {}, block: {}, transation: {}', [
    event.params.guy.toHex().toString(),
    amount.toString(),
    increaseAccountBalance.block.toString(),
    increaseAccountBalance.transaction.toString(),
  ])

  destinationAccount.save()
  increaseAccountBalance.save()

  // To provide information about evolution of account balances
  saveAccountBalanceSnapshot(increaseAccountBalance, event)
}

export function handleStart(event: Start): void {}

export function handleStop(event: Stop): void {}

export function handleTransfer(event: Transfer): void {
  let amount = toDecimal(event.params.wad, 6)

  // let eventEntity = handleTransferEvent(token, amount, event.params.src, event.params.dst, event)

  // source account
  let sourceAccount = getOrCreateAccount(event.params.src)

  let decreaseAccountBalance = decreaseAccountBalance(sourceAccount, amount)
  decreaseAccountBalance.block = event.block.number
  decreaseAccountBalance.modified = event.block.timestamp
  decreaseAccountBalance.transaction = event.transaction.hash

  sourceAccount.save()
  decreaseAccountBalance.save()

  // To provide information about evolution of account balances
  saveAccountBalanceSnapshot(decreaseAccountBalance, event)


  // destination account
  let destinationAccount = getOrCreateAccount(event.params.dst)

  let increaseAccountBalance = increaseAccountBalance(destinationAccount, amount)
  increaseAccountBalance.block = event.block.number
  increaseAccountBalance.modified = event.block.timestamp
  increaseAccountBalance.transaction = event.transaction.hash

  destinationAccount.save()
  increaseAccountBalance.save()

  // To provide information about evolution of account balances
  saveAccountBalanceSnapshot(increaseAccountBalance, event)


  log.debug('handleMint, fromAccount: {}, toAccount: {}, amount: {}, timestamp: {}, block: {}, transation: {}', [
    event.params.src.toHex().toString(),
    event.params.dst.toHex().toString(),
    amount.toString(),
    event.block.timestamp.toString(),
    event.block.number.toString(),
    event.transaction.hash.toString(),
  ])


}

export function handle__CronosSendToEthereum(
  event: __CronosSendToEthereum
): void {}

export function handle__CronosSendToIbc(event: __CronosSendToIbc): void {}



function handleMintEvent(amount: BigDecimal, destination: Bytes, event: ethereum.Event): MintEvent {
  let mintEvent = new MintEvent(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  mintEvent.token = event.address.toHex()
  mintEvent.amount = amount
  mintEvent.sender = event.transaction.from
  mintEvent.destination = destination
  mintEvent.minter = event.transaction.from

  mintEvent.block = event.block.number
  mintEvent.timestamp = event.block.timestamp
  mintEvent.transaction = event.transaction.hash

  mintEvent.save()


  return mintEvent
}
