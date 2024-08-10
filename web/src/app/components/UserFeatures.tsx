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
  id?: number;
}

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
    onLog(logs: { args: any }[]) { // Cast logs to include args
      const userEvent = logs[0].args; // Ensure logs[0] has the correct structure
      const depositedAmt = formatEther(userEvent?.amount?.toString() || "0");
      toast.success(
        `Withdrawal txnId: ${parseInt(
          userEvent?.transactionindex.toString() || "0"
        )} with withdrawal amount: ${depositedAmt} Eth created!`
      );
    },
  });

  useWatchContractEvent({
    address: scAddress,
    abi: MultiSigWallet.abi,
    eventName: "ApproveWithdrawTx",
    onLog(logs: { args: any }[]) { // Cast logs to include args
      const userEvent = logs[0].args;
      toast.success(
        `txnId: ${parseInt(
          userEvent?.transactionIndex.toString() || "0"
        )} is approved and sent to recipient!`
      );
    },
  });

  const { data: readData, isLoading: readIsLoading } = useReadContract({
    address: scAddress, // Use address instead of contracts
    abi: MultiSigWallet.abi, // Add abi directly
    functionName: "getWithdrawTxes",
  });

  const txnsWithId = !readIsLoading
    ? (readData as { result: Transaction[] })?.[0]?.result?.map((txn, index) => ({
        ...txn,
        id: index,
      }))
    : [];

  const unapprovedTxns = txnsWithId?.filter(
    (txn) => parseInt(txn?.approvals?.toString() || "0") < quorem
  );

  const {
    data: writeData,
    write: depositWrite,
    error: depositError,
    isError: depositIsError,
  } = useWriteContract({
    ...multiSigWalletContract,
    functionName: "deposit",
    value: debouncedDeposit,
    enabled: Boolean(debouncedDeposit),
  });

  const { isLoading: depositIsLoading, isSuccess: depositIsSuccess } =
    useTransaction({
      hash: writeData?.hash,
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
                disabled={!depositWrite || depositIsLoading}
                onClick={() => depositWrite?.()}
              >
                {depositIsLoading ? "Depositing..." : "Deposit"}
              </button>
            </div>
          </div>

          {depositIsSuccess && (
            <div className="mt-4 text-green-500">
              Successfully deposited {formatEther(depositAmt.toString())} ETH!
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
          {(depositIsError) && (
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
                    {formatEther(txn?.amount?.toString())} Eth
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