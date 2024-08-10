import "../assets/style/FactoryActions.css";
import { useState, ChangeEvent } from "react";
import { useWatchContractEvent, useWriteContract, useTransactionConfirmations } from "wagmi";
import { isAddress, Log, Abi } from "viem";
import { toast } from "react-toastify";
import factoryABI from "../artifacts/contracts/Factory.sol/Factory.json";
import useDebounce from "../hooks/useDebounce";

const factoryContract = {
  address: process.env.REACT_APP_FACTORY_ADDRESS as `0x${string}`,
  abi: factoryABI.abi as Abi,
};

interface FactoryActionsProps {
  userAddress: `0x${string}`;
  walletRefetch: () => void;
}

interface FormRow {
  id: number;
  address?: string;
}

function FactoryActions({ userAddress, walletRefetch }: FactoryActionsProps) {
  useWatchContractEvent({
    address: factoryContract.address,
    abi: factoryContract.abi,
    eventName: "WalletCreated",
    onLogs: (logs: Log[]) => {
      walletRefetch();
      const log = logs[0] as Log & { args: { sender: `0x${string}`, index: bigint } };
      if (log.args.sender === userAddress) {
        toast.success(`Wallet Id #${log.args.index.toString()} created!`);
      }
    },
  } as const);

  const [formRows, setFormRows] = useState<FormRow[]>([{ id: 1 }]);
  const [quoremRequired, setQuoremRequired] = useState<string>("");
  const debouncedQuorem = useDebounce(quoremRequired, 1500);

  const addAddressHandler = (index: number, address: string) => {
    const temp = [...formRows];
    temp[index]["address"] = address;
    setFormRows(temp);
  };

  const handleRmRow = () => {
    const temp = [...formRows];
    temp.pop();
    setFormRows(temp);
  };

  const prepareAddresses = () => {
    const validAddresses = formRows
      .filter((row): row is FormRow & { address: string } => 
        typeof row.address === 'string' && isAddress(row.address)
      )
      .map((row) => row.address as `0x${string}`);
    return validAddresses;
  };

  const { data: hash, writeContract } = useWriteContract();

  const { isLoading, isSuccess } = useTransactionConfirmations({
    hash,
  });

  const handleCreateWallet = () => {
    writeContract({
      address: factoryContract.address,
      abi: factoryContract.abi,
      functionName: 'createNewWallet',
      args: [prepareAddresses(), debouncedQuorem],
    });
  };

  return (
    <div className="create-wallet-section">
      <h2 className="text-xl font-bold mb-4">Create New Wallet</h2>
      <form>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Owner Address</label>
          <div>
            {formRows.map((row, index) => (
              <input
                key={row.id}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                type="text"
                placeholder={`Enter address ${row.id}`}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  addAddressHandler(index, e.target.value)
                }
              />
            ))}
          </div>
          <div className="flex space-x-2 mt-2">
            <button
              type="button"
              className="px-3 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600"
              onClick={() =>
                setFormRows([...formRows, { id: formRows.length + 1 }])
              }
            >
              Add
            </button>
            <button
              type="button"
              className="px-3 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600"
              onClick={() => {
                if (formRows.length > 1) {
                  handleRmRow();
                }
              }}
            >
              Remove
            </button>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Quorum</label>
          <input
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            type="number"
            step="1"
            placeholder="Enter a number"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setQuoremRequired(e.target.value)
            }
            value={quoremRequired}
          />
        </div>
        <button
          type="button"
          className="px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 disabled:bg-red-300"
          disabled={!writeContract || isLoading}
          onClick={handleCreateWallet}
        >
          {isLoading ? "Creating..." : "Create"}
        </button>
        {isSuccess && (
          <div className="mt-4 text-green-500">
            Created a new wallet successfully!
            <div>
              <a
                href={`https://sepolia.basescan.org/tx/${hash}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 underline"
              >
                Etherscan
              </a>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default FactoryActions;