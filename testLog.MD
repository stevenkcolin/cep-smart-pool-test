localhost4


npx buidler deploy-pie-smart-pool --network localhost

npx buidler deploy-pie-smart-pool --network localhost



STEP 1: deploy balancer-factory & balancer-pool

npx buidler testAccount --network localhost
npx buidler testAccount --network ropsten

npx buidler deploy-balancer-factory --network localhost
factory address: 0x8858eeB3DfffA017D4BCE9801D340D36Cf895CCf


npx buidler test001 --balancer-factory 0x8858eeB3DfffA017D4BCE9801D340D36Cf895CCf --network localhost
balancerPool: 0x95b12A0c659fF8D3049c9bb3A7B5587C88E08111




STEP 2 Deploy token and bind token to balancer-pool

```
npx buidler test002 --network localhost --name test02 --symbol test02 --decimals 18
```

##### 在ropsten测试，给test002也加上相应的内容

```
npx buidler test002 --network ropsten --name test02 --symbol test02 --decimals 18
```

npx buidler deploy-mock-token --name MOC112404 --symbol MOC112404 --decimals 18 --network localhost
MOC112404 address: 0xdeDa5f86FD98cC2d68054a6CEA86840456C08d38


绑定token MOC1
npx buidler balancer-bind-token --pool 0xa14a6eCa5A335a3C069cc7E9C08F374D32908Eac --token 0xdeDa5f86FD98cC2d68054a6CEA86840456C08d38 --balance 10000 --weight 2 --decimals 18 --network localhost




STEP 3: Deploy & Init smart-pool

npx buidler deploy-cep-smart-pool --network localhost
cep-smart-pool: 0xE443B3E39F61D7bAE0568960B24DC53C2AF949E7


npx buidler init-smart-pool --smart-pool 0xE443B3E39F61D7bAE0568960B24DC53C2AF949E7 --pool 0xa14a6eCa5A335a3C069cc7E9C08F374D32908Eac --name tst112404 --symbol tst112404 --initial-supply 10000 --network localhost



STEP 4: Setting Smart Pool Token

npx buidler set-join-exit-enabled --pool 0xE443B3E39F61D7bAE0568960B24DC53C2AF949E7 --network localhost

npx buidler set-cap-max --pool 0xE443B3E39F61D7bAE0568960B24DC53C2AF949E7 --network localhost


npx buidler set-controller --smartpool 0xE443B3E39F61D7bAE0568960B24DC53C2AF949E7 --pool 0xa14a6eCa5A335a3C069cc7E9C08F374D32908Eac --network localhost




Step 5: Join Smart Pool

npx buidler approve-smart-pool --pool 0xE443B3E39F61D7bAE0568960B24DC53C2AF949E7 --network localhost
npx buidler get-join-smart-pool-parameters --pool 0xE443B3E39F61D7bAE0568960B24DC53C2AF949E7 --network localhost

npx buidler join-smart-pool --pool 0xE443B3E39F61D7bAE0568960B24DC53C2AF949E7 --amount 500 --network localhost







