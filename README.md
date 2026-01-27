# Contoh Bot Discord Mutasiku / Mutasiku Discord Bot Example

![Build Status](https://github.com/Mutasiku-ID/node-mutasiku-discord-example/actions/workflows/build.yml/badge.svg)

[🇮🇩 Bahasa Indonesia](#bahasa-indonesia) | [🇬🇧 English](#english)

---

## Bahasa Indonesia

Contoh Discord bot yang menggunakan [mutasiku-sdk](https://github.com/Mutasiku-ID/node-mutasiku-sdk) untuk payment.

### Fitur

- Tombol payment dengan QRIS di Discord
- Webhook untuk notifikasi payment
- Lihat akun dan transaksi (admin only)

### Instalasi

```bash
npm install
cp .env.example .env
# Edit .env dengan credentials Anda
```

### Konfigurasi

```env
DISCORD_TOKEN=your-discord-bot-token
ADMIN_ROLE_ID=your-admin-role-id
MUTASIKU_API_KEY=your-api-key
MUTASIKU_WEBHOOK_SECRET=your-webhook-secret
MUTASIKU_WALLET_ID=your-wallet-account-id
WEBHOOK_PORT=3000
```

### Cara Menjalankan

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

### Commands

| Command | Deskripsi | Permission |
|---------|-------------|------------|
| `!pay` | Tampilkan tombol payment | Everyone |
| `!accounts` | Lihat connected accounts | Admin Role |
| `!transactions` | Transaksi terbaru | Admin Role |

### Cara Kerja

1. User ketik `!pay`
2. Bot tampilkan tombol jumlah payment
3. User klik tombol → Bot create QRIS payment via SDK
4. QRIS code tampil di Discord
5. User scan & bayar
6. Webhook notify bot → User dapat DM konfirmasi

### Menggunakan SDK

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

### Webhook Events

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

### Links

- [Mutasiku SDK](https://github.com/Mutasiku-ID/node-mutasiku-sdk)
- [npm package](https://www.npmjs.com/package/mutasiku-sdk)

### License

MIT

---

## English

Example Discord bot using [mutasiku-sdk](https://github.com/Mutasiku-ID/node-mutasiku-sdk) for payments.

### Features

- Payment buttons with QRIS displayed in Discord
- Webhook handling for payment notifications
- Account and transaction viewing (admin only)

### Installation

```bash
npm install
cp .env.example .env
# Edit .env with your credentials
```

### Configuration

```env
DISCORD_TOKEN=your-discord-bot-token
ADMIN_ROLE_ID=your-admin-role-id
MUTASIKU_API_KEY=your-api-key
MUTASIKU_WEBHOOK_SECRET=your-webhook-secret
MUTASIKU_WALLET_ID=your-wallet-account-id
WEBHOOK_PORT=3000
```

### Running

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

### Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `!pay` | Show payment buttons | Everyone |
| `!accounts` | View connected accounts | Admin Role |
| `!transactions` | Recent transactions | Admin Role |

### How It Works

1. User types `!pay`
2. Bot shows payment amount buttons
3. User clicks button → Bot creates QRIS payment via SDK
4. QRIS code displayed in Discord
5. User scans & pays
6. Webhook notifies bot → User gets DM confirmation

### Using the SDK

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

### Webhook Events

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

### Links

- [Mutasiku SDK](https://github.com/Mutasiku-ID/node-mutasiku-sdk)
- [npm package](https://www.npmjs.com/package/mutasiku-sdk)

### License

MIT License

Copyright (c) 2026 PT. Cobra Code Indonesia

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.