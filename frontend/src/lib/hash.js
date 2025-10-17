import { ethers } from 'ethers'

export function keccak256Utf8(input) {
  return ethers.keccak256(ethers.toUtf8Bytes(input || ''))
}

export function uuidToBytes32(uuid) {
  return keccak256Utf8(uuid)
}

