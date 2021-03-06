// This way of importing is a bit funky. We should fix this in the Mock Contracts package
import {MockTokenFactory} from "@pie-dao/mock-contracts/dist/typechain/MockTokenFactory";
import {MockToken} from "@pie-dao/mock-contracts/typechain/MockToken";
import {ethers, run, deployments, ethereum} from "@nomiclabs/buidler";
import {Signer, Wallet, utils, constants} from "ethers";
import {BigNumber} from "ethers/utils";
import chai from "chai";
import {deployContract, solidity} from "ethereum-waffle";

import {deployBalancerPool, TimeTraveler} from "../utils";
import {IbPool} from "../typechain/IbPool";
import {IbPoolFactory} from "../typechain/IbPoolFactory";
import {Pv2SmartPoolFactory} from "../typechain/Pv2SmartPoolFactory";
import {Pv2SmartPool} from "../typechain/Pv2SmartPool";
// import PV2SmartPoolArtifact from "../artifacts/PV2SmartPool.json";

chai.use(solidity);
const {expect} = chai;

const PLACE_HOLDER_ADDRESS = "0x0000000000000000000000000000000000000001";
const NAME = "TEST POOL";
const SYMBOL = "TPL";
const INITIAL_SUPPLY = constants.WeiPerEther.mul(1);
// const INITIAL_TOKEN_SUPPLY = constants.WeiPerEther.mul(constants.WeiPerEther.mul(100));
const INITIAL_TOKEN_SUPPLY = constants.WeiPerEther.mul(100);
let tokenFactory: MockTokenFactory;
const timeTraveler = new TimeTraveler(ethereum);

