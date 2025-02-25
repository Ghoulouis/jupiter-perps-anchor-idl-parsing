import { Keypair, PublicKey, Transaction, Connection, VersionedTransaction, SendOptions } from "@solana/web3.js";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { config } from "dotenv";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

// Cấu hình environment variables
config();

// Định nghĩa RPC connection
const RPC_CONNECTION = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

async function sendTransaction() {
    try {
    } catch (error) {
        console.error("Lỗi chi tiết:", error);
    }
}

sendTransaction();
