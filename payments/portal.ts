import Portal from "@portal-hq/web";
const env = useRuntimeConfig().public;
export const portal = new Portal({
  apiKey: env.portalClientApiKey,
  autoApprove: true,
  rpcConfig: {
    [env.solanaChainId]: env.solanaRpcUrl,
  },
});

export const sendTokensOnSolana = async (requestId: number) => {
  portal.triggerReady();
  if (!portal || !portal?.ready) throw new Error("Portal has not initialised");

  const res = await fetch(`/api/${ntobs58(requestId)}`, {
    method: "POST",
  });

  const data = await res.json();

  if (data.error) throw new Error(data.error);

  const txnHash = await portal.request({
    chainId: env.solanaChainId,
    method: "sol_signAndSendTransaction",
    params: data.transaction,
  });

  if (!txnHash) throw new Error("Transaction failed");

  await fetch(`/api/payment/${requestId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requestId,
      transactionHash: txnHash,
    }),
  });

  return txnHash;
};
