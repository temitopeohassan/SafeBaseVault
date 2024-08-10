"use client";
import "../assets/style/UserFeatures.css";
import { useState, ChangeEvent } from "react";
import { formatEther, parseEther } from "viem";
import { toast } from "react-toastify";
import useDebounce from "../hooks/useDebounce";
import {
  useWriteContract,
  useTransaction,
  useReadContract,
  useWatchContractEvent,
} from "wagmi";

import MultiSigWallet from "../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json";
import OwnersActions from "./OwnersActions";

interface UserFeaturesProps {
  scAddress: `0x${string}`;
  userAddress: string;
  quorem: number;
  isOwner: boolean;
}

interface Transaction {
  to: string;
  amount: bigint;
  approvals: bigint;
  sent: boolean;
  id: number;
}

type CreateWithdrawTxEvent = {
  amount: bigint;
  transactionindex: bigint;
};

type ApproveWithdrawTxEvent = {
  transactionIndex: bigint;
};

type CustomLog = {
  args: CreateWithdrawTxEvent | ApproveWithdrawTxEvent;
};


function UserFeatures({ scAddress, userAddress, quorem, isOwner }: UserFeaturesProps) {
  const multiSigWalletContract = {
    address: scAddress,
    abi: MultiSigWallet.abi,
  };

  const [depositAmt, setDepositAmt] = useState<bigint>(BigInt(0));
  const debouncedDeposit = useDebounce(depositAmt, 1500);

  useWatchContractEvent({
    address: scAddress,
    abi: MultiSigWallet.abi,
    eventName: "CreateWithdrawTx",
    onLogs: (logs: CustomLog[]) => {
      logs.forEach((log) => {
        const event = log as unknown as { args: CreateWithdrawTxEvent };
        if (event.args) {
          const depositedAmt = formatEther(event.args.amount);
          toast.success(
            `Withdrawal txnId: ${event.args.transactionindex.toString()} with withdrawal amount: ${depositedAmt} Eth created!`
          );
        }
      });
    },
  });

  useWatchContractEvent({
    address: scAddress,
    abi: MultiSigWallet.abi,
    eventName: "ApproveWithdrawTx",
    onLogs: (logs: CustomLog[]) => {
      logs.forEach((log) => {
        const event = log as unknown as { args: ApproveWithdrawTxEvent };
        if (event.args) {
          toast.success(
            `txnId: ${event.args.transactionIndex.toString()} is approved and sent to recipient!`
          );
        }
      });
    },
  });

  const { data: readData, isLoading: readIsLoading } = useReadContract({
    address: scAddress,
    abi: MultiSigWallet.abi,
    functionName: "getWithdrawTxes",
  });

  const txnsWithId = !readIsLoading && readData
    ? (readData as Transaction[]).map((txn, index) => ({
        ...txn,
        id: index,
      }))
    : [];

  const unapprovedTxns = txnsWithId.filter(
    (txn) => Number(txn.approvals) < quorem
  );

  const { data: writeData, writeAsync, error: depositError, isError: depositIsError } = useWriteContract({
    address: scAddress as `0x${string}`,
    abi: MultiSigWallet.abi,
    functionName: 'deposit',
    args: [debouncedDeposit], // Add function arguments if needed
  });

  const { isLoading: depositIsLoading, isSuccess: depositIsSuccess } = useTransaction({
    hash: writeData ? (writeData as any).hash : undefined,
  });

  const onChangeDeposit = (event: ChangeEvent<HTMLInputElement>) => {
    const amt = event.target.value;
    const depositEther = parseEther(amt || "0");
    setDepositAmt(depositEther);
  };

  return (
    <div>
      <div className="user-section mt-4">
        <h1 className="text-2xl font-semibold mb-4">User</h1>
        <form className="mt-4">
          <div className="mb-3 flex flex-col">
            <label className="user-address text-gray-700">User address:</label>
            <input
              className="mt-1 border border-gray-300 rounded-md p-2"
              type="text"
              placeholder={userAddress}
              readOnly
            />
          </div>
          <div>
            <div className="mb-3">
              <label className="block text-gray-700">Deposit Ether</label>
              <input
                className="deposit-input-field border border-gray-300 rounded-md p-2 mt-1 w-full"
                type="number"
                step="0.000001"
                placeholder="Enter amount in ether"
                onChange={onChangeDeposit}
              />
            </div>
            <div className="user-button mt-4">
              <button
                className="deposit-button bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 disabled:bg-gray-400"
                disabled={!writeAsync || depositIsLoading}
                onClick={() => writeAsync?.()}
              >
                {depositIsLoading ? "Depositing..." : "Deposit"}
              </button>
            </div>
          </div>

          {depositIsSuccess && (
            <div className="mt-4 text-green-500">
              Successfully deposited {formatEther(depositAmt)} ETH!
              <div>
                <a
                  className="text-blue-500 underline"
                  href={`https://sepolia.basescan.org/tx/${writeData?.hash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Etherscan
                </a>
              </div>
            </div>
          )}
          {depositIsError && (
            <div className="custom-word-wrap text-red-500">
              Error: {depositError?.message}
            </div>
          )}
        </form>
      </div>
      <div className="transaction-section mt-6">
        <h2 className="text-xl font-semibold mb-4">Transaction Approval List</h2>
        {readIsLoading ? (
          <p>Loading transaction list...</p>
        ) : (
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b">Id</th>
                <th className="py-2 px-4 border-b">To</th>
                <th className="py-2 px-4 border-b">Amount</th>
                <th className="py-2 px-4 border-b">Approval</th>
                <th className="py-2 px-4 border-b">Sent</th>
              </tr>
            </thead>
            <tbody>
              {unapprovedTxns.map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b">{txn.id}</td>
                  <td className="py-2 px-4 border-b">{txn?.to}</td>
                  <td className="py-2 px-4 border-b">
                    {formatEther(txn?.amount)} Eth
                  </td>
                  <td className="py-2 px-4 border-b">{`${txn?.approvals}`}</td>
                  <td className="py-2 px-4 border-b">{`${txn?.sent}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <OwnersActions scAddress={scAddress} isOwner={isOwner} />
      </div>
    </div>
  );
}

export default UserFeatures;
