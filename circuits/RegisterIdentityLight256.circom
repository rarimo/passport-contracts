pragma circom 2.1.6;

template RegisterIdentityLight256() {
    signal output dg1Hash;
    signal output dg1Commitment;
    
    // Poseidon2(PubKey.X, PubKey.Y)
    signal output pkIdentityHash;
    
    // INPUT SIGNALS:
    signal input dg1[1024];
    signal input skIdentity;
}

component main = RegisterIdentityLight256();


