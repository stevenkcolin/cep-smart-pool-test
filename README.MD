# test for 1202
# 熟悉代码

测试单一测试文件
`npx buidler test ./test/poolToken.ts`

跑一些测试脚本
`npx buidler test001 --network localhost`

或者
`npx buidler test001 --network ropsten`

### 修改了test001的代码，实现了deploy BalancerPool 的功能
```
npx buidler test001 --balancer-factory 0x8858eeB3DfffA017D4BCE9801D340D36Cf895CCf --network localhost
```


# 20.11.13
# CEP Smart Pools

**CEP Smart Pools** are asset management agnostic(currently Balancer only) **D**ecentralised **T**raded **F**unds. They share a common interface to make them easy to integrate in other products.

All Smart Pools are fully upgradeable to make it easy to add features and optimise gas usage at later stages.

## Development

### Setup the dev enviroment

Clone this repo. And copy the contents of ``env.example`` to a new file called ``.env`` and edit the the relevant values inside. **DO NOT** share this file with anyone as it will contain sensitive data.

Install all dependencies: 
```
npm i hardhat
```


```
yarn
```
Build the project:
```
yarn build
```
Run the tests:
```
yarn test
```
Create coverage report:
```
yarn coverage
```

### Running mainnet/testnet test

To test a new implementation in testnet conditions. Set the implementation of a test pool to the new version and run the following script.

```
npx buidler deploy-smart-pool-implementation-complete --impl-name DAO --network ropsten
```

deploy on localhost
### Step1: launch localhost node localhost:8545
```
npx buidler node
```
### Step2: run the deploy scripts on the localhost ndoe

```
npx buidler deploy-smart-pool-implementation-complete --impl-name DAO --network localhost
```

# Test Single File
## test single test scripts poolToken.ts
```
npx buidler test ./test/poolToken.ts
```

## test basic pool functions:
```
npx buidler test ./test/basicPoolFunctionality.ts
```

## test advancedPoolFunctionality
```
npx buidler test ./test/advancedPoolFunctionality.ts
```

test cap functions
```
npx buidler test ./test/capPoolFunctionality.ts
```

test ProxiedFactory test script
```
npx buidler test ./test/pProxiedFactory.ts
```

test reentryProtection test script
```
npx buidler test ./test/reentryProtection.ts
```

test safeApproval test script
```
npx buidler test ./test/safeApproval.ts
```


## Integration

### Adding and removing liquidity

To add liquidity approve the smart pool to pull the underlying tokens. And call:

```solidity
function joinPool(uint256 _amount) external;
```

To remove liquidity:

```solidity
function exitPool(uint256 _amount) external;
```

### Getting pool details

To get the underlying tokens call:

```solidity
function getTokens() external view returns(address[] memory);
```

To get the underlying tokens and amounts needed to mint a certain amount of pool shares call:

```solidity
function calcTokensForAmount(uint256 _amount) external view returns(address[] memory tokens, uint256[] memory amounts);
```

#### Balancer smart pool specific
Get the address of the underlying balancer pool:

```solidity
function getBPool() external view returns(address);
```

Get the swap fee:

```solidity
function getSwapFee() external view returns (uint256);
```

Get if trading is enabled on the underlying balancer pool:

```solidity
function isPublicSwap() external view returns (bool);
```


#### Capped pool specific
Some pools have a cap which limits the totalSupply of the pool shares token. To get the cap you call:

```solidity
function getCap() external view returns(uint256);
```

## Deployed Pools

| Name         | Symbol | Address                                                                                                                       | Type            |
|--------------|--------|-------------------------------------------------------------------------------------------------------------------------------|-----------------|
| BTC++ | BTC++  | [0x0327112423f3a68efdf1fcf402f6c5cb9f7c33fd](https://etherscan.io/address/0x0327112423f3a68efdf1fcf402f6c5cb9f7c33fd) | Balancer Capped |
| USD++ | USD++  | [0x9a48bd0ec040ea4f1d3147c025cd4076a2e71e3e](https://etherscan.io/address/0x9a48bd0ec040ea4f1d3147c025cd4076a2e71e3e) | Balancer Capped |
