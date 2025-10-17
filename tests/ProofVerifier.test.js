const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("ProofVerifier", function () {
  let proofVerifier;
  let owner;
  let auditor;
  let project;
  let addr1, addr2;

  beforeEach(async function () {
    [owner, auditor, project, addr1, addr2] = await ethers.getSigners();
    
    const ProofVerifier = await ethers.getContractFactory("ProofVerifier");
    proofVerifier = await ProofVerifier.deploy();
    await proofVerifier.waitForDeployment();
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
      
      await expect(proofVerifier.anchorCredential(credentialId, summaryHash, auditor.address))
        .to.emit(proofVerifier, "CredentialAnchored")
        .withArgs(credentialId, auditor.address, summaryHash, anyValue);
      
      expect(await proofVerifier.isCredentialAnchored(credentialId)).to.be.true;
    });

    it("Should reject anchoring with zero address", async function () {
      const credentialId = ethers.keccak256(ethers.toUtf8Bytes("test-credential-2"));
      const summaryHash = ethers.keccak256(ethers.toUtf8Bytes("audit-summary"));
      
      await expect(proofVerifier.anchorCredential(credentialId, summaryHash, ethers.ZeroAddress))
        .to.be.revertedWith("Invalid address");
    });

    it("Should reject anchoring duplicate credential", async function () {
      const credentialId = ethers.keccak256(ethers.toUtf8Bytes("test-credential-3"));
      const summaryHash = ethers.keccak256(ethers.toUtf8Bytes("audit-summary"));
      
      await proofVerifier.anchorCredential(credentialId, summaryHash, auditor.address);
      
      await expect(proofVerifier.anchorCredential(credentialId, summaryHash, auditor.address))
        .to.be.revertedWith("Credential already anchored");
    });
  });

  describe("Verification Recording", function () {
    it("Should record verification successfully", async function () {
      const status = "Verified - No Critical Issues";
      
      await expect(proofVerifier.recordVerification(project.address, auditor.address, status))
        .to.emit(proofVerifier, "AuditVerified")
        .withArgs(project.address, auditor.address, status, anyValue);
      
      expect(await proofVerifier.isVerified(project.address)).to.be.true;
      expect(await proofVerifier.getAuditor(project.address)).to.equal(auditor.address);
    });

    it("Should reject verification with zero project address", async function () {
      await expect(proofVerifier.recordVerification(ethers.ZeroAddress, auditor.address, "Verified"))
        .to.be.revertedWith("Invalid address");
    });

    it("Should reject verification with zero auditor address", async function () {
      await expect(proofVerifier.recordVerification(project.address, ethers.ZeroAddress, "Verified"))
        .to.be.revertedWith("Invalid address");
    });

    it("Should reject empty status", async function () {
      await expect(proofVerifier.recordVerification(project.address, auditor.address, ""))
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
      
      await proofVerifier.anchorCredential(credentialId, summaryHash, auditor.address);
      expect(await proofVerifier.isCredentialAnchored(credentialId)).to.be.true;
      
      // 2. Record verification
      const status = "Verified - Minor Issues Found";
      await proofVerifier.recordVerification(project.address, auditor.address, status);
      
      // 3. Verify final state
      expect(await proofVerifier.isVerified(project.address)).to.be.true;
      expect(await proofVerifier.getAuditor(project.address)).to.equal(auditor.address);
    });
  });
});

// removed timestamp helper; we assert any timestamp
