import { Connection, PublicKey } from '@solana/web3.js';
import { ESCROW_PROGRAM_ID } from './lib/solana';

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const taskId = 'cmlq2g3dn0001vuqmxwb2fl18';

  // Convert taskId to bytes
  const encoded = new TextEncoder().encode(taskId);
  const taskIdBytes = new Uint8Array(32);
  taskIdBytes.set(encoded.slice(0, 32));

  // Derive escrow PDA
  const [escrowPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), Buffer.from(taskIdBytes)],
    ESCROW_PROGRAM_ID
  );

  console.log('Escrow PDA:', escrowPda.toBase58());
  console.log('Task ID (hex):', Buffer.from(taskIdBytes).toString('hex'));

  const account = await connection.getAccountInfo(escrowPda);
  if (!account) {
    console.log('\n❌ Escrow account not found!');
    console.log('The lock_funds transaction may have failed or not been confirmed.');
    console.log('\nPossible solutions:');
    console.log('1. Check if the escrowTxId transaction was confirmed on Solana Explorer');
    console.log('2. Try accepting the bid again to re-lock funds');
    process.exit(1);
  } else {
    console.log('\n✅ Escrow account exists');
    console.log('Lamports:', account.lamports);
    console.log('Owner:', account.owner.toBase58());
    console.log('Expected owner (Escrow Program):', ESCROW_PROGRAM_ID.toBase58());
    console.log('Data length:', account.data.length);

    if (account.owner.toBase58() !== ESCROW_PROGRAM_ID.toBase58()) {
      console.log('\n⚠️  WARNING: Account owner mismatch!');
      console.log('The account exists but is not owned by the escrow program.');
    }

    // Try to parse escrow state
    if (account.data.length >= 8) {
      console.log('\nFirst 100 bytes (hex):', account.data.slice(0, 100).toString('hex'));
    }
  }
}

main().catch(console.error);