describe("Basic Pool Functionality", function () {
  this.timeout(300000);
  let signers: Signer[];
  let account: string;
  let account2: string;
  let tokens: MockToken[];
  let pool: IbPool;
  let smartpool: Pv2SmartPool;

  beforeEach(async () => {

    signers = await ethers.signers();
    account = await signers[0].getAddress();
    account2 = await signers[1].getAddress();
    
    pool = IbPoolFactory.connect(await deployBalancerPool(signers[0]), signers[0]);
    tokenFactory = new MockTokenFactory(signers[0]);
    tokens = [];
    for (let i = 0; i < 1; i++) {
      const token: MockToken = await tokenFactory.deploy(`Mock ${i}`, `M${i}`, 18);

      // console.log("hahaha token addresss is: ", token.address.toString());

      await token.mint(account, INITIAL_TOKEN_SUPPLY);
      // await token.mint(await signers[1].getAddress(), constants.WeiPerEther.mul(100));

      const userBalance = await token.balanceOf(account)
      console.log("Token ",token.address.toString()," balance of account is: ",userBalance.toString());

      const userBalance2 = await token.balanceOf(account2)
      console.log("Token ",token.address.toString()," balance of account is: ",userBalance2.toString());


      await token.approve(pool.address, constants.MaxUint256);
      pool.bind(token.address, constants.WeiPerEther, constants.WeiPerEther.mul(2));
      tokens.push(token);
    }

    // for (const token of tokens) {
    //   console.log("token address is: ",token.address.toString());
    //   console.log("token name is: ",(await token.name()).toString());
    //   console.log("token balance of account is: ",(await token.balanceOf(account)).toString());
    //   console.log("token balance of account2 is: ",(await token.balanceOf(account2)).toString());
    //   console.log("----------------------------------------------------------------------")
    // }

    smartpool = (await run("deploy-libraries-and-smartpool")) as Pv2SmartPool;

    await smartpool.init(pool.address, NAME, SYMBOL, INITIAL_SUPPLY);
    await smartpool.approveTokens();

    await pool.setController(smartpool.address);
    console.log("----------------------------------------------------------------------")
    console.log("----------------------------------------------------------------------")
    console.log("----------------------------------------------------------------------")

    for (const token of tokens) {
      await token.approve(smartpool.address, constants.MaxUint256);
      
      // console.log("token ",(await token.name()).toString()," address is: ",token.address.toString());
      // Attach alt signer to token and approve pool
      await MockTokenFactory.connect(token.address, signers[1]).approve(
        smartpool.address,
        constants.MaxUint256
      );

      const n = await token.allowance(token.address, smartpool.address);
      console.log("allowance of ",token.address, "      ",smartpool.address, "     is: ",n.toString());

      const n2 = await token.allowance(account, smartpool.address);
      console.log("allowance of ",account, "      ",smartpool.address, "     is: ",n2.toString());

      const n3 = await token.allowance(account, pool.address);
      console.log("allowance of ",account, "      ",pool.address, "     is: ",n3.toString());
    }

    

    // Set cap to max to pass tests
    await smartpool.setCap(ethers.constants.MaxUint256);
    // Enable entry and exit for tests
    await smartpool.setJoinExitEnabled(true);
    // await timeTraveler.snapshot();
    console.log("Before Each case, the initial Pv2SmartPool address is :",smartpool.address);
    console.log("account address is: ",account);
    console.log("account2 address is: ",account2);
    const balance = await smartpool.balanceOf(account);
    console.log("SmartPool ",smartpool.address, " balance of ",account," is: ",balance.toString());

    const balance2 = await smartpool.balanceOf(account2);
    console.log("SmartPool ",smartpool.address, "balance of ",account2," is: ",balance2.toString());
    console.log("----------------------------------------------------------------------")


    console.log("at the begining the token balance is: ")
    for (let entry of tokens) {
      const userBalance = await entry.balanceOf(account);
      console.log("token ",entry.address, " account ",account," is ", userBalance.toString());

      const userBalance2 = await entry.balanceOf(account2);
      console.log("token ",entry.address, " account2 ",account2," is ", userBalance2.toString());

      const userBalance3 = await entry.balanceOf(smartpool.address)
      console.log("token ",entry.address, " smartpool ",smartpool.address," is ", userBalance3.toString());

      const userBalance4 = await entry.balanceOf(pool.address)
      console.log("token ",entry.address, " pool ",pool.address," is ", userBalance4.toString());
      
    }

    
    const spAll = await smartpool.allowance(pool.address,account);
    console.log("smartPool allowance of ",pool.address, "      ",account, "     is: ",spAll.toString());


    console.log("----------------------------- Initialized Finished -----------------------------------------")



  });

  // beforeEach(async() => {
  //   await timeTraveler.snapshot();
  // })

  // afterEach(async() => {
  //   await timeTraveler.revertSnapshot();
  // });

  describe("init", async () => {

    // 第一个测试用例，测试smartpool里面的tokens集合。目前测试用的是7个代币
    // it("Case1：Tokens & ActualTokens", async () => {
    //   const actualTokens = await smartpool.getTokens();
    //   const tokenAddresses = tokens.map((token) => token.address);

    //   console.log("Tokens is as below: ");
    //   console.log("----------------------------------------------------------------------")

    //   for (const token of tokens) {
    //     console.log("token name is: ", await token.name());
    //     console.log("token symbol is: ",await token.symbol());
    //     console.log("token address is: ",token.address);
    //   }

    //   console.log("Actual Tokens is as below: ");
    //   console.log("----------------------------------------------------------------------")
    //   for (const token of actualTokens) {
    //     console.log("actual token is: ", token.toString());
    //   }

    //   expect(actualTokens).eql(tokenAddresses);
    // });




    // 第二个测试用例，用来测试关于Pv2SmartPool的核心设置
    // it("Case2：Pv2SmartPool", async () => {
    //   console.log("----------------------------------------------------------------------");
    //   console.log("log for case 'test for Pv2SmartPool'");
    //   console.log("Pv2SmartPool address is :",smartpool.address);
    //   console.log("account is: ",account);
    //   console.log("account2 is: ",account2);

    //   const actualTokens = await smartpool.getTokens();
    //   console.log("Actual Tokens is as below: ");
    //   console.log("----------------------------------------------------------------------")
    //   for (const token of actualTokens) {
    //     console.log("actual token is: ", token.toString());
    //   }

    //   const name = await smartpool.name();
    //   console.log("Pv2SmartPool name is: ",name);
    //   expect(name).to.eq(NAME);


    //   const symbol = await smartpool.symbol();
    //   console.log("Pv2SmartPool symbol is: ",symbol);
    //   expect(symbol).to.eq(SYMBOL);

    //   const initialSupply = await smartpool.totalSupply();
    //   console.log("Pv2SmartPool initialSupply is： ",initialSupply.toString());
    //   expect(initialSupply).to.eq(INITIAL_SUPPLY);

    //   const controller = await smartpool.getController();
    //   console.log("Pv2SmartPool Controller is: ",controller.toString());
    //   expect(controller).to.eq(account);

    //   const publicSwapSetter = await smartpool.getPublicSwapSetter();
    //   console.log("publicSwapSetter is: ",publicSwapSetter);
    //   expect(publicSwapSetter).to.eq(account);

    //   const tokenBinder = await smartpool.getTokenBinder();
    //   console.log("tokenBinder is: ",tokenBinder);
    //   expect(tokenBinder).to.eq(account);

    //   const bPool = await smartpool.getBPool();
    //   console.log("bPool is: ",bPool);
    //   expect(bPool).to.eq(pool.address);

    //   const SwapFee = await smartpool.getSwapFee();
    //   console.log("swapFee is： ",SwapFee.toString());

    //   //测试calTokensForAmount，输入amount，计算能给出多少tokens。预设的是除以2，所以
    //   //输入0.5的数量，返回应该是0.25
    //   //输入0.123的数量，返回应该是0.0615

    //   //下面测试输入0.5
    //   const amountAndTokens = await smartpool.calcTokensForAmount(constants.WeiPerEther.div(2));

    //   const tokenAddresses = tokens.map((token) => token.address);
    //   const expectedAmounts = tokens.map(() => constants.WeiPerEther.div(4));

    //   // expect(amountAndTokens.tokens).to.eql(tokenAddresses);
    //   // expect(amountAndTokens.amounts).to.eql(expectedAmounts);

    //   console.log(tokenAddresses.toString());
    //   console.log(expectedAmounts.toString());

    //   console.log(amountAndTokens.tokens);
    //   console.log(amountAndTokens.amounts.toString());

    //   //下面测试输入0.123
    //   const testNum = new BigNumber("123000000000000000");
    //   const amountAndTokens2 = await smartpool.calcTokensForAmount(testNum);

    //   console.log(amountAndTokens2.tokens);
    //   console.log(amountAndTokens2.amounts.toString());
    // }); //end of Case2：Pv2SmartPool





    // it("Token symbol should be correct", async () => {
    //   const name = await smartpool.name();
    //   console.log("Pv2SmartPool name is: ",name);
    //   console.log("NAME is: ",NAME.toString());
    //   expect(name).to.eq(NAME);
    // });

    // it("Token name should be correct", async () => {
    //   const symbol = await smartpool.symbol();
    //   expect(symbol).to.eq(SYMBOL);
    // });
    // it("Initial supply should be correct", async () => {
    //   const initialSupply = await smartpool.totalSupply();
    //   expect(initialSupply).to.eq(INITIAL_SUPPLY);
    // });
    // it("Controller should be correctly set", async () => {
    //   const controller = await smartpool.getController();
    //   expect(controller).to.eq(account);
    // });
    // it("Public swap setter should be correctly set", async () => {
    //   const publicSwapSetter = await smartpool.getPublicSwapSetter();
    //   expect(publicSwapSetter).to.eq(account);
    // });
    // it("Token binder should be correctly set", async () => {
    //   const tokenBinder = await smartpool.getTokenBinder();
    //   expect(tokenBinder).to.eq(account);
    // });
    // it("bPool should be correctly set", async () => {
    //   const bPool = await smartpool.getBPool();
    //   expect(bPool).to.eq(pool.address);
    // });
    // it("Tokens should be correctly set", async () => {
    //   const actualTokens = await smartpool.getTokens();
    //   const tokenAddresses = tokens.map((token) => token.address);
    //   expect(actualTokens).eql(tokenAddresses);
    // });
    // it("calcTokensForAmount should work", async () => {
    //   const amountAndTokens = await smartpool.calcTokensForAmount(constants.WeiPerEther);
    //   const tokenAddresses = tokens.map((token) => token.address);
    //   const expectedAmounts = tokens.map(() => constants.WeiPerEther.div(2));
    //   expect(amountAndTokens.tokens).to.eql(tokenAddresses);
    //   expect(amountAndTokens.amounts).to.eql(expectedAmounts);
    // });
    // it("Calling init when already initialized should fail", async () => {
    //   await expect(
    //     smartpool.init(PLACE_HOLDER_ADDRESS, NAME, SYMBOL, constants.WeiPerEther)
    //   ).to.be.revertedWith("PV2SmartPool.init: already initialised");
    // });
    // it("Smart pool should not hold any non balancer pool tokens after init", async () => {
    //   const smartPoolBalances = await getTokenBalances(smartpool.address);
    //   expectZero(smartPoolBalances);
    // });
  });

  describe("Controller functions", async () => {
    // it("Case1: Setting a new controller should work", async () => {
    //   const controllerBefore = await smartpool.getController();
    //   console.log("controllerBefore is : ",controllerBefore.toString());

    //   await smartpool.setController(account2);

    //   const controllerAfter = await smartpool.getController();
    //   console.log("controllerAfter is : ",controllerAfter.toString());
    //   expect(controllerAfter).to.eq(account2);


    //   smartpool = smartpool.connect(signers[0]);

    //   await expect(smartpool.setController(account)).to.be.revertedWith(
    //     "PV2SmartPool.onlyController: not controller");


    //   smartpool = smartpool.connect(signers[1]);
    //   await smartpool.setController(account);

    //   const controllerAfterAfter = await smartpool.getController();
    //   console.log("controllerAfterAfter is : ",controllerAfterAfter.toString());
    // });

    // it("Case2: Setting a new controller should work", async () => {
    //   await smartpool.setController(account2);

    //   console.log("----------------------------------------------------------------------");
    //   console.log("Case 1");
    //   console.log("account2 address is: ",account2);

    //   const controller = await smartpool.getController();
    //   console.log("smartpool controller is : ",controller.toString());
    //   expect(controller).to.eq(account2);
    // });

    // it("Setting a new controller from a non controller address should fail", async () => {
    //   smartpool = smartpool.connect(signers[1]);

    //   await expect(smartpool.setController(account)).to.be.revertedWith(
    //     "PV2SmartPool.onlyController: not controller"
    //   );

    //   await expect(smartpool.setController(account2)).to.be.revertedWith(
    //     "PV2SmartPool.onlyController: not controller"
    //   );
    // });

    // it("Setting public swap setter should work", async () => {
    //   await smartpool.setPublicSwapSetter(account);
    //   const publicSwapSetter = await smartpool.getPublicSwapSetter();
    //   console.log("publicSwapSetter is: ",publicSwapSetter.toString());

    //   expect(publicSwapSetter).to.eq(account);
    // });

    // it("Setting public swap setter from a non controller address should fail", async () => {
    //   smartpool = smartpool.connect(signers[1]);

    //   await expect(smartpool.setPublicSwapSetter(account)).to.be.revertedWith(
    //     "PV2SmartPool.onlyController: not controller"
    //   );

    //   await expect(smartpool.setPublicSwapSetter(account2)).to.be.revertedWith(
    //     "PV2SmartPool.onlyController: not controller"
    //   );
    // });



    // it("Setting the token binder should work", async () => {
    //   await smartpool.setTokenBinder(PLACE_HOLDER_ADDRESS);
      
    //   const tokenBinder = await smartpool.getTokenBinder();
    //   console.log("tokenBinder address is : ",tokenBinder);

    //   expect(tokenBinder).to.eq(PLACE_HOLDER_ADDRESS);
    // });


    // it("Setting the token binder from a non controller address should fail", async () => {
    //   smartpool = smartpool.connect(signers[1]);
    //   await expect(smartpool.setTokenBinder(PLACE_HOLDER_ADDRESS)).to.be.revertedWith(
    //     "PV2SmartPool.onlyController: not controller"
    //   );
    // });

    // it("Case2: Get Controller Information", async () => {
      

    //   console.log("----------------------------------------------------------------------");
    //   console.log("Case 2");
      

    //   const controller = await smartpool.getController();
    //   console.log("Controller address is: ",controller);

    //   const publicSwapSetter = await smartpool.getPublicSwapSetter();
    //   console.log("publicSwapSetter is: ",publicSwapSetter.toString());

    //   const tokenBinder = await smartpool.getTokenBinder();
    //   console.log("tokenBinder address is : ",tokenBinder);
      
    //   const publicSwap = await smartpool.isPublicSwap();
    //   console.log("publicSwap is: ",publicSwap);

    //   const swapFee = await smartpool.getSwapFee();
    //   console.log("swapFee is: ",swapFee.toString());

    //   const feeValue = constants.WeiPerEther.div(33);
    //   await smartpool.setSwapFee(feeValue);
    //   const swapFee2 = await smartpool.getSwapFee();
    //   console.log("new swapFee is: ",swapFee2.toString());
    //   expect(swapFee2).to.eq(feeValue);

    // });

    // it("Setting public swap should work", async () => {
    //   await smartpool.setPublicSwap(true);
    //   const publicSwap = await smartpool.isPublicSwap();
      
    //   console.log("publicSwap is: ",publicSwap);
    //   expect(publicSwap).to.be.true;
    // });

  //   it("Setting public swap from a non publicSwapSetter address should fail", async () => {
  //     smartpool = smartpool.connect(signers[1]);
  //     await expect(smartpool.setPublicSwap(true)).to.be.revertedWith(
  //       "PV2SmartPool.onlyPublicSwapSetter: not public swap setter"
  //     );
  //   });
    // it("Setting the swap fee should work", async () => {
    //   const feeValue = constants.WeiPerEther.div(33);
    //   await smartpool.setSwapFee(feeValue);
    //   const swapFee = await smartpool.getSwapFee();
    //   console.log("new swapFee is: ",swapFee.toString());
    //   expect(swapFee).to.eq(feeValue);
    // });
    // it("Setting the swap fee from a non controller address should fail", async () => {
    //   smartpool = smartpool.connect(signers[1]);
    //   await expect(smartpool.setSwapFee(constants.WeiPerEther.div(20))).to.be.revertedWith(
    //     "PV2SmartPool.onlyController: not controller"
    //   );
    // });
    // it("Should revert with unsupported function error when calling finalizePool()", async () => {
    //   smartpool = smartpool.connect(signers[1]);
    //   await expect(smartpool.finalizeSmartPool()).to.be.revertedWith(
    //     "PV2SmartPool.finalizeSmartPool: unsupported function"
    //   );
    // });
    // it("Should revert with unsupported function error when calling createPool(uint256 initialSupply)", async () => {
    //   smartpool = smartpool.connect(signers[1]);
    //   await expect(smartpool.createPool(0)).to.be.revertedWith(
    //     "PV2SmartPool.createPool: unsupported function"
    //   );
    // });
  }); //end of Controller functions

  describe("Joining and Exiting", async () => {

    // it("Case3: Get Joining and Exiting Information", async () => {
      

    //   console.log("----------------------------------------------------------------------");
    //   console.log("Case 3");
      



    // });



    it("Adding liquidity should work", async () => {
      console.log("smartpool.joinPool(2)");
      const mintAmount = constants.WeiPerEther.mul(2);
      await smartpool.joinPool(mintAmount);

      const balance = await smartpool.balanceOf(account);
      console.log ("SmartPool ", smartpool.address, " balance of account is: ",balance.toString());

      const balance2 = await smartpool.balanceOf(account2);
      console.log ("SmartPool ", smartpool.address, "balance of account2 is: ",balance2.toString());

      // console.log("mint amount.add is: ", mintAmount.add(INITIAL_SUPPLY).toString());

      for (let entry of tokens) {
        const userBalance = await entry.balanceOf(account);
        console.log("token ",entry.address, " account ",account," is ", userBalance.toString());

        const userBalance2 = await entry.balanceOf(account2);
        console.log("token ",entry.address, " account2 ",account2," is ", userBalance2.toString());

        const userBalance3 = await entry.balanceOf(smartpool.address)
        console.log("token ",entry.address, " smartpool ",smartpool.address," is ", userBalance3.toString());
        
        const userBalance4 = await entry.balanceOf(pool.address)
        console.log("token ",entry.address, " pool ",pool.address," is ", userBalance4.toString());
      };

      console.log("smartpool.joinPool(2) again");
      const mintAmount2 = constants.WeiPerEther.mul(2);
      await smartpool.joinPool(mintAmount2);

      const balance3 = await smartpool.balanceOf(account);
      console.log ("SmartPool ", smartpool.address, " balance of account is: ",balance3.toString());

      const balance4 = await smartpool.balanceOf(account2);
      console.log ("SmartPool ", smartpool.address, "balance of account2 is: ",balance4.toString());

      // console.log("mint amount.add is: ", mintAmount.add(INITIAL_SUPPLY).toString());

      for (let entry of tokens) {
        const userBalance = await entry.balanceOf(account);
        console.log("token ",entry.address, " account ",account," is ", userBalance.toString());

        const userBalance2 = await entry.balanceOf(account2);
        console.log("token ",entry.address, " account2 ",account2," is ", userBalance2.toString());

        const userBalance3 = await entry.balanceOf(smartpool.address)
        console.log("token ",entry.address, " smartpool ",smartpool.address," is ", userBalance3.toString());
        
        const userBalance4 = await entry.balanceOf(pool.address)
        console.log("token ",entry.address, " pool ",pool.address," is ", userBalance4.toString());
      }



    });


    // it("Adding liquidity when a transfer fails should fail", async () => {
    //   const mintAmount = constants.WeiPerEther;
    //   await tokens[1].approve(smartpool.address, constants.Zero);
    //   await expect(smartpool.joinPool(mintAmount)).to.be.revertedWith(
    //     "ERC20: transfer amount exceeds allowance"
    //   );
    // });
    // it("Adding liquidity when a token transfer returns false should fail", async () => {
    //   const mintAmount = constants.WeiPerEther.div(4);
    //   await tokens[1].setTransferFromReturnFalse(true);
    //   await expect(smartpool.joinPool(mintAmount)).to.be.revertedWith(
    //     "LibUnderlying._pullUnderlying: transferFrom failed"
    //   );
    // });
  //   it("Removing liquidity should work", async () => {
  //     const removeAmount = constants.WeiPerEther.div(2);

  //     await smartpool["exitPool(uint256)"](removeAmount);
  //     const balance = await smartpool.balanceOf(account);
  //     expect(balance).to.eq(INITIAL_SUPPLY.sub(removeAmount));

  //     for (let entry of tokens) {
  //       const userBalance = await entry.balanceOf(account)
  //       expect(userBalance).to.eq(INITIAL_TOKEN_SUPPLY.sub(removeAmount.div(2)));
  //     }
  //   });
  //   it("Removing all liquidity should fail", async () => {
  //     const removeAmount = constants.WeiPerEther;
  //     await expect(smartpool["exitPool(uint256)"](removeAmount)).to.be.revertedWith(
  //       "ERR_MIN_BALANCE"
  //     );
  //   });
  //   it("Removing liquidity should fail when removing more than balance", async () => {
  //     // First mint some more in another account to not withdraw all total liquidity in the actual test
  //     const altSignerSmartPool = Pv2SmartPoolFactory.connect(smartpool.address, signers[1]);
  //     await altSignerSmartPool.joinPool(constants.WeiPerEther);
  //     await expect(smartpool["exitPool(uint256)"](INITIAL_SUPPLY.add(1))).to.be.revertedWith(
  //       "ERR_INSUFFICIENT_BAL"
  //     );
    // }); 
  //   it("Removing liquidity when a token transfer fails should fail", async () => {
  //     await tokens[0].setTransferFailed(true);
  //     await expect(smartpool["exitPool(uint256)"](constants.WeiPerEther.div(2))).to.be.revertedWith(
  //       "MockToken.transfer: transferFrom set to fail"
  //     );
  //   });

  //   it("Removing liquidity when a token transfer returns false should fail", async () => {
  //     await tokens[0].setTransferReturnFalse(true);
  //     await expect(smartpool["exitPool(uint256)"](constants.WeiPerEther.div(2))).to.be.revertedWith(
  //       "ERR_ERC20_FALSE"
  //     );
  //   });

  //   it("Removing liquidity leaving a single token should work", async () => {
  //     const removeAmount = constants.WeiPerEther.div(2);

  //     await smartpool.exitPoolTakingloss(removeAmount, [tokens[0].address]);
  //     const balance = await smartpool.balanceOf(account);
  //     expect(balance).to.eq(INITIAL_SUPPLY.sub(removeAmount));

  //     const userBalance = await tokens[0].balanceOf(account)
  //     expect(userBalance).to.eq(INITIAL_TOKEN_SUPPLY.sub(removeAmount));
  //     for (let entry of tokens.slice(1)) {
  //       const userBalance = await entry.balanceOf(account)
  //       expect(userBalance).to.eq(INITIAL_TOKEN_SUPPLY.sub(removeAmount.div(2)));
  //     }
  //   });
  //   it("Removing all liquidity leaving a single token should fail", async () => {
  //     const removeAmount = constants.WeiPerEther;
  //     await expect(smartpool["exitPool(uint256)"](removeAmount)).to.be.revertedWith(
  //       "ERR_MIN_BALANCE"
  //     );
  //   });
  //   it("Removing liquidity leaving a single token should fail when removing more than balance", async () => {
  //     // First mint some more in another account to not withdraw all total liquidity in the actual test
  //     const altSignerSmartPool = Pv2SmartPoolFactory.connect(smartpool.address, signers[1]);
  //     await altSignerSmartPool.joinPool(constants.WeiPerEther);
  //     await expect(smartpool["exitPool(uint256)"](INITIAL_SUPPLY.add(1))).to.be.revertedWith(
  //       "ERR_INSUFFICIENT_BAL"
  //     );
  //   });

  //   it("Should fail to join with a single token if token is unbound", async () => {
  //     await smartpool.unbind(tokens[0].address);
  //     await smartpool.setPublicSwap(true);
  //     const mintAmount = constants.WeiPerEther;

  //     await expect(
  //       smartpool.joinswapExternAmountIn(tokens[0].address, mintAmount, ethers.constants.Zero)
  //     ).to.be.revertedWith("LibPoolEntryExit.joinswapExternAmountIn: Token Not Bound");
  //     await expect(
  //       smartpool.joinswapPoolAmountOut(tokens[0].address, mintAmount, ethers.constants.MaxUint256)
  //     ).to.be.revertedWith("LibPoolEntryExit.joinswapPoolAmountOut: Token Not Bound");
  //   });

    // it("joinswapPoolAmountOut should work", async () => {
    //   await smartpool.setPublicSwap(true);
    //   const mintAmount = constants.WeiPerEther.div(37);
    //   const inputToken = tokens[0];

    //   console.log("mintAmount before is: ",mintAmount.toString());
    //   console.log("inputToken ", (await inputToken.name()).toString() ," is : ",inputToken.address.toString());

    //   const userBalanceBefore = await inputToken.balanceOf(account);
      


    //   const userPoolBalanceBefore = await smartpool.balanceOf(account);

    //   const totalSupplyBefore = await smartpool.totalSupply();
      

    //   const expectedTokenAmountIn = await smartpool.calcSingleInGivenPoolOut(
    //     inputToken.address,
    //     mintAmount
    //   );
    //   const poolTokenBalanceBefore = await pool.getBalance(inputToken.address);
      
    //   console.log("mintAmount before is: ",mintAmount.toString());
    //   console.log("UserBalanceBefore is: ",userBalanceBefore.toString());
    //   console.log("userPoolBalanceBefore is: ",userPoolBalanceBefore.toString());
    //   console.log("totalSupplyBefore is: ",totalSupplyBefore.toString());
    //   console.log("poolTokenBalanceBefore is: ",poolTokenBalanceBefore.toString());
    //   console.log("----------------------------------------------------------------------");

    //   await smartpool.joinswapPoolAmountOut(inputToken.address, mintAmount, constants.MaxUint256);

    //   const userBalanceAfter = await inputToken.balanceOf(account);
    //   const userPoolBalanceAfter = await smartpool.balanceOf(account);
    //   const totalSupplyAfter = await smartpool.totalSupply();
    //   const poolTokenBalanceAfter = await pool.getBalance(inputToken.address);
      
    //   console.log("mintAmountAfter is: ",mintAmount.toString());
    //   console.log("userBalanceAfter is: ",userBalanceAfter.toString());
    //   console.log("userPoolBalanceAfter is: ",userPoolBalanceAfter.toString());
    //   console.log("totalSupplyAfter is: ",totalSupplyAfter.toString());
    //   console.log("poolTokenBalanceAfter is: ",poolTokenBalanceAfter.toString());

    //   expect(userBalanceAfter).to.eq(userBalanceBefore.sub(expectedTokenAmountIn));
    //   expect(userPoolBalanceAfter).to.eq(userPoolBalanceBefore.add(mintAmount));
    //   expect(totalSupplyAfter).to.eq(totalSupplyBefore.add(mintAmount));
    //   expect(poolTokenBalanceAfter).to.eq(poolTokenBalanceBefore.add(expectedTokenAmountIn));
    // });

    // it("joinswapExternAmountIn should work", async () => {
    //   smartpool.setPublicSwap(true);
    //   const tokenAmountIn = constants.WeiPerEther.div(20);
    //   const inputToken = tokens[0];

    //   const userBalanceBefore = await inputToken.balanceOf(account);
    //   const userPoolBalanceBefore = await smartpool.balanceOf(account);
    //   const totalSupplyBefore = await smartpool.totalSupply();
    //   const expectedPoolAmountOut = await smartpool.calcPoolOutGivenSingleIn(
    //     inputToken.address,
    //     tokenAmountIn
    //   );
    //   const poolTokenBalanceBefore = await pool.getBalance(inputToken.address);

    //   console.log("tokenAmountIn Before is: ",tokenAmountIn.toString());
    //   console.log("UserBalanceBefore is: ",userBalanceBefore.toString());
    //   console.log("userPoolBalanceBefore is: ",userPoolBalanceBefore.toString());
    //   console.log("totalSupplyBefore is: ",totalSupplyBefore.toString());
    //   console.log("poolTokenBalanceBefore is: ",poolTokenBalanceBefore.toString());
    //   console.log("----------------------------------------------------------------------");

    //   await smartpool.joinswapExternAmountIn(inputToken.address, tokenAmountIn, constants.Zero);

    //   const userBalanceAfter = await inputToken.balanceOf(account);
    //   const userPoolBalanceAfter = await smartpool.balanceOf(account);
    //   const totalSupplyAfter = await smartpool.totalSupply();
    //   const poolTokenBalanceAfter = await pool.getBalance(inputToken.address);

    //   console.log("tokenAmountIn After is: ",tokenAmountIn.toString());
    //   console.log("userBalanceAfter is: ",userBalanceAfter.toString());
    //   console.log("userPoolBalanceAfter is: ",userPoolBalanceAfter.toString());
    //   console.log("totalSupplyAfter is: ",totalSupplyAfter.toString());
    //   console.log("poolTokenBalanceAfter is: ",poolTokenBalanceAfter.toString());

    //   expect(userBalanceAfter).to.eq(userBalanceBefore.sub(tokenAmountIn));
    //   expect(userPoolBalanceAfter).to.eq(userPoolBalanceBefore.add(expectedPoolAmountOut));
    //   expect(totalSupplyAfter).to.eq(totalSupplyBefore.add(expectedPoolAmountOut));
    //   expect(poolTokenBalanceAfter).to.eq(poolTokenBalanceBefore.add(tokenAmountIn));
    // });

  //   it("Joining the pool from a single asset when public swap is disabled should fail", async () => {
  //     const poolAmountOut = constants.WeiPerEther.div(100);
  //     const tokenAmountIn = constants.WeiPerEther.div(100);
  //     const tokenInAddress = tokens[0].address;

  //     await expect(
  //       smartpool.joinswapExternAmountIn(tokenInAddress, tokenAmountIn, constants.Zero)
  //     ).to.be.revertedWith("PV2SmartPool.onlyPublicSwap: swapping not enabled");

  //     await expect(
  //       smartpool.joinswapPoolAmountOut(tokenInAddress, poolAmountOut, constants.MaxUint256)
  //     ).to.be.revertedWith("PV2SmartPool.onlyPublicSwap: swapping not enabled");
  //   });

  //   it("Should fail to exit with a single token if token is unbound", async () => {
  //     await smartpool.unbind(tokens[1].address);
  //     const exitAmount = constants.WeiPerEther;
  //     await smartpool.setPublicSwap(true);

  //     await expect(
  //       smartpool.exitswapExternAmountOut(tokens[1].address, exitAmount, constants.MaxUint256)
  //     ).to.be.revertedWith("LibPoolEntryExit.exitswapExternAmountOut: Token Not Bound");
  //     await expect(
  //       smartpool.exitswapPoolAmountIn(tokens[1].address, exitAmount, constants.Zero)
  //     ).to.be.revertedWith("LibPoolEntryExit.exitswapPoolAmountIn: Token Not Bound");
  //   });

  //   it("exitswapPoolAmountIn should work", async () => {
  //     await smartpool.setPublicSwap(true);
  //     const outputToken = tokens[0];
  //     const burnAmount = INITIAL_SUPPLY.div(100);

  //     const expectedOutputTokenAmount = await smartpool.calcSingleOutGivenPoolIn(
  //       outputToken.address,
  //       burnAmount
  //     );
  //     const userBalanceBefore = await outputToken.balanceOf(account);
  //     const userPoolBalanceBefore = await smartpool.balanceOf(account);
  //     const totalSupplyBefore = await smartpool.totalSupply();

  //     await smartpool.exitswapPoolAmountIn(outputToken.address, burnAmount, constants.Zero);

  //     const userBalanceAfter = await outputToken.balanceOf(account);
  //     const userPoolBalanceAfter = await smartpool.balanceOf(account);
  //     const totalSupplyAfter = await smartpool.totalSupply();

  //     expect(userBalanceAfter).to.eq(userBalanceBefore.add(expectedOutputTokenAmount));
  //     expect(userPoolBalanceAfter).to.eq(userPoolBalanceBefore.sub(burnAmount));
  //     expect(totalSupplyAfter).to.eq(totalSupplyBefore.sub(burnAmount));
  //   });

  //   it("exitSwapExternAmountOut should work", async () => {
  //     await smartpool.setPublicSwap(true);
  //     const outputToken = tokens[0];
  //     const outputTokenAmount = constants.WeiPerEther.div(100);

  //     const expectedPoolAmountIn = await smartpool.calcPoolInGivenSingleOut(
  //       outputToken.address,
  //       outputTokenAmount
  //     );
  //     const userBalanceBefore = await outputToken.balanceOf(account);
  //     const userPoolBalanceBefore = await smartpool.balanceOf(account);
  //     const totalSupplyBefore = await smartpool.totalSupply();

  //     await smartpool.exitswapExternAmountOut(
  //       outputToken.address,
  //       outputTokenAmount,
  //       constants.MaxUint256
  //     );

  //     const userBalanceAfter = await outputToken.balanceOf(account);
  //     const userPoolBalanceAfter = await smartpool.balanceOf(account);
  //     const totalSupplyAfter = await smartpool.totalSupply();

  //     expect(userBalanceAfter).to.eq(userBalanceBefore.add(outputTokenAmount));
  //     expect(userPoolBalanceAfter).to.eq(userPoolBalanceBefore.sub(expectedPoolAmountIn));
  //     expect(totalSupplyAfter).to.eq(totalSupplyBefore.sub(expectedPoolAmountIn));
  //   });

  //   it("Exiting the pool to a single asset when public swap is disabled should fail", async () => {
  //     const tokenOutAddress = tokens[0].address;
  //     const poolAmountIn = constants.WeiPerEther.div(100);
  //     const tokenAmountOut = constants.WeiPerEther.div(100);

  //     await expect(
  //       smartpool.exitswapExternAmountOut(tokenOutAddress, tokenAmountOut, constants.MaxUint256)
  //     ).to.be.revertedWith("PV2SmartPool.onlyPublicSwap: swapping not enabled");

  //     await expect(
  //       smartpool.exitswapPoolAmountIn(tokenOutAddress, poolAmountIn, constants.Zero)
  //     ).to.be.revertedWith("PV2SmartPool.onlyPublicSwap: swapping not enabled");
  //   });
  }); //end of Joining and Exiting


  // describe("Front running protected join and exit", async () => {
  //   it("Adding liquidity with frontrunning protection should work should work", async () => {
  //     const mintAmount = constants.WeiPerEther;
  //     const maxAmountsIn = createBigNumberArray(tokens.length, constants.MaxUint256);
  //     await smartpool["joinPool(uint256,uint256[])"](mintAmount, maxAmountsIn);

  //     const balance = await smartpool.balanceOf(account);
  //     expect(balance).to.eq(mintAmount.add(INITIAL_SUPPLY));

  //     for (let entry of tokens) {
  //       const userBalance = await entry.balanceOf(account)
  //       expect(userBalance).to.eq(INITIAL_TOKEN_SUPPLY.sub(mintAmount));
  //     }
  //   });

  //   it("Adding liquidity with front running protection when maxAmount of one of the tokens is too small should fail", async () => {
  //     const mintAmount = constants.WeiPerEther;
  //     const maxAmountsIn = createBigNumberArray(tokens.length, constants.MaxUint256);
  //     maxAmountsIn[2] = new BigNumber(0);
  //     await expect(
  //       smartpool["joinPool(uint256,uint256[])"](mintAmount, maxAmountsIn)
  //     ).to.be.revertedWith("LibPoolEntryExit.joinPool: Token in amount too big");
  //   });

  //   it("Adding liquidity with front running protection when a transfer fails should fail", async () => {
  //     const mintAmount = constants.WeiPerEther;
  //     const maxAmountsIn = createBigNumberArray(tokens.length, constants.MaxUint256);
  //     await tokens[1].approve(smartpool.address, constants.Zero);
  //     await expect(
  //       smartpool["joinPool(uint256,uint256[])"](mintAmount, maxAmountsIn)
  //     ).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
  //   });
  //   it("Adding liquidity with front running protection when a token transfer returns false should fail", async () => {
  //     const mintAmount = constants.WeiPerEther.div(4);
  //     const maxAmountsIn = createBigNumberArray(tokens.length, constants.MaxUint256);
  //     await tokens[1].setTransferFromReturnFalse(true);
  //     await expect(
  //       smartpool["joinPool(uint256,uint256[])"](mintAmount, maxAmountsIn)
  //     ).to.be.revertedWith("LibUnderlying._pullUnderlying: transferFrom failed");
  //   });
  //   it("Removing liquidity with front running protection should work", async () => {
  //     const removeAmount = constants.WeiPerEther.div(2);
  //     const minAmountsOut = createBigNumberArray(tokens.length, constants.Zero);
  //     await smartpool["exitPool(uint256,uint256[])"](removeAmount, minAmountsOut);
  //     const balance = await smartpool.balanceOf(account);
  //     expect(balance).to.eq(INITIAL_SUPPLY.sub(removeAmount));

  //     for (let entry of tokens) {
  //       const userBalance = await entry.balanceOf(account)
  //       expect(userBalance).to.eq(INITIAL_TOKEN_SUPPLY.sub(removeAmount.div(2)));
  //     }
  //   });

  //   it("Removing liquidity with front running protection should fail when one of the token outputs is less than minAmount", async () => {
  //     const removeAmount = constants.WeiPerEther.div(2);
  //     const minAmountsOut = createBigNumberArray(tokens.length, constants.Zero);
  //     minAmountsOut[2] = constants.MaxUint256;
  //     await expect(
  //       smartpool["exitPool(uint256,uint256[])"](removeAmount, minAmountsOut)
  //     ).to.be.revertedWith("LibPoolEntryExit.exitPool: Token amount out too small");
  //   });

  //   it("Removing all liquidity with front running protection should fail", async () => {
  //     const removeAmount = constants.WeiPerEther;
  //     const minAmountsOut = createBigNumberArray(tokens.length, constants.Zero);
  //     await expect(
  //       smartpool["exitPool(uint256,uint256[])"](removeAmount, minAmountsOut)
  //     ).to.be.revertedWith("ERR_MIN_BALANCE");
  //   });

  //   it("Removing liquidity with front running protection should fail when removing more than balance", async () => {
  //     const minAmountsOut = createBigNumberArray(tokens.length, constants.Zero);
  //     // First mint some more in another account to not withdraw all total liquidity in the actual test
  //     const altSignerSmartPool = Pv2SmartPoolFactory.connect(smartpool.address, signers[1]);
  //     await altSignerSmartPool.joinPool(constants.WeiPerEther);
  //     await expect(
  //       smartpool["exitPool(uint256,uint256[])"](INITIAL_SUPPLY.add(1), minAmountsOut)
  //     ).to.be.revertedWith("ERR_INSUFFICIENT_BAL");
  //   });

  //   it("Removing liquidity with front running protection when a token transfer fails should fail", async () => {
  //     const minAmountsOut = createBigNumberArray(tokens.length, constants.Zero);
  //     await tokens[0].setTransferFailed(true);
  //     await expect(
  //       smartpool["exitPool(uint256,uint256[])"](constants.WeiPerEther.div(2), minAmountsOut)
  //     ).to.be.revertedWith("MockToken.transfer: transferFrom set to fail");
  //   });

  //   it("Removing liquidity with frontrunning protection when a token transfer returns false should fail", async () => {
  //     const minAmountsOut = createBigNumberArray(tokens.length, constants.Zero);
  //     await tokens[0].setTransferReturnFalse(true);
  //     await expect(
  //       smartpool["exitPool(uint256,uint256[])"](constants.WeiPerEther.div(2), minAmountsOut)
  //     ).to.be.revertedWith("ERR_ERC20_FALSE");
  //   });
  // });

  // describe("Token binding", async () => {
  //   it("Binding a new token should work", async () => {
  //     const mintAmount = constants.WeiPerEther.mul(1000000);
  //     const token: MockToken = await tokenFactory.deploy("Mock", "M", 18);
  //     await token.mint(account, mintAmount);
  //     await token.approve(smartpool.address, constants.MaxUint256);

  //     await smartpool.bind(token.address, constants.WeiPerEther, constants.WeiPerEther);

  //     const tokenBalance = await token.balanceOf(account);
  //     expect(tokenBalance).to.eq(mintAmount.sub(constants.WeiPerEther));

  //     for (let entry of tokens) {
  //       const userBalance = await entry.balanceOf(account)
  //       expect(userBalance).to.eq(INITIAL_TOKEN_SUPPLY.sub(constants.WeiPerEther.div(2)));
  //     }
  //   });
  //   it("Binding a token when transferFrom returns false should fail", async () => {
  //     const mintAmount = constants.WeiPerEther.mul(1000000);
  //     const token: MockToken = await tokenFactory.deploy("Mock", "M", 18);
  //     await token.mint(account, mintAmount);
  //     await token.approve(smartpool.address, constants.MaxUint256);
  //     await token.setTransferFromReturnFalse(true);
  //     await expect(
  //       smartpool.bind(token.address, constants.WeiPerEther, constants.WeiPerEther)
  //     ).to.be.revertedWith("PV2SmartPool.bind: transferFrom failed");
  //   });
  //   it("Binding from a non token binder address should fail", async () => {
  //     smartpool = smartpool.connect(signers[1]);
  //     const mintAmount = constants.WeiPerEther.mul(1000000);
  //     const token: MockToken = await tokenFactory.deploy("Mock", "M", 18);
  //     await token.mint(account, mintAmount);
  //     await token.approve(smartpool.address, constants.MaxUint256);
  //     await expect(
  //       smartpool.bind(token.address, constants.WeiPerEther, constants.WeiPerEther)
  //     ).to.be.revertedWith("PV2SmartPool.onlyTokenBinder: not token binder");
  //   });
  //   it("Rebinding a token should work", async () => {
  //     // Doubles the weight in the pool
  //     await smartpool.rebind(
  //       tokens[0].address,
  //       constants.WeiPerEther.mul(2),
  //       constants.WeiPerEther.mul(2)
  //     );
  //   });
  //   it("Rebinding a token reducing the balance should work", async () => {
  //     await smartpool.rebind(
  //       tokens[0].address,
  //       constants.WeiPerEther.div(4),
  //       constants.WeiPerEther.mul(2)
  //     );
  //   });
  //   it("Rebinding a token reducing the balance when the the token token transfer returns false should fail", async () => {
  //     await tokens[0].setTransferReturnFalse(true);
  //     await expect(
  //       smartpool.rebind(
  //         tokens[0].address,
  //         constants.WeiPerEther.div(4),
  //         constants.WeiPerEther.mul(2)
  //       )
  //     ).to.be.revertedWith("ERR_ERC20_FALSE");
  //   });
  //   it("Rebinding a token from a non token binder address should fail", async () => {
  //     smartpool = smartpool.connect(signers[1]);
  //     await expect(
  //       smartpool.rebind(
  //         tokens[0].address,
  //         constants.WeiPerEther.mul(2),
  //         constants.WeiPerEther.mul(2)
  //       )
  //     ).to.be.revertedWith("PV2SmartPool.onlyTokenBinder: not token binder");
  //   });
  //   it("Unbinding a token should work", async () => {
  //     smartpool.unbind(tokens[0].address);
  //     for (let entry of tokens) {
  //       const userBalance = await entry.balanceOf(account)
  //       expect(userBalance).to.eq(INITIAL_TOKEN_SUPPLY.sub(constants.WeiPerEther.div(2)));
  //     }
  //   });
  //   it("Unbinding a token from a non token binder address should fail", async () => {
  //     smartpool = smartpool.connect(signers[1]);
  //     await expect(smartpool.unbind(tokens[0].address)).to.be.revertedWith(
  //       "revert PV2SmartPool.onlyTokenBinder: not token binder"
  //     );
  //   });
  // });

  // describe("ready modifier", async () => {
  //   it("should revert when not ready", async () => {
  //     smartpool = (await run("deploy-libraries-and-smartpool")) as Pv2SmartPool;
  //     await expect(smartpool.joinPool(constants.WeiPerEther)).to.be.revertedWith(
  //       "PV2SmartPool.ready: not ready"
  //     );
  //   });
  // });

  // describe("lockBPoolSwap modifier", async () => {
  //   it("If swap disabled, keep disabled", async () => {
  //     await expect (await smartpool.isPublicSwap()).is.eq(false);
  //     await smartpool.joinPool(constants.WeiPerEther);
  //     await expect (await pool.isPublicSwap()).is.eq(false);
  //   });
  //   it("If swap enabled, keep enabled", async () => {
  //     await smartpool.setPublicSwap(true);
  //     await expect (await smartpool.isPublicSwap()).is.eq(true);
  //     // would be nice of we can verify the following calls
  //     //    setPublicSwap(false)
  //     //    setPublicSwap(true)
  //     // Is there a mocking library that allows this?
  //     // Or test by require(isPublicSwap == false) in a function
  //     await smartpool.joinPool(constants.WeiPerEther);
  //     await expect (await smartpool.isPublicSwap()).is.eq(true);
  //   });
  // });

  // describe("Utility Functions", async () => {
  //   describe("getDenormalizedWeight(address _token)", async () => {
  //     it("Should return denormalized weight of underlying token in bPool", async () => {
  //       smartpool = smartpool.connect(signers[1]);

  //       const tokenWeight = await smartpool.getDenormalizedWeight(tokens[0].address);

  //       expect(tokenWeight).to.equal(constants.WeiPerEther);
  //     });
  //   });
  // });




  async function getTokenBalances(address: string) {
    const balances: BigNumber[] = [];

    for (const token of tokens) {
      balances.push(await token.balanceOf(address));
    }

    return balances;
  }

  function expectZero(amounts: BigNumber[]) {
    for (const amount of amounts) {
      expect(amount).to.eq(0);
    }
  }

  function createBigNumberArray(length: number, value: BigNumber): BigNumber[] {
    const result: BigNumber[] = [];
    for (let i = 0; i < length; i++) {
      result.push(value);
    }

    return result;
  }
});
