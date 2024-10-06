import Portal from "@portal-hq/web";
const env = useRuntimeConfig().public;
export const portal = new Portal({
  apiKey: env.portalClientApiKey,
  autoApprove: true,
  rpcConfig: {
    [env.solanaChainId]: env.solanaRpcUrl,
  },
});

export const sendTokensOnSolana = async (
  to: any,
  tokenMint: any,
  tokenAmount: any
) => {
  portal.triggerReady();
  if (!portal || !portal?.ready) throw new Error("Portal has not initialised");

  const res = await buildSolanaTransaction(
    JSON.stringify({
      to,
      token: tokenMint,
      amount: String(tokenAmount),
    })
  );

  const data = await res.json();

  if (data.error) throw new Error(data.error);

  const txnHash = await portal.request({
    chainId: process.env.solanaChainId,
    method: "sol_signAndSendTransaction",
    params: data.transaction,
  });

  return txnHash;
};
