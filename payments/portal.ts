import Portal from "@portal-hq/web";
const env = useRuntimeConfig().public;
export const portal = new Portal({
  apiKey: env.portalClientApiKey,
  autoApprove: true,
  rpcConfig: {
    [env.solanaChainId]: env.solanaRpcUrl,
  },
});
portal.triggerReady();
// portal.provider.on("portal_signatureReceived", async (data) => {
//   console.log(data);
// });

console.log("Portal", portal);

export const sendTokensOnSolana = async (requestId: number) => {
  if (!portal || !portal?.ready) throw new Error("Portal has not initialised");

  const res = await fetch(`${env.portalBackendUrl}/api/${ntobs58(requestId)}`, {
    method: "POST",
  });

  const data = await res.json();

  if (data.transactionHash) return data.transactionHash;

  if (data.error) throw new Error(data.error);

  const txnHash = await portal.request({
    chainId: env.solanaChainId,
    method: "sol_signAndSendTransaction",
    params: data.transaction,
  });

  if (!txnHash) throw new Error("Transaction failed");

  await fetch(`${env.portalBackendUrl}/api/payment/${requestId}`, {
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
