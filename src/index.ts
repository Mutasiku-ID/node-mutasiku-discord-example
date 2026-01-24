/**
 * Mutasiku Discord Bot Example
 *
 * Example Discord bot using the official mutasiku-sdk for payments.
 *
 * Features:
 * - Payment buttons with QRIS display
 * - Webhook handling for payment notifications
 * - Account balance and transaction viewing
 */

import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Colors,
  ButtonInteraction,
} from 'discord.js';
import express, { Request, Response } from 'express';
import crypto from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const MutasikuSDK = require('mutasiku-sdk').default || require('mutasiku-sdk');

// ============================================
// Configuration
// ============================================

const config = {
  discord: {
    token: process.env.DISCORD_TOKEN!,
    adminRoleId: process.env.ADMIN_ROLE_ID!, // Role ID that can use !accounts and !transactions
  },
  mutasiku: {
    apiKey: process.env.MUTASIKU_API_KEY!,
    webhookSecret: process.env.MUTASIKU_WEBHOOK_SECRET!,
    walletAccountId: process.env.MUTASIKU_WALLET_ID!,
  },
  webhookPort: parseInt(process.env.WEBHOOK_PORT || '3000'),
};

// ============================================
// Initialize Mutasiku SDK
// ============================================

const mutasiku: any = new MutasikuSDK({
  apiKey: config.mutasiku.apiKey,
});

// ============================================
// Session Storage
// ============================================

interface PaymentSession {
  paymentId: string;
  externalId: string;
  userId: string;
  amount: number;
}

const sessions = new Map<string, PaymentSession>();

// ============================================
// Discord Client
// ============================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ============================================
// Embed Builders
// ============================================

function createPaymentEmbed(data: any): EmbedBuilder {
  const expiresAt = new Date(data.expiresAt);
  const timestamp = Math.floor(expiresAt.getTime() / 1000);

  const embed = new EmbedBuilder()
    .setTitle('📱 Scan QRIS to Pay')
    .setDescription('Scan the QR code below with any e-wallet (GoPay, OVO, DANA, etc.)')
    .setColor(Colors.Blue)
    .addFields(
      { name: '💰 Amount', value: `**Rp ${data.totalAmount.toLocaleString('id-ID')}**`, inline: true },
      { name: '⏰ Expires', value: `<t:${timestamp}:T> (<t:${timestamp}:R>)`, inline: true },
      { name: '🏦 Provider', value: data.provider.name, inline: true }
    )
    .setImage(data.qrisImage)
    .setFooter({ text: `Order ID: ${data.id}` })
    .setTimestamp();

  return embed;
}

function createSuccessEmbed(externalId: string, amount: number): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('✅ Payment Successful!')
    .setDescription('Thank you! Your payment has been received.')
    .setColor(Colors.Green)
    .addFields(
      { name: '💰 Amount', value: `Rp ${amount.toLocaleString('id-ID')}`, inline: true },
      { name: '🔖 Order', value: externalId, inline: true }
    )
    .setTimestamp();
}

function createExpiredEmbed(externalId: string, amount: number): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('⏰ Payment Expired')
    .setDescription('This payment has expired. Please create a new one.')
    .setColor(Colors.Red)
    .addFields(
      { name: '💰 Amount', value: `Rp ${amount.toLocaleString('id-ID')}`, inline: true },
      { name: '🔖 Order', value: externalId, inline: true }
    )
    .setTimestamp();
}

// ============================================
// Payment Handler
// ============================================

