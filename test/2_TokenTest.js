const {
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_SUPPLY,
    PRIVATE_SALE_ONE,
    UNLOCKS, ONE_TOKEN, BURN_FR,
} = require("../ContractConstants");
const Metarei = artifacts.require("Metarei");
const truffleAssert = require('truffle-assertions');
const Web3 = require("web3");

contract("Metarei", (accounts) => {
    let instance;
    const contract_owner = accounts[0];
    const contract_user = accounts[2];
    const contract_admin = accounts[1];

    const configAdmin = {
        from: contract_admin
    };
    const configOwner = {
        from: contract_owner
    };
    const configUser = {
        from: contract_user
    };

    /**
     * @development Test contract deploys successfully.
     */
    it('Should deploy smart contract', async () => {
        instance = await Metarei.deployed();
        console.log("[DEPLOYED] " + instance.address);
        assert(instance.address !== '', "contract failed to deploy");
    });

    /**
     * @development Test delegated transfers.
     */
    it('The admin can be changed', async () => {
        instance = await Metarei.deployed();
        let admin = await instance.addAdmin(contract_admin);
        assert(admin.logs[0].event === 'AdminChange', 'should be an AdminChange Event');
    });

    /**
     * @development Test RPS calls to totalSupply, name and symbol.
     */
    it('initialises the contract with correct metadata', async () => {
        instance = await Metarei.deployed();
        let name = await instance.name();
        assert(name === TOKEN_NAME, "then the token has the name");
        console.log("[NAME] " + name);
        let symbol = await instance.symbol();
        console.log("[TOKEN_SYMBOL] " + symbol);
        assert(symbol === TOKEN_SYMBOL, 'then the token has the symbol');
        let totalSupply = await instance.totalSupply();
        console.log("[TOKEN_SUPPLY] " + totalSupply);
        assert.equal(totalSupply, 0, 'The total supply is set');
        let cap = await instance.cap();
        console.log("[CAP] " + cap);
        assert.equal(cap, TOKEN_SUPPLY, 'The cap is set');
        let unlocks = await instance.unlocks(5);
        console.log("[UNLOCKS] " + unlocks);
        assert.equal(unlocks.toString(), Web3.utils.toBN(UNLOCKS[5]).toString(), 'The unlocks are set');
    });

    /**
     * @development Test Token Minting.
     */
    it('Can mint tokens', async () => {
        instance = await Metarei.deployed();
        let totalSupply = await instance.totalSupply();
        const minted = await instance.mint(configAdmin);
        console.log("[MINTED] " + JSON.stringify(minted))
        assert.equal(minted.logs.length, 2, 'then trigger one event');
        let adminBalance = await instance.balanceOf(contract_admin);
        console.log("[BALANCE] " + adminBalance);
        assert.equal(minted.logs[0].args.value, ((TOKEN_SUPPLY - totalSupply) / 2), 'should have mined the first unlock');
        await truffleAssert.fails(instance.mint());
    })

    /**
     * @development Test Token Burning.
     */
    it('Burns tokens', async () => {
        instance = await Metarei.deployed();
        let burned = await instance.burn(ONE_TOKEN, configAdmin);
        console.log("[EXPECTS BURNED] " + ONE_TOKEN)
        assert.equal(burned.logs.length, 1, 'then trigger one event');
        assert(burned.logs[0].event === 'Transfer', 'should be a Transfer Event');
        assert(burned.logs[0].args.to === '0x0000000000000000000000000000000000000000', 'Should sent the tokens to a black hole');
        let totalSupply = await instance.totalSupply();
        console.log("[TOTAL SUPPLY] " + totalSupply)
        assert.equal(PRIVATE_SALE_ONE - ONE_TOKEN, totalSupply, 'total supply tracks burned tokens');
    })

    /**
     * @development Transfers tokens.
     */
    it('should transfer tokens', async () => {
        instance = await Metarei.deployed();
        await truffleAssert.passes(instance.transfer.call(accounts[1], ONE_TOKEN, configAdmin));
        let startBalance = await instance.balanceOf(contract_admin);
        let transfer = await instance.transfer(contract_user, ONE_TOKEN, configAdmin)
        assert.equal(transfer.logs.length, 2, 'then trigger two event');
        assert(transfer.logs[0].event === 'Transfer', 'should be a Transfer Event');
        assert(transfer.logs[0].args.from === contract_admin, 'should log the sender');
        assert(transfer.logs[1].args.to === contract_user, 'should log the receiver');
        let taxed = ONE_TOKEN / BURN_FR;
        let expected = ONE_TOKEN - taxed;
        assert.equal(transfer.logs[1].args.value, expected, 'should log the number of tokens sent');
        let receiver = await instance.balanceOf(contract_user);
        assert.equal(receiver, expected, 'then transfers the tokens to the receivers');
        let endBalance = await instance.balanceOf(contract_admin);
        let balance = startBalance - ONE_TOKEN;
        assert.equal(endBalance, balance, 'then transfers the tokens to the receivers');
    })

    /**
     * @development Test Delegated transfer approval
     */
    it('approves tokens for delegated transfer', async () => {
        instance = await Metarei.deployed();
        await truffleAssert.passes(instance.approve.call(contract_user, ONE_TOKEN));
        let approve = await instance.approve(contract_user, ONE_TOKEN, configAdmin);
        assert.equal(approve.logs.length, 1, 'then trigger one event');
        assert.equal(approve.logs[0].event, 'Approval', 'should be a Approval Event');
        assert.equal(approve.logs[0].args.owner, contract_admin, 'should log the  account that authorises the tokens');
        assert.equal(approve.logs[0].args.spender, contract_user, 'should log the account the tokens are authorised to');
        assert.equal(approve.logs[0].args.value, ONE_TOKEN, 'should log the amount being transferred');
        let allowance = await instance.allowance(contract_admin, contract_user);
        assert.equal(allowance.toNumber(), ONE_TOKEN, 'stores allowance for  delegated transfer');
    })

    /**
     * @development Test delegated transfers.
     */
    it('executes delegated transfers', async () => {
        instance = await Metarei.deployed();
        let fromAccount = accounts[2];
        let toAccount = accounts[3];
        let spenderAccount = accounts[4];
        await truffleAssert.passes(instance.transfer(fromAccount, 100, configAdmin));
        let approval = await instance.approve(spenderAccount, 100, {from: fromAccount});
        assert.equal(approval.logs.length, 1, 'then trigger one event');
        assert.equal(approval.logs[0].event, 'Approval', 'should be a Approval Event');
        await truffleAssert.fails(instance.transferFrom(fromAccount, toAccount, 9999, {from: spenderAccount}), truffleAssert.ErrorType.REVERT);
        let transfer = await instance.transferFrom(fromAccount, toAccount, 10, {from: spenderAccount});
        assert.equal(transfer.logs[1].args.spender, spenderAccount, 'should log the account the tokens are authorised to');
        assert.equal(transfer.logs.length, 2, 'then trigger two event');
    })

    /**
     * @development Test setting the fee.
     */
    it('executes setting the fee', async () => {
        instance = await Metarei.deployed();
        await truffleAssert.passes(instance.burnFraction(100, configAdmin));
        let burnedFraction = await instance.burnedFraction();
        assert.equal(burnedFraction.toString(), '100', 'the burned fraction is set');
        await truffleAssert.passes(instance.burnFraction(160, configAdmin));
    })

    /**
     * @development Test delegated transfers.
     */
    it('Cannot transfer to this contract', async () => {
        instance = await Metarei.deployed();
        await truffleAssert.fails(instance.transfer(Metarei.address, ONE_TOKEN, configAdmin));
    })
    /**
     * @development Test delegated transfers.
     */
    it('Tracks the amount burned', async () => {
        instance = await Metarei.deployed();
        let burned = await instance.burnedAmount();
        console.log("[ACTUAL BURN] " + burned)
        assert(burned > 0, 'is tracking the burned amount');
    })

    /**
     * @development Test ownership changed.
     */
    it('The owner can be changed', async () => {
        instance = await Metarei.deployed();
        await truffleAssert.passes(instance.transferOwnership(contract_user));
        await truffleAssert.passes(instance.acceptOwnership(configUser));
        let owner = await instance.owner();
        console.log("[OWNER] " + owner + "[OWNER]" + contract_user)
        assert.equal(owner, contract_user, "the owner didnt change");
        await truffleAssert.passes(instance.transferOwnership(contract_owner, configUser));
        await truffleAssert.passes(instance.acceptOwnership(configOwner));
        let owner2 = await instance.owner();
        assert.equal(owner2, contract_owner, "the owner didnt change");
    });
});







