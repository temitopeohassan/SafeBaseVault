"use client";
import "../assets/style/ScStats.css";
import { useContractEvent, useBalance } from "wagmi";
import contractABI from "../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json";
import { toast } from "react-toastify";
import { formatEther } from "viem";

interface ScStatsProps {
  scAddress: `0x${string}`;
  userAddress: string;
  quorem: number;
  owners: string[];
}

function ScStats({ scAddress, userAddress, quorem, owners }: ScStatsProps) {
  const smartContract = {
    address: scAddress,
    abi: contractABI.abi,
  };

  const { data: balanceData } = useBalance({
    address: scAddress,
    watch: true,
  });

  useContractEvent({
    address: scAddress,
    abi: smartContract.abi,
    eventName: "Deposit",
    listener(logs) {
      if (logs[0]?.args && logs[0].args?.sender === userAddress) {
        const userEvent = logs[0].args;
        const depositedAmt = formatEther(userEvent?.amount?.toString() || "0");
        toast.success(`Deposited ${depositedAmt} Eth!`);
      }
    },
  });

  return (
    <div className="statics-section mt-4">
      <h2 className="text-2xl font-semibold">Smart Contract Stats</h2>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <p className="statics-data">Contract Address: {scAddress}</p>
        <p className="statics-data">
          Balance: {balanceData?.formatted} {balanceData?.symbol}
        </p>
        <p className="statics-data">Quorum: {quorem || ""}</p>
      </div>
      <div className="mt-4">
        <h3 className="text-xl font-semibold">Owner</h3>
        <ul className="owner-list mt-2">
          {owners?.map((owner) => (
            <li
              className="list-data flex items-center gap-2 mb-2"
              key={owner}
            >
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-lg font-bold">
                {owner.slice(0, 1).toUpperCase()}
              </div>
              <span>{owner}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ScStats;
