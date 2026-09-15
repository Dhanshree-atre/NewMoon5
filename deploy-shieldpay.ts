/**
 * Deploy ShieldPay contract to Midnight Preprod.
 * Run with: npx tsx src/deploy-shieldpay.ts --network preprod
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { resolveNetwork, getOrCreateSeed, recordDeployment } from './network.js';
import { createWallet, persistWalletState, unshieldedToken, type WalletContext } from './wallet.js';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';
import * as Rx from 'rxjs';

import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';

// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

const PRIVATE_STATE_ID = 'shieldPayPrivateState';
const CONTRACT_NAME = 'shieldpay';

const { network, config: networkConfig } = resolveNetwork();
const SEED = getOrCreateSeed(network);

async function waitForProofServer(maxAttempts = 60, delayMs = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await fetch(networkConfig.proofServer, { method: 'GET', signal: AbortSignal.timeout(3000) });
      return true;
    } catch (err: any) {
      const code = err?.cause?.code || err?.code || '';
      if (code !== 'ECONNREFUSED' && code !== 'UND_ERR_CONNECT_TIMEOUT' && code !== 'UND_ERR_SOCKET') return true;
    }
    if (attempt < maxAttempts) {
      process.stdout.write('\r  Waiting for proof server... (' + attempt + '/' + maxAttempts + ')   ');
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return false;
}

// Point at the compiled ShieldPay contract (local to midnightproject to use correct node_modules)
const __dirname2 = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = path.resolve(__dirname2, '..', 'contracts', 'managed', 'shieldpay');
const contractPath = path.join(zkConfigPath, 'contract', 'index.js');

if (!fs.existsSync(contractPath)) {
  console.error('\n❌ ShieldPay contract not compiled!\n');
  process.exit(1);
}

const ShieldPay = await import(pathToFileURL(contractPath).href);
const compiledContract = CompiledContract.make(CONTRACT_NAME, ShieldPay.Contract).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);

async function createProviders(walletCtx: WalletContext) {
  const privateStatePassword = process.env.PRIVATE_STATE_PASSWORD?.trim() || 'ShieldPay-Preprod-Development-Key-1';
  const walletProvider = {
    getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      return walletCtx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };
  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  const accountId = walletCtx.unshieldedKeystore.getBech32Address().toString();
  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'shieldpay-state',
      accountId,
      privateStoragePasswordProvider: () => privateStatePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  ShieldPay Deploy → ' + network + ' '.repeat(Math.max(0, 28 - network.length)) + '║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  console.log('Creating wallet...');
  const walletCtx = await createWallet({ network, networkConfig, seed: SEED });
  console.log('Syncing with network (may take several minutes)...');
  const state = await walletCtx.wallet.waitForSyncedState();
  await persistWalletState(network, walletCtx);

  const address = walletCtx.unshieldedKeystore.getBech32Address();
  const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
  console.log('Wallet: ' + address);
  console.log('tNIGHT balance: ' + balance.toLocaleString() + '\n');

  if (balance === 0n && network !== 'undeployed') {
    console.log('Fund this address from the faucet: ' + networkConfig.faucet);
    console.log('Then re-run this script.\n');
    await walletCtx.wallet.stop();
    process.exit(1);
  }

  // Register for DUST
  const dustState = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter((s) => s.isSynced)));
  const unregisteredUtxos = dustState.unshielded.availableCoins.filter((c: any) => !c.meta?.registeredForDustGeneration);
  if (unregisteredUtxos.length > 0) {
    console.log('Registering ' + unregisteredUtxos.length + ' NIGHT UTXOs for DUST...');
    const recipe = await walletCtx.wallet.registerNightUtxosForDustGeneration(
      unregisteredUtxos,
      walletCtx.unshieldedKeystore.getPublicKey(),
      (payload: any) => walletCtx.unshieldedKeystore.signData(payload),
    );
    const finalized = await walletCtx.wallet.finalizeRecipe(recipe);
    await walletCtx.wallet.submitTransaction(finalized);
  }
  if (dustState.dust.balance(new Date()) === 0n) {
    console.log('Waiting for DUST tokens...');
    await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(
        Rx.throttleTime(5000),
        Rx.filter((s) => s.isSynced),
        Rx.filter((s) => s.dust.balance(new Date()) > 0n),
      ),
    );
  }
  console.log('DUST ready!\n');

  console.log('Checking proof server on port 6300...');
  if (!(await waitForProofServer())) {
    console.error('❌ Proof server not responding on localhost:6300\n');
    await walletCtx.wallet.stop();
    process.exit(1);
  }
  console.log('Proof server ready!\n');

  console.log('Deploying ShieldPay contract...\n');
  const providers = await createProviders(walletCtx);
  await new Promise((r) => setTimeout(r, 6000));

  let deployed: any;
  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      deployed = await deployContract(providers, {
        compiledContract: compiledContract as any,
        args: [],
        privateStateId: PRIVATE_STATE_ID,
        initialPrivateState: {},
      });
      break;
    } catch (err: any) {
      const msg = err?.message || '';
      const isDust =
        msg.includes('Not enough Dust') ||
        msg.includes('Insufficient Funds') ||
        msg.includes('could not balance dust');
      if (!isDust) throw err;
      if (attempt < 20) {
        console.log('DUST not ready yet, retry ' + attempt + '/20...');
        await new Promise((r) => setTimeout(r, 5000));
      } else {
        console.error('❌ Not enough DUST after 20 retries');
        await walletCtx.wallet.stop();
        process.exit(1);
      }
    }
  }

  const contractAddress = deployed.deployTxData.public.contractAddress;
  console.log('\n✅ ShieldPay deployed successfully!');
  console.log('   Contract Address: ' + contractAddress + '\n');

  recordDeployment(network, contractAddress, address.toString());

  const outputPath = '/mnt/c/Users/ASUS/OneDrive/Desktop/NewMoonLevel4/contract-address.json';
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        network,
        contractAddress,
        deployedAt: new Date().toISOString(),
        deployer: address.toString(),
      },
      null,
      2,
    ),
  );
  console.log('Saved to contract-address.json\n');

  await persistWalletState(network, walletCtx);
  await walletCtx.wallet.stop();
  console.log('Done!\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
