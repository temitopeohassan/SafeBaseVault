"use client";
import React from "react";
import ScContract from "./components/ScContract";
import Header from "./Header";
import Footer from "./Footer";
import { useAccount } from "wagmi";
import { toast } from "react-toastify";

export default function Home() {
  const { address, isConnected } = useAccount();

  React.useEffect(() => {
    if (isConnected && address) {
      toast(`Connected to ${address}`);
    }
  }, [isConnected, address]);

  return (
    <>
      <Header />
      {isConnected && <ScContract userAddress={address as `0x${string}`} />}
      <Footer />
    </>
  );
}