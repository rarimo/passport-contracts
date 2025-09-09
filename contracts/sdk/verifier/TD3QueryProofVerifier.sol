// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

/**
 * @notice See docs:
 * - https://www2023.icao.int/publications/Documents/9303_p4_cons_en.pdf
 * - https://www2023.icao.int/publications/pages/publication.aspx
 */
contract TD3QueryProofVerifier {
    // Scalar field size
    uint256 constant r =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q =
        21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax =
        20491192805390485299153009773594534940189261866228447918068658471970481763042;
    uint256 constant alphay =
        9383485363053290200918347156157836566562967994039712273449902621266178545958;
    uint256 constant betax1 =
        4252822878758300859123897981450591353533073413197771768651442665752259397132;
    uint256 constant betax2 =
        6375614351688725206403948262868962793625744043794305715222011528459656738731;
    uint256 constant betay1 =
        21847035105528745403288232691147584728191162732299865338377159692350059136679;
    uint256 constant betay2 =
        10505242626370262277552901082094356697409835680220590971873171140371331206856;
    uint256 constant gammax1 =
        11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 =
        10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 =
        4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 =
        8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 =
        7918804905557415959065306318808180222510617915496909222590026551054032447946;
    uint256 constant deltax2 =
        21570251404699465383997747291488217929717666456841626090639890781888118671301;
    uint256 constant deltay1 =
        12227424247988085355962415874861162192700194789671861533883587440189951371756;
    uint256 constant deltay2 =
        12770166122086015482601558785592896923566484431398640759266017594312924815567;

    uint256 constant IC0x =
        6732148179208849637983747353365901588397162895318630817123480374080083282971;
    uint256 constant IC0y =
        19873949065566504430727995765849869146001433219930688585328131105756469657143;

    uint256 constant IC1x =
        11864162617912496828298003467384864631982500302333274646587366337078555234489;
    uint256 constant IC1y =
        13243913994381161699707280472912027185689309772034751789116324640110390023371;

    uint256 constant IC2x =
        2152477988175581528811718075677955115933176953626428816782400018208138687886;
    uint256 constant IC2y =
        21304911914077379900246443656312002593519535152202814009232163711234367112738;

    uint256 constant IC3x =
        655824025125330549284978305816195737337932028870937776138550891442072289948;
    uint256 constant IC3y =
        20598858092559550226833520247045145762608230923451821187319214985922050846038;

    uint256 constant IC4x =
        14742252465638304198936790169928024792639417386063537385069919518789823887179;
    uint256 constant IC4y =
        11337316405569947493711977431693666584029481240773156487041804459132673205450;

    uint256 constant IC5x =
        12034782930432063083678167155130316689457611721454102965227744410026820074016;
    uint256 constant IC5y =
        21297736145772749832688714810567013476509932280880601567033076624935868383201;

    uint256 constant IC6x =
        2706481871710765193197021099125896543139620734589944432849123628744219374892;
    uint256 constant IC6y =
        15287383566271981122068320654518465218128376525720170909726983453405044943768;

    uint256 constant IC7x =
        7978645990063631634162396664760287651108002672865518575953754948353982493554;
    uint256 constant IC7y =
        20956723562136283018604754105269513044659906446896960689020416153517420775922;

    uint256 constant IC8x =
        3728653732928280111249403035073119520674644229189164280202302173380243104075;
    uint256 constant IC8y =
        16163273024178534444167593159822692810788882601956973537917276827007542397221;

    uint256 constant IC9x =
        13072642442623939270235765377554699919342817946694595276171859801046545521710;
    uint256 constant IC9y =
        21413388219296908334424123093894914309747625936133826120899255372632730483602;

    uint256 constant IC10x =
        19238193920918256704263366411167280812130230838694574584627126259800279172487;
    uint256 constant IC10y =
        11042922968382520660623610190279180134634404688548083728225080910959607041532;

    uint256 constant IC11x =
        13465041547313740870199973573586148600932466645721728925788548008697792870178;
    uint256 constant IC11y =
        2559497114387644954353974936106194823597101622468833536920942555963880853329;

    uint256 constant IC12x =
        6448115210589867889850688479237974973905996197919847455498475691758817670950;
    uint256 constant IC12y =
        19610889249784031370406929000525753180537103121317363464996692338164817481106;

    uint256 constant IC13x =
        8034742873640949793142891395586293753027108654291231391522184497800396109309;
    uint256 constant IC13y =
        7923448118703035000195299309905740488123789722602373073176587770765305949745;

    uint256 constant IC14x =
        4412641139681422637473097733369191171360304989207951202089689244738853322110;
    uint256 constant IC14y =
        1438609447983686059884494923809890916669443886956332236564712850897233294835;

    uint256 constant IC15x =
        10488201530579648685867148179262826225690700743573064742829591842009677466575;
    uint256 constant IC15y =
        4375022409712288709286561498591261826348881658590497294732909090242139678171;

    uint256 constant IC16x =
        19293432214388428523763043124057133693629381745542469639893005844708617050284;
    uint256 constant IC16y =
        17843177594579490126508770229083098595769660386800499306761596137656090066332;

    uint256 constant IC17x =
        6206938962385904113401091463201072701392307427359406618825216324430582525273;
    uint256 constant IC17y =
        18082540415596003368776483988779423351001376667054755928356058038277536930387;

    uint256 constant IC18x =
        17890636146909933289083883133111861315882487666849322700532595530150198649671;
    uint256 constant IC18y =
        21563509439002684398882428854694060906558676506399748043993401712962351835106;

    uint256 constant IC19x =
        10974696587630188372824313954397303641901217425802900893272334271312368845069;
    uint256 constant IC19y =
        12238669004314126008684602719182501746500243123046763687231219646153001389629;

    uint256 constant IC20x =
        19575237823423728300205986723029875361585107315887893407358497248606540167075;
    uint256 constant IC20y =
        21856545102172887619716877437543815339890222972623263801463768298196756131238;

    uint256 constant IC21x =
        9118149073253857404442977465930450917212144208873413022088319455042070716353;
    uint256 constant IC21y =
        17307300866620426678565985126286452831664332652215420691654507066477234886723;

    uint256 constant IC22x =
        9546940421895954373295434859172394272026752072203716476106496545033572581678;
    uint256 constant IC22y =
        15407944163895440882179937094826152911853840893366019509021703800156910297582;

    uint256 constant IC23x =
        6314518912771494436366538874810905757830781334166745139148309552057990561668;
    uint256 constant IC23y =
        20331496807385136145073919378214977596267120508758015294153216074315139935895;

    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[23] calldata _pubSignals
    ) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, q)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x

                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))

                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))

                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))

                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))

                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))

                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))

                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))

                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))

                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))

                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))

                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))

                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))

                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))

                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))

                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))

                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))

                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))

                g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))

                g1_mulAccC(_pVk, IC19x, IC19y, calldataload(add(pubSignals, 576)))

                g1_mulAccC(_pVk, IC20x, IC20y, calldataload(add(pubSignals, 608)))

                g1_mulAccC(_pVk, IC21x, IC21y, calldataload(add(pubSignals, 640)))

                g1_mulAccC(_pVk, IC22x, IC22y, calldataload(add(pubSignals, 672)))

                g1_mulAccC(_pVk, IC23x, IC23y, calldataload(add(pubSignals, 704)))

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))

                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)

                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F

            checkField(calldataload(add(_pubSignals, 0)))

            checkField(calldataload(add(_pubSignals, 32)))

            checkField(calldataload(add(_pubSignals, 64)))

            checkField(calldataload(add(_pubSignals, 96)))

            checkField(calldataload(add(_pubSignals, 128)))

            checkField(calldataload(add(_pubSignals, 160)))

            checkField(calldataload(add(_pubSignals, 192)))

            checkField(calldataload(add(_pubSignals, 224)))

            checkField(calldataload(add(_pubSignals, 256)))

            checkField(calldataload(add(_pubSignals, 288)))

            checkField(calldataload(add(_pubSignals, 320)))

            checkField(calldataload(add(_pubSignals, 352)))

            checkField(calldataload(add(_pubSignals, 384)))

            checkField(calldataload(add(_pubSignals, 416)))

            checkField(calldataload(add(_pubSignals, 448)))

            checkField(calldataload(add(_pubSignals, 480)))

            checkField(calldataload(add(_pubSignals, 512)))

            checkField(calldataload(add(_pubSignals, 544)))

            checkField(calldataload(add(_pubSignals, 576)))

            checkField(calldataload(add(_pubSignals, 608)))

            checkField(calldataload(add(_pubSignals, 640)))

            checkField(calldataload(add(_pubSignals, 672)))

            checkField(calldataload(add(_pubSignals, 704)))

            checkField(calldataload(add(_pubSignals, 736)))

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
            return(0, 0x20)
        }
    }
}
