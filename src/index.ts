import { PositionRequest } from "./types";
import { PublicKey } from "@solana/web3.js";
import { generatePositionPda, generatePositionRequestPda } from "./examples/generate-position-and-position-request-pda";
import { BN } from "@coral-xyz/anchor";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { JUPITER_PERPETUALS_PROGRAM } from "./constants";

async function main() {
    let owner = new PublicKey("64S8vTV3ScdaZzGfeEoTipkZX6EiYndv5Az2LWitZ5b3");

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

    const call = JUPITER_PERPETUALS_PROGRAM.methods.createDecreasePositionMarketRequest();
}

main();
