import lighthouse from "@lighthouse-web3/sdk";

export default function (){
  const env = useRuntimeConfig().public
  const progress = ref(0)

  const progressCallback = (progressData: any) => {
    let percentageDone =
      100 - Number((progressData?.total / progressData?.uploaded)?.toFixed(2))
    progress.value = percentageDone
  }

  const uploadFile = async (file: any) => {
    const uploadResponse = await lighthouse.upload([file], env.lightHouseApiKey, undefined, progressCallback);
    return `https://gateway.lighthouse.storage/ipfs/${uploadResponse.data.Hash}`;
  }

  return {
    progress,
    uploadFile
  }
}