### Match - Connecting Buyers and Sellers on Solana

---

**Match** is a decentralized application (dApp) built on the Solana platform that connects buyers with sellers, allowing them to find the best deals on products and services. Using smart contracts on Solana, Match ensures secure, transparent, and efficient transactions between parties.

### Team and Project Introduction

Our team consists of **Favour**, a Frontend Developer, and **David (DavyKing)**, a Blockchain Developer. With extensive experience in blockchain development, we've worked on various projects that leverage smart contract technologies to create secure and scalable applications. **Match** is our latest innovation, designed to address the challenges of connecting buyers and sellers in a decentralized, trustless environment using the unique capabilities of Solana.

### Project Summary

**Match** aims to create a seamless, secure, and efficient marketplace on the Solana network. By utilizing Solana's fast, fair, and secure consensus mechanism, Match allows sellers to create and manage offers for products or services, while buyers can easily browse, accept, and complete transactions. The dApp leverages smart contracts to ensure that all interactions are transparent and tamper-proof. This approach addresses the issues of trust and security that often plague traditional online marketplaces.

Our solution is evaluated based on the following criteria:

1. **Innovation:** Match introduces a novel way of connecting buyers and sellers through a decentralized platform.
2. **Technical Complexity:** The use of smart contracts on Solana and integration with Anchor demonstrates a high level of technical expertise.
3. **Usability:** The user interface built with Nuxt ensures a smooth user experience.
4. **Impact:** By decentralizing the marketplace, Match reduces the risk of fraud and increases transparency.
5. **Scalability:** Built on Solana, Match can handle a high volume of transactions with minimal latency.
6. **Security:** Solana's consensus mechanism ensures that all transactions are secure and immutable.
7. **Sustainability:** Match is designed to be energy-efficient, leveraging Solana's low power consumption.

### Key Features

- **Create Offers:** Sellers can create offers for products or services, specifying price, images, and related details.
- **Accept Offers:** Buyers can review and accept offers that best meet their needs.
- **View Offers:** Buyers can view all offers related to their requests and select the most suitable one.
- **Create Request:** Buyers can create specific requests for products or services they need, allowing sellers to respond with tailored offers.
- **Get Request Details:** Users can retrieve detailed information about requests, including seller IDs and offer images.
- **Store Management:** Sellers can manage their stores, including viewing store details and retrieving store IDs.

### How It Works

1. **Smart Contracts:** Match utilizes smart contracts deployed on the Solana network. These contracts handle the creation, management, and retrieval of offers, requests, and user stores.

2. **Connection via Anchor Provider:** The dApp connects to users' Solana accounts using Anchor Framework, enabling secure transactions and contract interactions.

3. **Contract Interactions:**
   - **CreateOffer:** Sellers can create an offer with specified parameters.
   - **AcceptOffer:** Buyers can accept an offer, initiating the transaction process.
   - **Create Request:** Buyers can create specific requests for products or services they need, allowing sellers to respond with tailored offers.
   - **GetOffer:** Retrieve detailed information about a specific offer.
   - **GetRequest:** Retrieve details about a specific buyer request.
   - **GetUserStore:** Retrieve store information for a specific user.
   - **GetUserStoreIds:** Get all store IDs associated with a user.
   - **GetBuyerOffers:** Retrieve all offers related to a buyer's request.
   - **GetOfferImages:** Retrieve all images associated with a specific offer.
   - **GetRequestSellerIds:** Retrieve all seller IDs associated with a specific request.

### Demo

