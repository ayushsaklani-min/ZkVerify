const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AuditorRegistry", function () {
  let auditorRegistry;
  let admin;
  let auditor1;
  let auditor2;
  let nonAdmin;
  let prover;

  beforeEach(async function () {
    [admin, auditor1, auditor2, nonAdmin, prover] = await ethers.getSigners();
    
    const AuditorRegistry = await ethers.getContractFactory("AuditorRegistry");
    auditorRegistry = await AuditorRegistry.deploy();
    await auditorRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      expect(await auditorRegistry.admin()).to.equal(admin.address);
    });
  });

  describe("Auditor Approval", function () {
    it("Should allow admin to approve auditor", async function () {
      await expect(auditorRegistry.approveAuditor(auditor1.address))
        .to.emit(auditorRegistry, "AuditorApproved")
        .withArgs(auditor1.address, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));
      
      expect(await auditorRegistry.isApprovedAuditor(auditor1.address)).to.be.true;
    });

    it("Should reject approval from non-admin", async function () {
      await expect(
        auditorRegistry.connect(nonAdmin).approveAuditor(auditor1.address)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should reject approval of zero address", async function () {
      await expect(
        auditorRegistry.approveAuditor(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid auditor address");
    });

    it("Should reject duplicate approval", async function () {
      await auditorRegistry.approveAuditor(auditor1.address);
      
      await expect(
        auditorRegistry.approveAuditor(auditor1.address)
      ).to.be.revertedWith("Auditor already approved");
    });
  });

  describe("Auditor Revocation", function () {
    beforeEach(async function () {
      await auditorRegistry.approveAuditor(auditor1.address);
    });

    it("Should allow admin to revoke auditor", async function () {
      await expect(auditorRegistry.revokeAuditor(auditor1.address))
        .to.emit(auditorRegistry, "AuditorRevoked")
        .withArgs(auditor1.address, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));
      
      expect(await auditorRegistry.isApprovedAuditor(auditor1.address)).to.be.false;
    });

    it("Should reject revocation from non-admin", async function () {
      await expect(
        auditorRegistry.connect(nonAdmin).revokeAuditor(auditor1.address)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should reject revocation of non-approved auditor", async function () {
      await expect(
        auditorRegistry.revokeAuditor(auditor2.address)
      ).to.be.revertedWith("Auditor not approved");
    });
  });

  describe("Profile Management", function () {
    beforeEach(async function () {
      await auditorRegistry.approveAuditor(auditor1.address);
    });

    it("Should allow auditor to update profile", async function () {
      const github = "auditor1";
      const code4rena = "auditor1_c4";
      const immunefi = "auditor1_if";

      await expect(
        auditorRegistry.connect(auditor1).updateAuditorProfile(github, code4rena, immunefi)
      ).to.emit(auditorRegistry, "AuditorProfileUpdated")
        .withArgs(auditor1.address, github, code4rena, immunefi);

      const info = await auditorRegistry.getAuditorInfo(auditor1.address);
      expect(info.githubHandle).to.equal(github);
      expect(info.code4renaHandle).to.equal(code4rena);
      expect(info.immunefiHandle).to.equal(immunefi);
    });

    it("Should reject profile update from non-approved auditor", async function () {
      await expect(
        auditorRegistry.connect(auditor2).updateAuditorProfile("test", "test", "test")
      ).to.be.revertedWith("Not an approved auditor");
    });
  });

  describe("Credibility Score", function () {
    beforeEach(async function () {
      await auditorRegistry.approveAuditor(auditor1.address);
    });

    it("Should allow admin to update credibility score", async function () {
      const newScore = 250;

      await expect(auditorRegistry.updateCredibilityScore(auditor1.address, newScore))
        .to.emit(auditorRegistry, "CredibilityScoreUpdated")
        .withArgs(auditor1.address, newScore);

      const info = await auditorRegistry.getAuditorInfo(auditor1.address);
      expect(info.credibilityScore).to.equal(newScore);
    });

    it("Should reject score update from non-admin", async function () {
      await expect(
        auditorRegistry.connect(nonAdmin).updateCredibilityScore(auditor1.address, 250)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should reject score update for non-approved auditor", async function () {
      await expect(
        auditorRegistry.updateCredibilityScore(auditor2.address, 250)
      ).to.be.revertedWith("Auditor not approved");
    });
  });

  describe("Credential Count", function () {
    let proofVerifier;
    
    beforeEach(async function () {
      await auditorRegistry.approveAuditor(auditor1.address);

      // Deploy verifier stack for testing
      const ZKVerifier = await ethers.getContractFactory("ZKVerifier");
      const zkVerifier = await ZKVerifier.deploy(prover.address);
      await zkVerifier.waitForDeployment();

      // Deploy a mock ProofVerifier for testing
      const ProofVerifier = await ethers.getContractFactory("ProofVerifier");
      proofVerifier = await ProofVerifier.deploy(
        await auditorRegistry.getAddress(),
        await zkVerifier.getAddress()
      );
      await proofVerifier.waitForDeployment();
      
      // Link ProofVerifier to AuditorRegistry
      await auditorRegistry.setProofVerifier(await proofVerifier.getAddress());
    });

    it("Should increment credential count", async function () {
      // Only ProofVerifier can call incrementCredentialCount
      await expect(proofVerifier.connect(auditor1).anchorCredential(
        ethers.keccak256(ethers.toUtf8Bytes("test")),
        ethers.keccak256(ethers.toUtf8Bytes("summary")),
        auditor1.address
      ))
        .to.emit(auditorRegistry, "CredentialIssued")
        .withArgs(auditor1.address);

      let info = await auditorRegistry.getAuditorInfo(auditor1.address);
      expect(info.credentialCount).to.equal(1);
    });

    it("Should reject increment for non-approved auditor", async function () {
      await expect(
        proofVerifier.connect(auditor2).anchorCredential(
          ethers.keccak256(ethers.toUtf8Bytes("test")),
          ethers.keccak256(ethers.toUtf8Bytes("summary")),
          auditor2.address
        )
      ).to.be.revertedWith("Not an approved auditor");
    });
    
    it("Should reject increment from non-ProofVerifier", async function () {
      await expect(
        auditorRegistry.incrementCredentialCount(auditor1.address)
      ).to.be.revertedWith("Only ProofVerifier can increment");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await auditorRegistry.approveAuditor(auditor1.address);
      await auditorRegistry.approveAuditor(auditor2.address);
    });

    it("Should return all auditors", async function () {
      const auditors = await auditorRegistry.getAllAuditors();
      expect(auditors.length).to.equal(2);
      expect(auditors).to.include(auditor1.address);
      expect(auditors).to.include(auditor2.address);
    });

    it("Should return approved auditor count", async function () {
      const count = await auditorRegistry.getApprovedAuditorCount();
      expect(count).to.equal(2);

      await auditorRegistry.revokeAuditor(auditor1.address);
      const newCount = await auditorRegistry.getApprovedAuditorCount();
      expect(newCount).to.equal(1);
    });

    it("Should return auditor info", async function () {
      const info = await auditorRegistry.getAuditorInfo(auditor1.address);
      expect(info.isApproved).to.be.true;
      expect(info.credentialCount).to.equal(0);
      expect(info.credibilityScore).to.equal(0);
    });
  });

  describe("Admin Transfer", function () {
    it("Should allow admin to transfer role", async function () {
      await auditorRegistry.transferAdmin(nonAdmin.address);
      expect(await auditorRegistry.admin()).to.equal(nonAdmin.address);
    });

    it("Should reject transfer from non-admin", async function () {
      await expect(
        auditorRegistry.connect(nonAdmin).transferAdmin(nonAdmin.address)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should reject transfer to zero address", async function () {
      await expect(
        auditorRegistry.transferAdmin(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid admin address");
    });
  });
});
