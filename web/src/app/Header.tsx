import { 
    ConnectWallet, 
    Wallet, 
    WalletDropdown, 
    WalletDropdownLink, 
    WalletDropdownDisconnect, 
  } from '@coinbase/onchainkit/wallet'; 
  import {
    Address,
    Avatar,
    Name,
    Badge,
    Identity,
    EthBalance,
  } from '@coinbase/onchainkit/identity';
  import { color } from '@coinbase/onchainkit/theme';
  
  export default function Header() {
   
    return (
      <>
        <div>
          <div className="navbar bg-base-100 flex justify-between">
            <a className="btn btn-ghost text-xl">SafeBaseVault</a>
            <div style={{ padding: '10px' }}>
              <Wallet>
                <ConnectWallet>
                  <Avatar className="h-6 w-6" />
                  <Name />
                </ConnectWallet>
                <WalletDropdown>
                  <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                    <Avatar />
                    <Name>
                      <Badge />
                    </Name>
                    <Address className={color.foregroundMuted} />
                    <EthBalance />
                  </Identity>
                  <WalletDropdownLink icon="wallet" href="https://wallet.coinbase.com">
                    Go to Wallet Dashboard
                  </WalletDropdownLink>
                  <WalletDropdownDisconnect />
                </WalletDropdown>
              </Wallet>
            </div>
          </div>
        </div>
      </>
    );
  }
  