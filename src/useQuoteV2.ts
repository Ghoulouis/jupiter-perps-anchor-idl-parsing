import { Keypair, PublicKey, Transaction, Connection, VersionedTransaction, SendOptions } from "@solana/web3.js";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { config } from "dotenv";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { increasePosition } from "./call/quote";

// Cấu hình environment variables
config();

// Định nghĩa RPC connection
const RPC_CONNECTION = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

async function sendTransaction() {
    try {
        const privateKeyBytes = bs58.decode(process.env.PRIVATE_KEY!);
        const keypair = Keypair.fromSecretKey(privateKeyBytes);
        const wallet = new Wallet(keypair);
        const provider = new AnchorProvider(RPC_CONNECTION, wallet, { commitment: "confirmed" });
        const quote: any = await increasePosition();

        const serializedTx = quote["serializedTxBase64"];

        console.log("Serialized giao dịch:", serializedTx);
        // // Deserialize giao dịch
        const transaction = VersionedTransaction.deserialize(Buffer.from(serializedTx, "base64"));

        const numRequiredSignatures = transaction.message.header.numRequiredSignatures;
        const signers = transaction.message.staticAccountKeys.slice(0, numRequiredSignatures);
        console.log(
            "Signers cần thiết:",
            signers.map((key) => key.toBase58())
        );
        console.log("Ví của bạn:", keypair.publicKey.toBase58());

        console.log("Số chữ ký cần thiết:", numRequiredSignatures);
        console.log(
            "Danh sách chữ ký hiện tại:",
            transaction.signatures.map((sig, i) => `${i}: ${sig ? Buffer.from(sig).toString("hex") : "Chưa ký"}`)
        );
        const recentBlockhash = await RPC_CONNECTION.getLatestBlockhash();
        transaction.message.recentBlockhash = recentBlockhash.blockhash;

        // Kiểm tra yêu cầu keeper signature
        const requiresKeeper = true; // Từ quote: "requireKeeperSignature": true
        const signedCount = transaction.signatures.filter((sig) => sig !== null).length;
        if (requiresKeeper && signedCount < numRequiredSignatures) {
            console.log("Giao dịch yêu cầu chữ ký từ keeper!");
            console.log("Bạn cần chữ ký từ keeper trước khi gửi. Ví của bạn chỉ có thể ký phần của mình.");

            // Ký phần của bạn nếu bạn là signer hợp lệ
            const signerIndex = signers.findIndex((key) => key.equals(keypair.publicKey));
            if (signerIndex !== -1) {
                transaction.sign([keypair]);
                console.log("Đã ký bởi ví của bạn. Cần gửi đến keeper để ký thêm.");
            } else {
                throw new Error("Ví của bạn không nằm trong danh sách signer cần thiết!");
            }

            // Serialize giao dịch đã ký một phần
            const partiallySignedTx = Buffer.from(transaction.serialize()).toString("base64");
            console.log("Serialized giao dịch sau khi ký bởi bạn:", partiallySignedTx);
            console.log("Hãy gửi chuỗi này đến keeper hoặc dịch vụ của Jupiter để ký thêm.");
            return;
        } else {
            // Nếu không cần keeper hoặc đã đủ chữ ký, ký và gửi trực tiếp

            transaction.sign([keypair]);
            console.log("Đang gửi giao dịch...");

            const sendOptions: SendOptions = {
                skipPreflight: false,
                preflightCommitment: "confirmed",
            };
            const txHash = await RPC_CONNECTION.sendTransaction(transaction, sendOptions);
            console.log("Transaction hash:", txHash);

            // Xác minh trạng thái giao dịch
            const confirmation = await RPC_CONNECTION.getTransaction(txHash, { commitment: "confirmed" });
            console.log("Trạng thái giao dịch:", confirmation?.meta?.err ? "Thất bại" : "Thành công");
        }
    } catch (error) {
        console.error("Lỗi chi tiết:", error);
    }
}

sendTransaction();
