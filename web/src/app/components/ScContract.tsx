import "../assets/style/ScContract.css";
import { useState, ChangeEvent } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { isAddress } from "viem";
import ScStats from "./ScStats";
import UserFeatures from "./UserFeatures";
import contractABI from "../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json";
import factoryABI from "../artifacts/contracts/Factory.sol/Factory.json";
import FactoryActions from "./FactoryActions";

// Log all environment variables
console.log("All Environment Variables:", process.env);

const factoryContract = {
  address: process.env.REACT_APP_FACTORY_ADDRESS as `0x${string}`,
  abi: factoryABI.abi,
};

interface ScContractProps {
  userAddress: string;
}

function ScContract({ userAddress }: ScContractProps) {
  const [addressIsReady, setAddressIsReady] = useState(false);
  const [scAddress, setScAddress] = useState<string | undefined>();

  // Fetch factory contract data with error handling
  const {
    data: factoryReadData,
    error: factoryReadError,
    isLoading: factoryIsLoading,
    isSuccess: factoryReadIsSuccess,
    refetch: walletRefetch,
  } = useReadContract({
    address: factoryContract.address,
    abi: factoryContract.abi,
    functionName: "getWalletList",
  }) as {
    data: string[] | undefined;
    error: Error | undefined;
    isLoading: boolean;
    isSuccess: boolean;
    refetch: () => void;
  };

  if (factoryReadError) {
    console.error("Error reading factory contract:", factoryReadError);
  }

  console.log("Factory contract address:", factoryContract.address);
  console.log("Factory read data:", factoryReadData);

  const smartContract = {
    address: scAddress as `0x${string}`,
    abi: contractABI.abi,
  };

  // Fetch smart contract data with error handling
  const {
    data: readData,
    error: readError,
    isSuccess,
  } = useReadContracts({
    contracts: [
      {
        address: smartContract.address,
        abi: smartContract.abi,
        functionName: "quoremRequired",
      },
      {
        address: smartContract.address,
        abi: smartContract.abi,
        functionName: "getOwners",
      },
    ],
  });

  if (readError) {
    console.error("Error reading smart contract:", readError);
  }

  console.log("Smart contract address:", smartContract.address);
  console.log("Read contracts data:", readData);

  const quorem =
    scAddress && isSuccess ? parseInt(readData?.[0]?.result as string) : null;
  const owners =
    scAddress && isSuccess ? (readData?.[1]?.result as string[]) : [];
  const isOwner = owners?.includes(userAddress);

  console.log("Quorum:", quorem);
  console.log("Owners:", owners);
  console.log("Is owner:", isOwner);

  return (
    <div className="mt-5">
      {factoryReadIsSuccess && (
        <div className="factory-section">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Factory Address:</span>
              <span className="font-mono text-sm">
                {process.env.REACT_APP_FACTORY_ADDRESS}
              </span>
            </div>

            <div className="input-field">
              <select
                disabled={factoryIsLoading}
                className="mt-3 mb-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  if (isAddress(e.target.value)) {
                    setScAddress(e.target.value);
                    console.log("Selected contract address:", e.target.value);
                  }
                }}
              >
                <option>Select Contract Address</option>
                {factoryReadData?.map((address: string, index: number) => (
                  <option key={address} value={address}>
                    {`walletID #${index + 1} ${address}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4">
              <button
                className="px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 disabled:bg-red-300"
                disabled={
                  !scAddress || !isAddress(scAddress) || factoryIsLoading
                }
                onClick={() => {
                  setAddressIsReady(true);
                  console.log("Address is ready:", true);
                }}
              >
                Display
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 disabled:bg-red-300"
                disabled={!addressIsReady || factoryIsLoading}
                onClick={() => {
                  setAddressIsReady(false);
                  console.log("Address is ready:", false);
                }}
              >
                Close Contract
              </button>
            </div>
          </div>
        </div>
      )}

      <FactoryActions
        userAddress={userAddress as `0x${string}`}
        walletRefetch={walletRefetch}
      />

      {addressIsReady && scAddress && (
        <div>
          <ScStats
            scAddress={scAddress as `0x${string}`}
            userAddress={userAddress}
            quorem={quorem || 0}
            owners={owners}
          />
          <UserFeatures
            scAddress={scAddress as `0x${string}`}
            userAddress={userAddress}
            quorem={quorem || 0}
            isOwner={isOwner}
          />
        </div>
      )}
    </div>
  );
}

export default ScContract;
