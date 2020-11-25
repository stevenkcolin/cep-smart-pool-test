localhost4


npx buidler deploy-pie-smart-pool --network localhost

npx buidler deploy-pie-smart-pool --network localhost



# STEP 1: deploy balancer-factory & balancer-pool

##### 展示localhost的两个账号

```
npx buidler testAccount --network localhost
```
###### 展示ropsten网络的两个账号地址

```
npx buidler testAccount --network ropsten
```

### 在localhost部署balancer-factory，并获得相应的balancer factory地址

```
npx buidler deploy-balancer-factory --network localhost
factory address: 0xD6C850aeBFDC46D7F4c207e445cC0d6B0919BDBe
```

### 使用自己开发的test001，在balancer-factory的地址上，部署balancer-pool
```
npx buidler test001 --balancer-factory 0xD6C850aeBFDC46D7F4c207e445cC0d6B0919BDBe --network localhost
balancerPool: 0xda24DebbEcECe2270a5Ff889AEfC71Dcf4B8A3D5
```




# STEP 2 Deploy token and bind token to balancer-pool



### 给test002 用来部署测试用token

```
npx buidler test002 --network localhost --name test02 --symbol test02 --decimals 18
token address: 0x2D8553F9ddA85A9B3259F6Bf26911364B85556F5
```

### 绑定token MOC1
```
npx buidler balancer-bind-token --pool 0xda24DebbEcECe2270a5Ff889AEfC71Dcf4B8A3D5 --token 0x2D8553F9ddA85A9B3259F6Bf26911364B85556F5 --balance 10000 --weight 2 --decimals 18 --network localhost
```




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







