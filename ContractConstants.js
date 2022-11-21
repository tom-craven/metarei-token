const Web3 = require("web3");
const TOKEN_NAME = 'Metarei';
const TOKEN_SYMBOL = 'MRI';
const TOKEN_SUPPLY = 2100000000000000;
const UNLOCKS = [1798491600, 1766955600, 1735419600, 1703797200, 1672261200, 1640725200, 1638972823];
const BASE = 8;
const BASE_1 = 7;
const PRIVATE_SALE_ONE = Web3.utils.toBN(TOKEN_SUPPLY).div(Web3.utils.toBN(2));
const TOKEN_BOUGHT = 700;

const COST_ONE_TOKEN = Web3.utils.toWei("0.000181818", "ether")
const ONE_TOKEN = 100000000;
const COST_ONE_TOKEN_FRACTION = COST_ONE_TOKEN / ONE_TOKEN;
const COST_TOTAL = Web3.utils.toBN(COST_ONE_TOKEN_FRACTION).mul(toMajorUnit(Web3.utils.toBN(TOKEN_BOUGHT)));
const BURN_FR = 160;
const PASS_PHRASE = "Hello World"

const SALE_PERCENTAGE = 51;
const SALE_PRIVATE_PERCENTAGE = 31
const SALE_PUBLIC_PERCENTAGE = 31;
const SALE_LISTING_PERCENTAGE = 3;
const SALE_LP_PERCENTAGE = 30;

const DEV_PERCENTAGE = 21;
const RESERVE_PERCENTAGE = 12;
const COMMUNITY_PERCENTAGE = 8;
const TEAM_PERCENTAGE = 5;
const MARKETING_PERCENTAGE = 3;



const AMOUNT_BOUGHT = Web3.utils.toBN(700);

function toMinorUnit(number) {
    return number > 0 ? number.div(Web3.utils.toBN(ONE_TOKEN)) : number;
}

function toMajorUnit(number) {
    return number > 0 ? number.mul(Web3.utils.toBN(ONE_TOKEN)) : number;
}


module.exports = {
    AMOUNT_BOUGHT,
    SALE_PERCENTAGE,
    SALE_PRIVATE_PERCENTAGE,
    SALE_PUBLIC_PERCENTAGE,
    SALE_LISTING_PERCENTAGE,
    SALE_LP_PERCENTAGE,
    DEV_PERCENTAGE,
    RESERVE_PERCENTAGE,
    COMMUNITY_PERCENTAGE,
    TEAM_PERCENTAGE,
    MARKETING_PERCENTAGE,
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_SUPPLY,
    PRIVATE_SALE_ONE,
    TOKEN_BOUGHT,
    COST_ONE_TOKEN_FRACTION,
    COST_ONE_TOKEN,
    COST_TOTAL,
    ONE_TOKEN,
    UNLOCKS,
    BASE,
    BASE_1,
    BURN_FR,
    PASS_PHRASE,
    toMinorUnit,
    toMajorUnit
};