Check out our demo video to see Match in action! The video showcases the technical strengths, usability, and performance of our solution. Watch the walkthrough on [YouTube](https://www.youtube.com/watch?v=fVnm9ttV68o) to learn more about how Match can revolutionize the marketplace experience on Solana.


### Portal Integration with Match

We integrate **Portal** for handling Solana transactions in Match.

#### Setup Portal in Your Application

1. **Install the Portal SDK**:
   Make sure you have the Portal SDK installed in your project:
   
   ```bash
   yarn add @portal-hq/web
   ```

2. **Initialize Portal**:
   In your project, you can initialize the Portal instance by creating a file for the configuration.

   ```js
   import Portal from "@portal-hq/web";
   const env = useRuntimeConfig().public;

   export const portal = new Portal({
     apiKey: env.portalClientApiKey,  // Portal client API key from your environment variables
     autoApprove: true,                // Enable auto-approval of transactions
     rpcConfig: {
       [env.solanaChainId]: env.solanaRpcUrl,  // Set RPC URL for the Solana chain
     },
   });

   portal.triggerReady();  // Initialize the Portal instance
   ```

3. **Sending Tokens on Solana Using Portal**:

   You can create a function to send tokens on Solana through the Portal interface.

   ```ts
   export const sendTokensOnSolana = async (requestId: number) => {
     if (!portal || !portal?.ready) {
       throw new Error("Portal has not been initialized");
     }

     // Fetch the transaction data from your backend
     const res = await fetch(`${env.portalBackendUrl}/api/${ntobs58(requestId)}`, {
       method: "POST",
     });

     const data = await res.json();

     // Check if a transaction hash was returned
     if (data.transactionHash) return data.transactionHash;

     if (data.error) throw new Error(data.error);

     // Request signature and send transaction using Portal
     const txnHash = await portal.request({
       chainId: env.solanaChainId,                   // Solana chain ID
       method: "sol_signAndSendTransaction",         // Method to sign and send transaction
       params: data.transaction,                     // Pass the transaction data
     });

     if (!txnHash) throw new Error("Transaction failed");

     // Notify your backend of the completed transaction
     await fetch(`${env.portalBackendUrl}/api/payment/${requestId}`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         requestId,              // Send the requestId and transaction hash to the backend
         transactionHash: txnHash,
       }),
     });

     return txnHash;   // Return the transaction hash as confirmation
   };
   ```

### Key Components of Portal Integration

1. **Portal Initialization**: The `portal` instance is initialized with the API key, RPC configurations, and options for handling Solana transactions.
2. **Transaction Handling**: The `sendTokensOnSolana` function triggers the Portal SDK to handle transaction signing and submission. It fetches transaction details from the backend, processes the transaction, and submits the transaction hash back to the server.


### Future Roadmap

**Key Learnings:**

- The importance of a seamless user experience in dApps.
- The need for robust smart contract design to handle a wide range of marketplace scenarios.

**Next Steps:**

- **Enhanced User Profiles:** Adding more features to user profiles, including ratings and reviews.
- **Multi-Language Support:** Expanding the dApp's accessibility by supporting multiple languages.
- **Advanced Analytics:** Providing sellers with detailed analytics to better understand buyer behavior.
- **Mobile App Development:** Extending the platform to mobile devices to reach a broader audience.
- **Integration with Other Networks:** Exploring the possibility of integrating with other blockchain networks to offer cross-chain transactions.

### Setup Instructions

1. **Clone the Repository:**

   ```bash
   git https://github.com/Kingsmen-hackers/match-solana
   cd match-solana
   ```

2. **Install Dependencies:**

   ```bash
   yarn install
   ```

3. **Configure Environment Variables:**

   Create a `.env` file in the root directory and add the following variables:

   ```bash
   LIGHTHOUSE_API_KEY = 274f65XXXXXXX47
   MATCH_API_URL = https://finder-backend-evm.onrender.com
   CONTRACT_ID = gSh52u5Nt39rb8CSHQhUhF1cSdFsL9JebSoPZmazFrZ
   CHAIN_ID = 97
   GOOGLE_MAPS_API_KEY = AIzaSXXXXXXXXXIPepz_29
   SOLANA_RPC_URL = https://little-intensive-patina.solana-devnet.quiknode.pro/bcXXXXXXXXa7b578
   PORTAL_CLIENT_API_KEY=04065XXXXXXXb0605bf
   SOLANA_CHAIN_ID = solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1
   SOL_MINT = SOL
   PY_USD_MINT = CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM
   TIME_TILL_LOCK = 1 * 60 * 1000
   MONGO_URI=mongodb+srv://<username>:<password>@el6be.mongodb.net/payment_info
   PORTAL_BACKEND_URL=https://portal-backend-r9rk.onrender.com
   ```

4. **Start the Development Server:**

   ```bash
   yarn start
   ```

5. **Build for Production:**

   ```bash
   yarn build
   ```

6. **Deploy the Application:**

   Deploy the built application to your preferred hosting service.

### Usage

- **Creating Request:** Buyers can log in, create new request by providing the necessary details (name, description, images, etc.), and list them on the platform.
- **Creating Offers:** Sellers can log in, create new offers to a buyers request by providing the necessary details (price, images, etc.), and list them on the platform.
- **Accepting Offers:** Buyers can browse offers related to their requests, accept the most suitable ones, and initiate transactions.
- **Managing Stores:** Sellers can manage their stores, view store details, and retrieve all their store IDs.

### Contracts

- https://github.com/kingsmennn/match-contract-solana

### Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes. Ensure that your code adheres to the existing code style and includes appropriate test coverage.

### License

Match is licensed under the MIT License.

---

With Match, experience a seamless, secure, and efficient marketplace on the Solana network, where buyers and sellers connect with confidence.

# match-solana
