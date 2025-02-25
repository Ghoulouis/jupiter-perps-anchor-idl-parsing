import { PositionRequest } from "./types";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { generatePositionPda, generatePositionRequestPda } from "./examples/generate-position-and-position-request-pda";
import { AnchorProvider, BN, Wallet } from "@coral-xyz/anchor";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    CUSTODY_PUBKEY,
    JLP_POOL_ACCOUNT_PUBKEY,
    JUPITER_PERPETUALS_EVENT_AUTHORITY_PUBKEY,
    JUPITER_PERPETUALS_PROGRAM,
    JUPITER_PERPETUALS_PROGRAM_ID,
    RPC_CONNECTION,
} from "./constants";

import { config } from "dotenv";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { CUSTODY_DETAILS } from "./examples/poll-and-stream-oracle-price-updates";
import { getPriceEth } from "./examples/get-price-eth";
config();

async function main() {
    const pubWETH = new PublicKey(CUSTODY_DETAILS[CUSTODY_PUBKEY.ETH].mint);

    // let { position } = generatePositionPda({
    //     custody: new PublicKey("AQCGyheWPLeo6Qp9WpYS9m3Qj479t7R636N9ey1rEjEn"),
    //     collateralCustody: new PublicKey("AQCGyheWPLeo6Qp9WpYS9m3Qj479t7R636N9ey1rEjEn"),
    //     walletAddress: new PublicKey("64S8vTV3ScdaZzGfeEoTipkZX6EiYndv5Az2LWitZ5b3"),
    //     side: "long",
    // });

    // console.log(position.toBase58());

    // let { positionRequest } = generatePositionRequestPda({
    //     counter: new BN(537532847),
    //     positionPubkey: position,
    //     requestChange: "decrease",
    // });

    // console.log(positionRequest.toBase58());

    // let PositionRequestAta = await getAssociatedTokenAddress(pubWETH, positionRequest, true);
    // console.log(PositionRequestAta.toBase58());

    // Tạo provider với wallet

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

    let positionRequestAta = await getAssociatedTokenAddress(pubWETH, positionRequestEstimate.positionRequest, true);
    const privateKeyBytes = bs58.decode(process.env.PRIVATE_KEY!);
    const keypair = Keypair.fromSecretKey(privateKeyBytes);
    const wallet = new Wallet(keypair);
    const provider = new AnchorProvider(RPC_CONNECTION, wallet, { commitment: "confirmed" });
    const priceETH = await getPriceEth();

    console.log("Price:", priceETH);
    console.log("Counter:", positionRequestEstimate.counter.toString());

    const slippage = new BN(0.01); // 1%
    console.log("Slippage:", slippage.toString());
    const price = Math.round((0.99 * Number(priceETH.price)) / 100);
    console.log("Price:", price);

    const size = new BN(11000000);
    const collateralTokenDelta = new BN(400000);

    console.log("Expect:2677532981");

    console.log(`All parameter = 

    collateralUsdDelta: 0,
    sizeUsdDelta: 0,
    priceSlippage: ${price},
    jupiterMinimumOut: null,
    entirePosition: false,
    counter: ${positionRequestEstimate.counter.toString()},

    owner: ${owner.toBase58()}
    receivingAccount: ${receivingAccount.toBase58()}
    perpetuals: ${perpetuals.toBase58()}
    pool: ${pool.toBase58()}
    position: ${positionEstimate.position.toBase58()}
    positionRequest: ${positionRequestEstimate.positionRequest.toBase58()}
    positionRequestAta: ${positionRequestAta.toBase58()}
    custody: ${custody.toBase58()}
    collateralCustody: ${collateralCustody.toBase58()}
    desiredMint: ${pubWETH.toBase58()}
    referral: null
    tokenProgram: ${TOKEN_PROGRAM_ID.toBase58()}
    associatedTokenProgram: ${ASSOCIATED_TOKEN_PROGRAM_ID.toBase58()}
    systemProgram: ${new PublicKey("11111111111111111111111111111111").toBase58()}
    eventAuthority: ${JUPITER_PERPETUALS_EVENT_AUTHORITY_PUBKEY}
    program: ${JUPITER_PERPETUALS_PROGRAM_ID.toBase58()}`);

    const instruction = await JUPITER_PERPETUALS_PROGRAM.methods
        .createDecreasePositionMarketRequest({
            collateralUsdDelta: collateralTokenDelta,
            sizeUsdDelta: size,
            priceSlippage: new BN(price),
            jupiterMinimumOut: null,
            entirePosition: true,
            counter: positionRequestEstimate.counter,
        })
        .accounts({
            owner,
            receivingAccount,
            perpetuals,
            pool,
            position: positionEstimate.position,
            positionRequest: positionRequestEstimate.positionRequest,
            positionRequestAta: positionRequestAta,
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
        .instruction();

    // Tạo và gửi giao dịch
    const transaction = new Transaction().add(instruction);
    const txHash = await provider.sendAndConfirm(transaction, [keypair]);
    console.log("Transaction hash:", txHash);
}

main();
