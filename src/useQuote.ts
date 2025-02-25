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
        // Tạo ví từ private key
        const privateKeyBytes = bs58.decode(process.env.PRIVATE_KEY!);
        const keypair = Keypair.fromSecretKey(privateKeyBytes);
        const wallet = new Wallet(keypair);
        const provider = new AnchorProvider(RPC_CONNECTION, wallet, { commitment: "confirmed" });

        // Chuỗi serializedTxBase64 từ quote
        const serializedTx =
            "AwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsRanM0RmEicKqIET11CxfhLbBIzXepdkHD1auJVj1f91y3JlvXr0B7F0cEsn+mE6V5jC4/GQH0dz46vubOBTB4ADAgYTSyuZXWEa+BPg3XxgdBUfey41tLdMH2oJzP8r/1oaTdaPuB0qGDbYUrysLLqQjPfsF3hWtuANsfmvt+D3/4t0uQw1GvIXzKcTVr88ZcQmTNVM4iLYZ6MsJgxi/m7iFdmhfAl9tefiQz8KOqmXvtSBU+SWHiZ6+Jlxs+OaCNE6BNT9TEiHoKMLNkz7PYjZNpEQpuMJyrrxLM6pb90EsXWKleTH1bLdjEMF1YzEy8ueP++LYelOtLV1UwORx7X4cWF7vNYbfZTVx8tpG1aJi0pgB7XP8hnOVKOaOH/gOIaQzdLJD7R7MrykQ+ZBtfBnxPPc7nb9gAKhPbS/SITgDsPVtIe1I/p3Gy551653GdDPX3KX0D4dWPXyZvsBemb3XlwHtDzjO+3MXtbOJn+fRoGYb0OAQqT+40h4JRYr4myVymvYlxJTBVNvf/6Ktgl1RI2flwkmmblOo5urb/TpgoqcqoE+k8xVIuKVEW5PkUwQFm1Z+D7amMP5YmbtoBIcRfi3MfXjl4Bic5RUKQnJuAxR/Z2OxWKTNId/rmxNlGw5OEcDBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAAIyXJY9OJInxuz0QKRSODYMLWhOZ2v8QhASOe9jb6fhZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFsfPK8ZRi74dg8Kvedc09nuMbOjLGIOiUEi6cm4FF+gR51VvyMcBu7nTFbs5oFQf9sbLeo/SOUQKxzaJWvBOPBUpTWpkpIQZNJOhxYNo4fHw1td28kruB5B+oQEEFRI3gy+txmicN6yULndiciw4Ip0SNOYz1xO1o4Ikzaou3ywYNAAUCjFwFAA0ACQMosQEAAAAAAA4GAAMAIA8hAQEQAwQDIQjkVblwTk9NAhErISIABQYHAyMgEREkESwhIRIiFyUjCBgGGQkKCxotLhsiCAccHR4fIS8vMCrBIJszQdacgQYCAAAALwAAZAABGWQBAoAaBgAAAAAAIi6ZAAAAAABkAAAQFAECAAMmEwwUJygVKSoWBBAhDysQIqR+RLbfpkC3X1eoAAAAAAAAAr6gDJQAAAAA5y29ZwAAAAADhTKH0Vgo2lXAnG7EgCWS6VyHk72rUO4QUJgiA02IkzUEAwkREwwSJR8KIQYAMS00LiJFHp2+Bm3UNp0rJU5O0vHDC5kWPZewfnf5KVjOCNnEKQQADxQSAQPaPXgX4+NThv0V83XX6UI4/kChgKeZEox3sbxohfBHHwVOUVJLTARQSk1P";

        // Deserialize giao dịch
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
