const {
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_SUPPLY,
    UNLOCKS,
    COST_ONE_TOKEN_FRACTION,
    BURN_FR,
    ONE_TOKEN, PASS_PHRASE, COST_TOTAL, DEV_PERCENTAGE, RESERVE_PERCENTAGE, COMMUNITY_PERCENTAGE, TEAM_PERCENTAGE,
    MARKETING_PERCENTAGE, SALE_LP_PERCENTAGE, SALE_PRIVATE_PERCENTAGE, SALE_PUBLIC_PERCENTAGE, SALE_LISTING_PERCENTAGE,
    TOKEN_BOUGHT, toMajorUnit
} = require("../ContractConstants");
const assert = require("assert");
const truffleAssert = require("truffle-assertions");
const Web3 = require("web3");
const Metarei = artifacts.require("Metarei");
const MetareiSale = artifacts.require("MetareiSale");

module.exports = function (deployer, network, accounts) {

    deployer.deploy(Metarei, TOKEN_NAME, TOKEN_SYMBOL, TOKEN_SUPPLY, UNLOCKS)
        .catch(function (error) {
            console.log("error: " + error)
        })
        .then(function () {
            return deployer.deploy(MetareiSale, Metarei.address, COST_ONE_TOKEN_FRACTION)
                .catch(function (error) {
                    console.log("error: " + error)
                }).then(async function () {
                    let tokenInstance;
                    let tokenSaleInstance;

                    const address_admin = accounts[1];
                    const address_development = accounts[2];
                    const address_reserve = accounts[3];
                    const address_community = accounts[4];
                    const address_team = accounts[5];
                    const address_marketing = accounts[6];
                    const address_liquidity = accounts[7];
                    const address_listing = accounts[8];
                    const address_pub_sale = accounts[9];

                    const customer = accounts[11];

                    const configAdmin = {
                        from: address_admin
                    };

                    const BuyConfig = {
                        value: COST_TOTAL,
                        from: customer
                    };

                    /**
                     * @development Test contract deploys successfully.
                     */

                    tokenInstance = await Metarei.deployed();
                    tokenSaleInstance = await MetareiSale.deployed();
                    console.log("[DEPLOYED TOKEN] " + tokenInstance.address);
                    console.log("[DEPLOYED SALE] " + tokenSaleInstance.address);
                    assert(tokenInstance.address !== '', "token failed to deploy");
                    assert(tokenSaleInstance.address !== '', "sale failed to deploy");

                    /**
                     * @development Creating the admin account permissions
                     */
                    let saleAdmin = await tokenSaleInstance.addAdmin(address_admin);
                    assert(saleAdmin.logs[0].event === 'AdminChange', 'should be an AdminChange Event');
                    let tokenAdmin = await tokenInstance.addAdmin(address_admin);
                    assert(tokenAdmin.logs[0].event === 'AdminChange', 'should be an AdminChange Event');

                    /**
                     * @development Set the access Code.
                     */

                    const bytes32 = Web3.utils.asciiToHex(PASS_PHRASE);
                    let passphrase = web3.eth.abi.encodeParameter('bytes32', Web3.utils.soliditySha3({
                        type: 'bytes32',
                        value: bytes32
                    }));
                    await truffleAssert.passes(tokenSaleInstance.setCode(passphrase, configAdmin));

                    /**
                     * @development Minting the first unlock.
                     */
                    let totalSupply = await tokenInstance.totalSupply();
                    const minted = await tokenInstance.mint({
                        from: address_admin
                    });

                    assert.equal(minted.logs.length, 2, 'then trigger two events');
                    let halvingOneBalance = Web3.utils.toBN(await tokenInstance.balanceOf(address_admin));
                    console.log("[MINTED] " + toMRI(halvingOneBalance));
                    assert.equal(minted.logs[0].args.value, ((TOKEN_SUPPLY - totalSupply) / 2), 'should have mined the first unlock');

                    /**
                     * @development sending the development budget.
                     */
                    await calculateShare("DEV", halvingOneBalance, address_development, DEV_PERCENTAGE);
                    /**
                     * @development sending the development budget.
                     */
                    await calculateShare("RESERVE", halvingOneBalance, address_reserve, RESERVE_PERCENTAGE);
                    /**
                     * @development sending the development budget.
                     */
                    await calculateShare("COMMUNITY", halvingOneBalance, address_community, COMMUNITY_PERCENTAGE);
                    /**
                     * @development sending the development budget.
                     */
                    await calculateShare("TEAM", halvingOneBalance, address_team, TEAM_PERCENTAGE);
                    /**
                     * @development sending the development budget.
                     */
                    await calculateShare("MARKETING", halvingOneBalance, address_marketing, MARKETING_PERCENTAGE);

                    /**
                     * @development Ready the sale contract.
                     */
                    let isActive = await tokenSaleInstance.isActive();
                    console.log("[SALE_IS_ACTIVE] " + isActive);
                    assert.equal(isActive, false, 'the sale is initially disabled');

                    /**
                     * @development sending the Sale allocation.
                     */
                    let saleShar = Web3.utils.toBN(halvingOneBalance).div(Web3.utils.toBN(100)).mul(Web3.utils.toBN(51));

                    /**
                     * @development sending the liquidity allocation.
                     */
                    await calculateShare("LIQUIDITY", saleShar, address_liquidity, SALE_LP_PERCENTAGE);
                    /**
                     * @development sending the Stealth allocation.
                     */
                    await calculateShare("STEALTH", saleShar, tokenSaleInstance.address, SALE_PRIVATE_PERCENTAGE);
                    /**
                     * @development sending the Public allocation.
                     */
                    await calculateShare("PUBLIC", saleShar, address_pub_sale, SALE_PUBLIC_PERCENTAGE);
                    /**
                     * @development sending the Listing allocation.
                     */
                    await calculateShare("LISTING", saleShar, address_listing, SALE_LISTING_PERCENTAGE);

                    /**
                     * @development Track how much was burned.
                     */
                    let burned = await tokenInstance.burnedAmount();
                    console.log("[ACTUAL BURN] " + toMRI(burned));


                    let remainingBalance = Web3.utils.toBN(await tokenInstance.balanceOf(address_admin));
                    console.log("[REMAINING] " + toMRI(remainingBalance));

                    /**
                     * @development Negative tests.
                     * The sale is disabled.
                     * Nobody else can withdraw the sale
                     * Nobody else can set the price.
                     * Nobidy else can change the burned fraction
                     */
                    await truffleAssert.fails(tokenSaleInstance.buyToken(TOKEN_BOUGHT, true, Web3.utils.asciiToHex("Truffle"), BuyConfig));
                    await truffleAssert.fails(tokenSaleInstance.withdrawSale({from: customer}));
                    await truffleAssert.fails(tokenSaleInstance.setPrice(Web3.utils.toBN("1000000"), {from: customer}));
                    await truffleAssert.fails(tokenSaleInstance.withdrawBalance({from: customer}));
                    await truffleAssert.fails(tokenInstance.burnFraction(0, {from: customer}));

                    /**
                     * @development Starting the sale.
                     */

                    await truffleAssert.passes(tokenSaleInstance.setActive(true, configAdmin));
                    await truffleAssert.passes(tokenSaleInstance.buyToken(toMajorUnit(web3.utils.toBN(TOKEN_BOUGHT)), true, Web3.utils.asciiToHex(PASS_PHRASE), BuyConfig));
                    console.log("[BUY TOKEN] OK");
                    let afterSaleBalance = Web3.utils.toBN(await tokenInstance.balanceOf(tokenSaleInstance.address));
                    console.log("[AFTER SALE] " + toMRI(afterSaleBalance));
                    let consumerBalance = Web3.utils.toBN(await tokenInstance.balanceOf(customer));
                    console.log("[CONSUMER BAL] " + toMRI(consumerBalance));

                    async function calculateShare(name, balance, address, percentage) {
                        let shareAllocated = (balance.div(Web3.utils.toBN(100)).mul(Web3.utils.toBN(percentage)));
                        await truffleAssert.passes(tokenInstance.transfer(address, shareAllocated, configAdmin));
                        let shareAfterTax = shareAllocated.sub(Web3.utils.toBN(shareAllocated.div(Web3.utils.toBN(BURN_FR))));
                        let balanceReceived = Web3.utils.toBN(await tokenInstance.balanceOf(address));
                        console.log("[" + name + "_BALANCE] " + toMRI(balanceReceived));
                        assert.equal(balanceReceived.toString(), shareAfterTax.toString(), 'should have sent the ' + name + ' budget');
                    }

                    function toMRI(fraction) {
                        return fraction.div(Web3.utils.toBN(ONE_TOKEN)).toString();
                    }

                    /**
                     * ENDS
                     */
                }).catch(reason => {
                    console.log(reason)
                })
        });
};



