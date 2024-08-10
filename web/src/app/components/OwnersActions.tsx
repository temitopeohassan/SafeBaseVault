










import "../assets/style/OwnersActions.css";
import { useState, ChangeEvent } from "react";
import { parseEther } from "viem";
import {
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";
import useDebounce from "../hooks/useDebounce";
import MultiSigWallet from "../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json";

interface OwnersActionsProps {
  scAddress: `0x${string}`;
  isOwner: boolean;
}

function OwnersActions({ scAddress, isOwner }: OwnersActionsProps) {
  const multiSigWalletContract = {
    address: scAddress,
    abi: MultiSigWallet.abi,
  };

  const [toAddress, setToAddress] = useState<string>("");
  const [withdrawEthAmt, setWithdrawEthAmt] = useState<bigint | undefined>();
  const [approveId, setApproveId] = useState<number | undefined>();
  const debouncedApproveId = useDebounce(approveId, 1500);
  const debouncedWithdrawEth = useDebounce(withdrawEthAmt, 1500);

  // Contract Write Functions
  const {
    config: approveTxnConfig,
    error: prepareApproveError,
    isError: prepareApproveIsError,
  } = usePrepareContractWrite({
    ...multiSigWalletContract,
    functionName: "approveWithdrawTx",
    args: [debouncedApproveId],
    enabled: typeof debouncedApproveId === "number",
  });

  const {
    data: approveData,
    write: approveWrite,
    isError: approveIsError,
    error: approveError,
  } = useContractWrite(approveTxnConfig);

  const { isLoading: approveIsLoading, isSuccess: approveIsSuccess } =
    useWaitForTransaction({ hash: approveData?.hash });

  const {
    config: createTxnConfig,
    error: prepareCreateError,
    isError: prepareCreateIsError,
  } = usePrepareContractWrite({
    ...multiSigWalletContract,
    functionName: "createWithdrawTx",
    args: [toAddress, debouncedWithdrawEth],
    enabled: Boolean(debouncedWithdrawEth),
  });

  const {
    data: createData,
    write: createWrite,
    isError: createIsError,
    error: createError,
  } = useContractWrite(createTxnConfig);

  const { isLoading: createIsLoading, isSuccess: createIsSuccess } =
    useWaitForTransaction({ hash: createData?.hash });

  const onChangeAddrCreateTxn = (event: ChangeEvent<HTMLInputElement>) => {
    setToAddress(event.target.value);
  };

  const onChangeEthCreateTxn = (event: ChangeEvent<HTMLInputElement>) => {
    setWithdrawEthAmt(parseEther(event.target.value));
  };

  if (!isOwner) {
    return <h2>Not Owner</h2>;
  }

  return (
    <div className="only-owner-action">
      <h2 className="text-xl font-bold mb-4">Only Owner Actions</h2>
      <div className="space-y-4">
        {/* Create Withdrawal */}
        <div className="border border-gray-300 rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center">
            <p className="font-semibold">Create Withdrawal</p>
          </div>
          <div className="mt-2">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700">To Address</label>
              <input
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                type="text"
                placeholder="Enter address"
                onChange={onChangeAddrCreateTxn}
                value={toAddress}
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                type="number"
                step="0.000001"
                placeholder="Enter Eth Amount"
                onChange={onChangeEthCreateTxn}
              />
            </div>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 disabled:bg-red-300"
                disabled={!createWrite || createIsLoading}
                onClick={() => createWrite?.()}
              >
                {createIsLoading ? "Creating..." : "Create"}
              </button>
            </div>
            {createIsSuccess && (
              <div className="mt-3 text-green-500">
                Successfully created a withdrawal transaction!
                <div>
                  <a
                    href={`https://sepolia.basescan.org/tx/${createData?.hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 underline"
                  >
                    Etherscan
                  </a>
                </div>
              </div>
            )}
            {(prepareCreateIsError || createIsError) && (
              <div className="mt-3 text-red-500">
                Error: {(prepareCreateError || createError)?.message}
              </div>
            )}
          </div>
        </div>

        {/* Approve Withdrawal */}
        <div className="border border-gray-300 rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center">
            <p className="font-semibold">Approve Withdrawal</p>
          </div>
          <div className="mt-2">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700">Txn Id</label>
              <input
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                type="number"
                step="1"
                placeholder="Enter Id"
                onChange={(e) => setApproveId(parseInt(e.target.value))}
                value={approveId}
              />
            </div>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 disabled:bg-red-300"
                disabled={!approveWrite || approveIsLoading}
                onClick={() => approveWrite?.()}
              >
                {approveIsLoading ? "Approving..." : "Approve"}
              </button>
            </div>
            {approveIsSuccess && (
              <div className="mt-3 text-green-500">
                Successfully approved transaction ID #{approveId}!
                <div>
                  <a
                    href={`https://sepolia.basescan.org/tx/${approveData?.hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 underline"
                  >
                    Etherscan
                  </a>
                </div>
              </div>
            )}
            {(prepareApproveIsError || approveIsError) && (
              <div className="mt-3 text-red-500">
                Error: {(prepareApproveError || approveError)?.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnersActions;
