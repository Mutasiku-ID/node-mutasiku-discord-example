# Mutasiku Discord Bot Example

![Build Status](https://github.com/Mutasiku-ID/node-mutasiku-discord-example/actions/workflows/ci.yml/badge.svg)

Example Discord bot using [mutasiku-sdk](https://github.com/Mutasiku-ID/node-mutasiku-sdk) for payments.

## Features

- Payment buttons with QRIS displayed in Discord
- Webhook handling for payment notifications
- Account and transaction viewing (admin only)

## Installation

```bash
npm install
cp .env.example .env
# Edit .env with your credentials
```

## Configuration

```env
DISCORD_TOKEN=your-discord-bot-token
ADMIN_ROLE_ID=your-admin-role-id
MUTASIKU_API_KEY=your-api-key
MUTASIKU_WEBHOOK_SECRET=your-webhook-secret
MUTASIKU_WALLET_ID=your-wallet-account-id
WEBHOOK_PORT=3000
```

## Running

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

## Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `!pay` | Show payment buttons | Everyone |
| `!accounts` | View connected accounts | Admin Role |
| `!transactions` | Recent transactions | Admin Role |

## How It Works

1. User types `!pay`
2. Bot shows payment amount buttons
3. User clicks button → Bot creates QRIS payment via SDK
4. QRIS code displayed in Discord
5. User scans & pays
6. Webhook notifies bot → User gets DM confirmation

## Using the SDK

```typescript
import MutasikuSDK from 'mutasiku-sdk';

const mutasiku = new MutasikuSDK({
  apiKey: 'your-api-key'
});

// Create QRIS payment
const payment = await mutasiku.createPayment({
  type: 'QRIS-DYNAMIC',
  walletAccountId: 'wallet-id',
  amount: 50000,
  externalId: 'order-123',
  customerName: 'John'
});

// Get accounts
const accounts = await mutasiku.getAccounts();

// Get transactions
const transactions = await mutasiku.getMutasi({ days: 7 });

// Check payment status
const status = await mutasiku.getPaymentStatus('payment-id');
```

## Webhook Events

**payment.completed**
```json
{
  "type": "payment.completed",
  "data": {
    "id": "payment-id",
    "amount": 50000,
    "status": "PAID"
  }
}
```

**payment.expired**
```json
{
  "type": "payment.expired",
  "data": {
    "id": "payment-id",
    "amount": 50000,
    "status": "EXPIRED"
  }
}
```

## Links

- [Mutasiku SDK](https://github.com/Mutasiku-ID/node-mutasiku-sdk)
- [npm package](https://www.npmjs.com/package/mutasiku-sdk)

## License

MIT
