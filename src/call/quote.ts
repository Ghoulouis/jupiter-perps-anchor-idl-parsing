// Định nghĩa kiểu dữ liệu cho payload
interface IncreasePositionPayload {
    walletAddress: string;
    marketMint: string;
    inputMint: string;
    collateralMint: string;
    side: "long" | "short";
    leverage: string;
    maxSlippageBps: string;
    collateralTokenDelta: string;
    includeSerializedTx: boolean;
}

// API URL và headers
const apiUrl: string = "https://perps-api.jup.ag/v1/positions/increase";
const headers: any = {
    "Content-Type": "application/json",
};

// Payload dữ liệu
const payload: IncreasePositionPayload = {
    walletAddress: "64S8vTV3ScdaZzGfeEoTipkZX6EiYndv5Az2LWitZ5b3",
    marketMint: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    inputMint: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    collateralMint: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    side: "long",
    leverage: "1.1",
    maxSlippageBps: "200",
    collateralTokenDelta: "400000",
    includeSerializedTx: true,
};

// Hàm gửi yêu cầu POST
export async function increasePosition() {
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error:", error);
    }
}
