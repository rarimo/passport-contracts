describe.skip("Registration", () => {
  describe("$TSS flow", async () => {
    describe("#changeICAOMasterTreeRoot", () => {
      const newIcaoMerkleRoot = "0x3c50ce3aa92bc3dd0351a89970b02630415547ea83c487befbc8b1795ea90c45";
      const timestamp = "123456";

      it("should change the root", async () => {
        expect(await registration.icaoMasterTreeMerkleRoot()).to.equal(icaoMerkleRoot);

        const leaf = ethers.solidityPackedKeccak256(
          ["string", "bytes32", "uint256"],
          ["Rarimo CSCA root", newIcaoMerkleRoot, timestamp],
        );

        const proof = merkleTree.getProof(leaf, true);

        await registration.changeICAOMasterTreeRoot(newIcaoMerkleRoot, timestamp, proof);

        expect(await registration.icaoMasterTreeMerkleRoot()).to.equal(newIcaoMerkleRoot);
      });

      it("should not reuse the signature", async () => {
        const leaf = ethers.solidityPackedKeccak256(
          ["string", "bytes32", "uint256"],
          ["Rarimo CSCA root", newIcaoMerkleRoot, timestamp],
        );

        const proof = merkleTree.getProof(leaf, true);

        await registration.changeICAOMasterTreeRoot(newIcaoMerkleRoot, timestamp, proof);

        expect(registration.changeICAOMasterTreeRoot(newIcaoMerkleRoot, timestamp, proof)).to.be.revertedWith(
          "TSSSigner: nonce used",
        );
      });
    });

    describe("#addRegistrations, #removeRegistrations", () => {
      it("should add multiple registrations", async () => {
        await addRegistrations([ADDRESS1.address, ADDRESS2.address]);

        expect(await tree.isRegistrationExists(ADDRESS1.address)).to.be.true;
        expect(await tree.isRegistrationExists(ADDRESS2.address)).to.be.true;

        const registrations = await tree.getRegistrations();

        expect(registrations).to.have.lengthOf(3);
        expect(registrations).to.be.deep.eq([REGISTRATION.address, ADDRESS1.address, ADDRESS2.address]);

        await removeRegistrations([ADDRESS2.address]);

        expect(await tree.isRegistrationExists(ADDRESS1.address)).to.be.true;
        expect(await tree.isRegistrationExists(ADDRESS2.address)).to.be.false;
      });

      it("should not be able to add/remove with invalid signer", async () => {
        const ANOTHER_SIGNER = ethers.Wallet.createRandom();

        let operation = merkleTree.addRegistrationsOperation(
          [ADDRESS1.address],
          chainName,
          await tree.getNonce(PoseidonSMTMethodId.AddRegistrations),
          await tree.getAddress(),
          ANOTHER_SIGNER,
        );

        await expect(
          tree.updateRegistrationSet(PoseidonSMTMethodId.AddRegistrations, operation.data, operation.proof),
        ).to.be.rejectedWith("TSSSigner: invalid signature");

        operation = merkleTree.removeRegistrationsOperation(
          [ADDRESS1.address],
          chainName,
          await tree.getNonce(PoseidonSMTMethodId.RemoveRegistrations),
          await tree.getAddress(),
          ANOTHER_SIGNER,
        );

        await expect(
          tree.updateRegistrationSet(PoseidonSMTMethodId.RemoveRegistrations, operation.data, operation.proof),
        ).to.be.rejectedWith("TSSSigner: invalid signature");
      });

      it("should revert if trying to use same signature twice", async () => {
        const operation = merkleTree.addRegistrationsOperation(
          [ADDRESS1.address],
          chainName,
          await tree.getNonce(PoseidonSMTMethodId.AddRegistrations),
          await tree.getAddress(),
        );

        await tree.updateRegistrationSet(PoseidonSMTMethodId.AddRegistrations, operation.data, operation.proof);

        await expect(
          tree.updateRegistrationSet(PoseidonSMTMethodId.AddRegistrations, operation.data, operation.proof),
        ).to.be.rejectedWith("TSSSigner: invalid signature");
      });
    });

    it("should revert if invalid operation was signed", async () => {
      const signature = merkleTree.authorizeUpgradeOperation(
        PoseidonSMTMethodId.None,
        ethers.ZeroAddress,
        chainName,
        await tree.getNonce(PoseidonSMTMethodId.AddRegistrations),
        await tree.getAddress(),
      );

      await expect(
        tree.updateRegistrationSet(PoseidonSMTMethodId.None, ethers.ZeroAddress, signature),
      ).to.be.rejectedWith("PoseidonSMT: Invalid method");
    });
  });
});
