const {TOKEN_NAME, TOKEN_SYMBOL, TOKEN_SUPPLY, UNLOCKS, COST_ONE_TOKEN_FRACTION} = require("../ContractConstants");
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
                })
        });
};