async function handlePayment(interaction: ButtonInteraction) {
  const amount = parseInt(interaction.customId.split('_')[1]);

  if (isNaN(amount)) {
    await interaction.reply({ content: '❌ Invalid amount', ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const externalId = `order-${Date.now()}`;

    // Create payment using SDK
    const result = await mutasiku.createPayment({
      type: 'QRIS-DYNAMIC',
      walletAccountId: config.mutasiku.walletAccountId,
      amount,
      externalId,
      customerName: interaction.user.username,
    });

    if (result.status !== 'success') {
      throw new Error(result.message || 'Payment creation failed');
    }

    // Create embed with QRIS
    const embed = createPaymentEmbed(result.data);
    await interaction.editReply({ embeds: [embed] });

    // Store session
    sessions.set(result.data.id, {
      paymentId: result.data.id,
      externalId,
      userId: interaction.user.id,
      amount,
    });

    console.log(`[Payment] Created: ${result.data.id} for ${interaction.user.tag}`);
  } catch (error: any) {
    console.error('[Payment] Error:', error);
    await interaction.editReply({ content: `❌ Failed: ${error.message}` });
  }
}

// ============================================
// Discord Events
// ============================================

client.on(Events.ClientReady, () => {
  console.log(`[Discord] Logged in as ${client.user?.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  if (message.content === '!pay') {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('pay_10000')
        .setLabel('Rp 10.000')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('💳'),
      new ButtonBuilder()
        .setCustomId('pay_50000')
        .setLabel('Rp 50.000')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('💳'),
      new ButtonBuilder()
        .setCustomId('pay_100000')
        .setLabel('Rp 100.000')
        .setStyle(ButtonStyle.Success)
        .setEmoji('💎')
    );

    await message.reply({ content: '**Choose payment amount:**', components: [row] });
  }

  if (message.content === '!accounts') {
    // Check if user has admin role
    const member = message.member;
    if (!member?.roles.cache.has(config.discord.adminRoleId)) {
      await message.reply('❌ You do not have permission to use this command.');
      return;
    }

    try {
      const result = await mutasiku.getAccounts();

      if (result.status === 'success' && result.data?.length) {
        const embed = new EmbedBuilder()
          .setTitle('💰 Connected Accounts')
          .setColor(Colors.Gold);

        for (const acc of result.data) {
          embed.addFields({
            name: acc.name || acc.provider?.name || 'Unknown',
            value: `Provider: ${acc.provider?.code || 'N/A'}\nBalance: Rp ${(acc.balance || 0).toLocaleString('id-ID')}\nStatus: ${acc.isActive ? '✅ Active' : '❌ Inactive'}`,
            inline: true,
          });
        }

        await message.reply({ embeds: [embed] });
      } else {
        await message.reply('No accounts found.');
      }
    } catch (error) {
      await message.reply('❌ Failed to fetch accounts.');
    }
  }

  if (message.content === '!transactions') {
    // Check if user has admin role
    const member = message.member;
    if (!member?.roles.cache.has(config.discord.adminRoleId)) {
      await message.reply('❌ You do not have permission to use this command.');
      return;
    }

    try {
      const result = await mutasiku.getMutasi({ days: 7, limit: 5 });
      if (result.status === 'success' && result.data?.length) {
        const embed = new EmbedBuilder()
          .setTitle('📜 Recent Transactions')
          .setColor(Colors.Blue);

        for (const tx of result.data.slice(0, 5)) {
          const icon = tx.type === 'CREDIT' ? '💚' : '💔';
          embed.addFields({
            name: `${icon} Rp ${tx.amount.toLocaleString('id-ID')}`,
            value: tx.description || 'No description',
            inline: false,
          });
        }

        await message.reply({ embeds: [embed] });
      } else {
        await message.reply('No transactions found.');
      }
    } catch (error) {
      await message.reply('❌ Failed to fetch transactions.');
    }
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton() && interaction.customId.startsWith('pay_')) {
    await handlePayment(interaction);
  }
});

// ============================================
// Webhook Server
// ============================================

const app = express();
app.use(express.json());

function verifySignature(data: any, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', config.mutasiku.webhookSecret)
    .update(JSON.stringify(data))
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

app.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['x-webhook-signature'] as string;

  if (!signature || !verifySignature(req.body.data, signature)) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  const { type, data } = req.body;
  console.log(`[Webhook] ${type}: ${data.id}`);

  const session = sessions.get(data.id) || sessions.get(data.paymentId);

  if (session) {
    try {
      const user = await client.users.fetch(session.userId);

      if (type === 'payment.completed') {
        await user.send({ embeds: [createSuccessEmbed(session.externalId, session.amount)] });
      } else if (type === 'payment.expired') {
        await user.send({ embeds: [createExpiredEmbed(session.externalId, session.amount)] });
      }

      sessions.delete(data.id);
    } catch (error) {
      console.error('[Webhook] Failed to notify user:', error);
    }
  }

  res.json({ received: true });
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ============================================
// Start
// ============================================

async function main() {
  app.listen(config.webhookPort, () => {
    console.log(`[Webhook] Listening on port ${config.webhookPort}`);
  });

  await client.login(config.discord.token);

  console.log('\n🚀 Bot is running!\n');
  console.log('Commands:');
  console.log('  !pay          - Payment buttons');
  console.log('  !accounts     - View accounts');
  console.log('  !transactions - Recent transactions\n');
}

process.on('SIGINT', async () => {
  await client.destroy();
  process.exit(0);
});

main().catch(console.error);
