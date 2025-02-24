import { generateToken } from '../utils/tokenUtils';

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error('Usage: npm run generate:token <payload>');
  process.exit(1);
}

const payload = JSON.parse(args[0]);
const token = generateToken(payload);
console.log(token);
