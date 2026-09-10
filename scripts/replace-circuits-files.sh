#!/usr/bin/env bash

set -euo pipefail

# Tests use the checked-in proving keys and witness, so no zkit setup/PTAU download is needed.

cp -f assets/registerIdentityLight256.dev/registerIdentityLight256_js/generate_witness.js zkit/artifacts/circuits/RegisterIdentityLight256.circom/RegisterIdentityLight256_js
cp -f assets/registerIdentityLight256.dev/registerIdentityLight256_js/RegisterIdentityLight256.wasm zkit/artifacts/circuits/RegisterIdentityLight256.circom/RegisterIdentityLight256_js
cp -f assets/registerIdentityLight256.dev/registerIdentityLight256_js/witness_calculator.js zkit/artifacts/circuits/RegisterIdentityLight256.circom/RegisterIdentityLight256_js
cp -f assets/registerIdentityLight256.dev/RegisterIdentityLight256.groth16.vkey.json zkit/artifacts/circuits/RegisterIdentityLight256.circom
cp -f assets/registerIdentityLight256.dev/RegisterIdentityLight256.groth16.zkey zkit/artifacts/circuits/RegisterIdentityLight256.circom
