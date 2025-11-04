const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('ZKVerifier', function () {
  let zkVerifier
  let prover
  let issuer
  let subject

  beforeEach(async function () {
    ;[prover, issuer, subject] = await ethers.getSigners()
    const ZKVerifier = await ethers.getContractFactory('ZKVerifier')
    zkVerifier = await ZKVerifier.deploy(prover.address)
    await zkVerifier.waitForDeployment()
  })

  function buildDigest(contractAddress, proofId, issuerAddr, subjectAddr, proofBytes, publicInputs) {
    const proofHash = ethers.keccak256(proofBytes)
    const inputsHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(['uint256[]'], [publicInputs])
    )
    return ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'bytes32', 'address', 'address', 'bytes32', 'bytes32'],
        [contractAddress, proofId, issuerAddr, subjectAddr, proofHash, inputsHash]
      )
    )
  }

  it('verifies a proof signed by the trusted prover', async function () {
    const proofId = ethers.keccak256(ethers.toUtf8Bytes('proof-1'))
    const proofBytes = ethers.randomBytes(128)
    const proofHex = ethers.hexlify(proofBytes)
    const publicInputs = [BigInt(issuer.address), BigInt(subject.address), BigInt(1)]

    const digest = buildDigest(
      await zkVerifier.getAddress(),
      proofId,
      issuer.address,
      subject.address,
      proofHex,
      publicInputs
    )

    const signature = await prover.signMessage(ethers.getBytes(digest))

    const result = await zkVerifier.verify(
      proofId,
      issuer.address,
      subject.address,
      proofHex,
      publicInputs,
      signature
    )

    expect(result).to.be.true
  })

  it('rejects proofs signed by unknown signers', async function () {
    const proofId = ethers.keccak256(ethers.toUtf8Bytes('proof-2'))
    const proofBytes = ethers.randomBytes(128)
    const proofHex = ethers.hexlify(proofBytes)
    const publicInputs = [BigInt(issuer.address), BigInt(subject.address), BigInt(1)]

    const digest = buildDigest(
      await zkVerifier.getAddress(),
      proofId,
      issuer.address,
      subject.address,
      proofHex,
      publicInputs
    )

    const maliciousSignature = await issuer.signMessage(ethers.getBytes(digest))

    const result = await zkVerifier.verify(
      proofId,
      issuer.address,
      subject.address,
      proofHex,
      publicInputs,
      maliciousSignature
    )

    expect(result).to.be.false
  })
})
