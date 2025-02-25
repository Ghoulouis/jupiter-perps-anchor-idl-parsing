import { IDL as DovesIDL } from "../idl/doves-idl";

import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { CUSTODY_DETAILS } from "./poll-and-stream-oracle-price-updates";
import { CUSTODY_PUBKEY } from "../constants";
import { BNToUSDRepresentation } from "../utils";

const connection = new Connection("https://api.mainnet-beta.solana.com");

const DOVES_PROGRAM_ID = new PublicKey("DoVEsk76QybCEHQGzkvYPWLQu9gzNoZZZt3TPiL597e");

const dovesProgram = new Program(
    DovesIDL,
    DOVES_PROGRAM_ID,
    new AnchorProvider(connection, new Wallet(Keypair.generate()), {
        preflightCommitment: "processed",
    })
);

interface DovesOraclePrice {
    price: BN;
    priceUsd: string;
    timestamp: number;
    expo: number;
}

export const getPriceEth = async () => {
    const feeds = await dovesProgram.account.priceFeed.fetch(CUSTODY_DETAILS[CUSTODY_PUBKEY.ETH].dovesOracle);

    const data: DovesOraclePrice = {
        price: feeds.price,
        priceUsd: BNToUSDRepresentation(feeds.price, Math.abs(feeds.expo)),
        timestamp: feeds.timestamp.toNumber(),
        expo: feeds.expo,
    };

    return data;
};
