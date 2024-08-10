"use client";
import "../assets/style/ScStats.css";
import { useWatchContractEvent, useBalance } from "wagmi";
import contractABI from "../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json";
import { toast } from "react-toastify";
import { formatEther } from "viem";
import { DecodeEventLogReturnType } from 'viem';

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
  });

  useWatchContractEvent({
    address: scAddress,
    abi: smartContract.abi,
    eventName: "Deposit",
    onLogs(logs) {
      const log = logs[0] as unknown as DecodeEventLogReturnType<typeof smartContract.abi, 'Deposit'>;
      if (log && log.args && (log.args as any).sender === userAddress) {
        const depositedAmt = formatEther((log.args as any).amount.toString());
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
          Balance: {balanceData?.value} {balanceData?.symbol}
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