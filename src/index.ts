import { PositionRequest } from "./types";
import { Keypair, PublicKey } from "@solana/web3.js";
import { generatePositionPda, generatePositionRequestPda } from "./examples/generate-position-and-position-request-pda";
import { BN, Wallet } from "@coral-xyz/anchor";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    CUSTODY_PUBKEY,
    JLP_POOL_ACCOUNT_PUBKEY,
    JUPITER_PERPETUALS_EVENT_AUTHORITY_PUBKEY,
    JUPITER_PERPETUALS_PROGRAM,
    JUPITER_PERPETUALS_PROGRAM_ID,
} from "./constants";

import { config } from "dotenv";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
config();

async function main() {
    let { position } = generatePositionPda({
        custody: new PublicKey("AQCGyheWPLeo6Qp9WpYS9m3Qj479t7R636N9ey1rEjEn"),
        collateralCustody: new PublicKey("AQCGyheWPLeo6Qp9WpYS9m3Qj479t7R636N9ey1rEjEn"),
        walletAddress: new PublicKey("64S8vTV3ScdaZzGfeEoTipkZX6EiYndv5Az2LWitZ5b3"),
        side: "long",
    });

    console.log(position.toBase58());

    let { positionRequest } = generatePositionRequestPda({
        counter: new BN(537532847),
        positionPubkey: position,
        requestChange: "decrease",
    });

    console.log(positionRequest.toBase58());
    const pubWETH = new PublicKey("7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs");
    let PositionRequestAta = await getAssociatedTokenAddress(pubWETH, positionRequest, true);
    console.log(PositionRequestAta.toBase58());

    console.log(" Create ranom a long ETH position");
    let owner = new PublicKey("64S8vTV3ScdaZzGfeEoTipkZX6EiYndv5Az2LWitZ5b3");
    // https://solscan.io/tx/282AvKvstdXCiWgLyhgCrFZGbnt85MdXeeP6ojkP3DszvGqjcqdyuXcNHg7dmH643BxMF3R1E3CEhWJuQcJEEuzJ
    let receivingAccount = new PublicKey("GQ4h23QyULsQm7vJsaahmRoTE2ejjLyLXQd9HAZjsdb8");
    // Jupiter Perpetuals State
    // https://solscan.io/tx/282AvKvstdXCiWgLyhgCrFZGbnt85MdXeeP6ojkP3DszvGqjcqdyuXcNHg7dmH643BxMF3R1E3CEhWJuQcJEEuzJ
    let perpetuals = new PublicKey("H4ND9aYttUVLFmNypZqLjZ52FYiGvdEB45GmwNoKEjTj");
    let pool = new PublicKey(JLP_POOL_ACCOUNT_PUBKEY);
    let custody = new PublicKey(CUSTODY_PUBKEY.ETH);
    let collateralCustody = new PublicKey(CUSTODY_PUBKEY.ETH);

    let positionEstimate = generatePositionPda({
        custody,
        collateralCustody,
        walletAddress: owner,
        side: "long",
    });

    let positionRequestEstimate = generatePositionRequestPda({
        positionPubkey: positionEstimate.position,
        requestChange: "decrease",
    });

    let positionRequestAta = await getAssociatedTokenAddress(pubWETH, positionRequest, true);
    const privateKeyBytes = bs58.decode(process.env.PRIVATE_KEY!);
    const keypair = Keypair.fromSecretKey(privateKeyBytes);
    const wallet = new Wallet(keypair);

    console.log("Wallet", wallet.publicKey.toBase58());
    return;
    const call = JUPITER_PERPETUALS_PROGRAM.methods
        .createDecreasePositionMarketRequest({
            collateralUsdDelta: positionRequest,
            sizeUsdDelta: position,
            priceSlippage: owner,
            jupiterMinimumOut: null,
            entirePosition: new BN(1000000000),
            counter: new BN(1000000000),
        })
        .accounts({
            owner,
            receivingAccount,
            perpetuals,
            pool,
            position,
            positionRequest: positionEstimate.position,
            positionRequestAta: positionRequestEstimate.positionRequest,
            custody,
            collateralCustody,
            desiredMint: pubWETH,
            referral: null,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: new PublicKey("11111111111111111111111111111111"),
            eventAuthority: new PublicKey(JUPITER_PERPETUALS_EVENT_AUTHORITY_PUBKEY),
            program: JUPITER_PERPETUALS_PROGRAM_ID,
        })
        .rpc();
}

main();
