#!/usr/bin/env node

import bcrypt from "bcryptjs";
import readline from "readline";
import crypto from "crypto";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askPassword() {
  return new Promise(resolve => {
    rl.question("Enter your family password: ", password => {
      resolve(password);
    });
  });
}

async function main() {
  console.log("=== Chorizo Family Password Setup ===\n");
  console.log("This script will generate a secure hash of your family password.");
  console.log("Choose something memorable but secure - your kids will need to type this.\n");

  const password = await askPassword();

  if (password.length < 6) {
    console.error("\n❌ Password should be at least 6 characters for security");
    process.exit(1);
  }

  console.log("\nGenerating secure hash...");
  const hash = await bcrypt.hash(password, 10);

  // Encode the hash in base64 to avoid special character issues
  const encodedHash = Buffer.from(hash).toString("base64");
  const jwtSecret = crypto.randomBytes(32).toString("base64");

  console.log("\n✅ Success! Add these to your environment variables:\n");
  console.log(`FAMILY_PASSWORD_HASH_B64="${encodedHash}"`);
  console.log(`JWT_SECRET="${jwtSecret}"`);

  console.log("\nFor Vercel deployment:");
  console.log("1. Go to your project settings in Vercel");
  console.log("2. Navigate to Environment Variables");
  console.log("3. Add both FAMILY_PASSWORD_HASH_B64 and JWT_SECRET");
  console.log("4. Redeploy your application");

  console.log("\nFor local development:");
  console.log("1. Add these to your .env.local file");
  console.log("2. Restart your development server");

  console.log("\nNOTE: We're using base64 encoding to avoid shell escaping issues.");

  rl.close();
}

main().catch(console.error);
