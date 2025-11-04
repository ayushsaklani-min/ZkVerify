const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("ProofVerifier", function () {
  let proofVerifier;
  let auditorRegistry;
  let zkVerifier;
  let owner;
  let auditor;
  let project;
  let prover;
  let addr1, addr2;

  async function buildProofPayload(credentialId, proofId, summaryHash) {
    const proofBytes = ethers.randomBytes(128);
    const proofHex = ethers.hexlify(proofBytes);
    const projectInput = BigInt(project.address);
    const auditorInput = BigInt(auditor.address);
    const summaryInput = BigInt(summaryHash);

    const publicInputs = [projectInput, auditorInput, summaryInput];

    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const proofHash = ethers.keccak256(proofHex);
    const inputsHash = ethers.keccak256(
      abiCoder.encode(["uint256[]"], [publicInputs])
    );
    const messageHash = ethers.keccak256(
      abiCoder.encode(
        ["address", "bytes32", "address", "address", "bytes32", "bytes32"],
        [await zkVerifier.getAddress(), proofId, auditor.address, project.address, proofHash, inputsHash]
      )
    );

    const signature = await prover.signMessage(ethers.getBytes(messageHash));

    return {
      proofHex,
      publicInputs,
      signature,
    };
  }

  beforeEach(async function () {
    [owner, auditor, project, prover, addr1, addr2] = await ethers.getSigners();
    
    // Deploy AuditorRegistry first
    const AuditorRegistry = await ethers.getContractFactory("AuditorRegistry");
    auditorRegistry = await AuditorRegistry.deploy();
    await auditorRegistry.waitForDeployment();
    
    // Approve auditor
    await auditorRegistry.approveAuditor(auditor.address);
    
    // Deploy ZKVerifier
    const ZKVerifier = await ethers.getContractFactory("ZKVerifier");
    zkVerifier = await ZKVerifier.deploy(prover.address);
    await zkVerifier.waitForDeployment();

    // Deploy ProofVerifier with registry address
    const ProofVerifier = await ethers.getContractFactory("ProofVerifier");
    proofVerifier = await ProofVerifier.deploy(
      await auditorRegistry.getAddress(),
      await zkVerifier.getAddress()
    );
    await proofVerifier.waitForDeployment();
    
    // Link ProofVerifier to AuditorRegistry (required for incrementCredentialCount)
    await auditorRegistry.setProofVerifier(await proofVerifier.getAddress());
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await proofVerifier.getAddress()).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Credential Anchoring", function () {
    it("Should anchor credential successfully", async function () {
      const credentialId = ethers.keccak256(ethers.toUtf8Bytes("test-credential-1"));
      const summaryHash = ethers.keccak256(ethers.toUtf8Bytes("audit-summary"));
      
      await expect(proofVerifier.connect(auditor).anchorCredential(credentialId, summaryHash, auditor.address))
        .to.emit(proofVerifier, "CredentialAnchored")
        .withArgs(credentialId, auditor.address, summaryHash, anyValue);
      
      expect(await proofVerifier.isCredentialAnchored(credentialId)).to.be.true;
    });

    it("Should reject anchoring with zero address", async function () {
      const credentialId = ethers.keccak256(ethers.toUtf8Bytes("test-credential-2"));
      const summaryHash = ethers.keccak256(ethers.toUtf8Bytes("audit-summary"));
      
      await expect(proofVerifier.connect(auditor).anchorCredential(credentialId, summaryHash, ethers.ZeroAddress))
        .to.be.revertedWith("Invalid address");
    });

    it("Should reject anchoring duplicate credential", async function () {
      const credentialId = ethers.keccak256(ethers.toUtf8Bytes("test-credential-3"));
      const summaryHash = ethers.keccak256(ethers.toUtf8Bytes("audit-summary"));
      
      await proofVerifier.connect(auditor).anchorCredential(credentialId, summaryHash, auditor.address);
      
      await expect(proofVerifier.connect(auditor).anchorCredential(credentialId, summaryHash, auditor.address))
        .to.be.revertedWith("Credential already anchored");
    });
    
    it("Should reject anchoring from non-approved auditor", async function () {
      const credentialId = ethers.keccak256(ethers.toUtf8Bytes("test-credential-4"));
      const summaryHash = ethers.keccak256(ethers.toUtf8Bytes("audit-summary"));
      
      await expect(proofVerifier.connect(addr1).anchorCredential(credentialId, summaryHash, addr1.address))
        .to.be.revertedWith("Not an approved auditor");
    });
  });

  describe("Verification Recording", function () {
    it("Should record verification successfully", async function () {
      const status = "Verified - No Critical Issues";
      const credentialId = ethers.keccak256(ethers.toUtf8Bytes("test-credential"));
      const summaryHash = ethers.keccak256(ethers.toUtf8Bytes("audit-summary"));

      await proofVerifier.connect(auditor).anchorCredential(credentialId, summaryHash, auditor.address);

      const proofId = ethers.keccak256(ethers.randomBytes(32));
      const { proofHex, publicInputs, signature } = await buildProofPayload(credentialId, proofId, summaryHash);
      
      await expect(
        proofVerifier.recordVerification(
          project.address,
          auditor.address,
          status,
          credentialId,
          proofId,
          proofHex,
          publicInputs,
          signature
        )
      )
        .to.emit(proofVerifier, "ProofValidated")
        .withArgs(proofId, credentialId, project.address, auditor.address, summaryHash, anyValue);
      
      expect(await proofVerifier.isVerified(project.address)).to.be.true;
      expect(await proofVerifier.getAuditor(project.address)).to.equal(auditor.address);
    });

    it("Should reject verification with zero project address", async function () {
      await expect(
        proofVerifier.recordVerification(
          ethers.ZeroAddress,
          auditor.address,
          "Verified",
          ethers.ZeroHash,
          ethers.ZeroHash,
          "0x",
          [],
          "0x"
        )
      )
        .to.be.revertedWith("Invalid address");
    });

    it("Should reject verification with zero auditor address", async function () {
      await expect(
        proofVerifier.recordVerification(
          project.address,
          ethers.ZeroAddress,
          "Verified",
          ethers.ZeroHash,
          ethers.ZeroHash,
          "0x",
          [],
          "0x"
        )
      )
        .to.be.revertedWith("Invalid address");
    });

    it("Should reject empty status", async function () {
      await expect(
        proofVerifier.recordVerification(
          project.address,
          auditor.address,
          "",
          ethers.ZeroHash,
          ethers.ZeroHash,
          "0x",
          [],
          "0x"
        )
      )
        .to.be.revertedWith("Status cannot be empty");
    });
  });

  describe("View Functions", function () {
    it("Should return false for unverified project", async function () {
      expect(await proofVerifier.isVerified(project.address)).to.be.false;
    });

    it("Should return zero address for unverified project auditor", async function () {
      expect(await proofVerifier.getAuditor(project.address)).to.equal(ethers.ZeroAddress);
    });

    it("Should return false for non-anchored credential", async function () {
      const credentialId = ethers.keccak256(ethers.toUtf8Bytes("non-existent"));
      expect(await proofVerifier.isCredentialAnchored(credentialId)).to.be.false;
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete audit flow", async function () {
      // 1. Anchor credential
      const credentialId = ethers.keccak256(ethers.toUtf8Bytes("integration-test"));
      const summaryHash = ethers.keccak256(ethers.toUtf8Bytes("comprehensive-audit"));
      
      await proofVerifier.connect(auditor).anchorCredential(credentialId, summaryHash, auditor.address);
      expect(await proofVerifier.isCredentialAnchored(credentialId)).to.be.true;
      
      // 2. Record verification
      const status = "Verified - Minor Issues Found";
      const proofId = ethers.keccak256(ethers.randomBytes(32));
      const { proofHex, publicInputs, signature } = await buildProofPayload(credentialId, proofId, summaryHash);

      await proofVerifier.recordVerification(
        project.address,
        auditor.address,
        status,
        credentialId,
        proofId,
        proofHex,
        publicInputs,
        signature
      );
      
      // 3. Verify final state
      expect(await proofVerifier.isVerified(project.address)).to.be.true;
      expect(await proofVerifier.getAuditor(project.address)).to.equal(auditor.address);
    });
  });
});

// removed timestamp helper; we assert any timestamp
