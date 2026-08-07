import { NextRequest, NextResponse } from 'next/server';
import { listShopEntities, newEntityId, putShopEntity } from '@/lib/dynamodb-shop';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const API_KEY = process.env.AI_CHATBOT_API_KEY || 'pk-CMmufLMnjNkpBbzDHLiwngOmKsUsYVkLXMSCMzvBlIIMIwUn';
const API_ENDPOINT = process.env.AI_CHATBOT_ENDPOINT || 'https://api.openai.com/v1';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let userPrompt = '';
    let imageDataUrl: string | null = null;
    let history: { role: 'user' | 'assistant'; content: string }[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      userPrompt = (formData.get('prompt') as string) || '';
      const file = formData.get('image') as File | null;
      const historyJson = formData.get('history') as string | null;
      if (historyJson) {
        try { history = JSON.parse(historyJson); } catch {}
      }

      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const mimeType = file.type || 'image/jpeg';
        imageDataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
      }
    } else {
      const body = await req.json();
      userPrompt = body.prompt || body.message || '';
      imageDataUrl = body.image || null;
      history = body.history || [];
    }

    if (!userPrompt && !imageDataUrl) {
      return NextResponse.json({ success: false, error: 'Please enter a message or upload an image.' }, { status: 400 });
    }

    // Load current shop stock for contextual awareness
    const currentItems = await listShopEntities('item').catch(() => []);
    const currentInvoices = await listShopEntities('invoice').catch(() => []);

    // Analyze intent for Stock Addition, Invoice Creation, or Stock Check
    const promptLower = userPrompt.toLowerCase();
    let executedAction: any = null;
    let assistantReply = '';
    let suggestions: string[] = [];

    // INTENT 1: Add Stock / Image Stock Intake
    const isAddStockIntent =
      promptLower.includes('add stock') ||
      promptLower.includes('add item') ||
      promptLower.includes('add to stock') ||
      promptLower.includes('add product') ||
      promptLower.includes('new stock') ||
      (imageDataUrl && (promptLower.includes('add') || promptLower.includes('stock') || userPrompt.trim().length === 0));

    if (isAddStockIntent) {
      // Extract details from prompt or image text
      const extractedName = extractProductName(userPrompt) || (imageDataUrl ? 'Newly Scanned Product' : 'New Stock Item');
      const extractedPrice = extractNumber(userPrompt, [/price\s*(?:is|=|:)?\s*₹?\s*(\d+)/i, /₹\s*(\d+)/i, /(\d+)\s*rs/i, /(\d+)\s*rupees/i]) || 120;
      const extractedQty = extractNumber(userPrompt, [/qty\s*(?:is|=|:)?\s*(\d+)/i, /quantity\s*(?:is|=|:)?\s*(\d+)/i, /(\d+)\s*units/i, /(\d+)\s*pcs/i, /(\d+)\s*items/i]) || 10;
      const extractedCategory = extractCategory(userPrompt) || 'General';

      const itemId = newEntityId();
      const newItem = {
        id: itemId,
        name: extractedName,
        price: Number(extractedPrice),
        qty: Number(extractedQty),
        category: extractedCategory,
        image: imageDataUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&q=80',
        description: `Added via AI Shopkeeper Assistant on ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toISOString(),
      };

      await putShopEntity('item', itemId, newItem);

      executedAction = {
        type: 'add_stock',
        item: newItem,
      };

      assistantReply = `✅ **Stock Added Successfully!**\n\nI have added **${newItem.name}** to your inventory:\n- **Quantity**: ${newItem.qty} units\n- **Price**: ₹${newItem.price}\n- **Category**: ${newItem.category}\n\nYou can now immediately bill this item from your POS Billing desk!`;
      suggestions = ['View all stock items', 'Create bill with this item', 'Scan another product image', 'Check low stock alerts'];
    }
    // INTENT 2: Check Low Stock / Stock Inquiry
    else if (promptLower.includes('low stock') || promptLower.includes('stock alert') || promptLower.includes('out of stock')) {
      const lowStockItems = currentItems.filter((item: any) => Number(item.qty || 0) <= 5);

      if (lowStockItems.length > 0) {
        const itemLines = lowStockItems.map((i: any) => `- **${i.name}**: ${i.qty} units remaining (Price: ₹${i.price})`).join('\n');
        assistantReply = `⚠️ **Low Stock Alert!**\n\nThe following ${lowStockItems.length} items are running low:\n\n${itemLines}\n\nWould you like me to draft a WhatsApp reorder message for your supplier?`;
      } else {
        assistantReply = `🎉 **Inventory Health Good!**\n\nAll ${currentItems.length} items in your stock have healthy quantities above low-stock thresholds.`;
      }
      suggestions = ['Draft supplier WhatsApp order', 'Add new stock', 'View stock report', 'Create bill'];
    }
    // INTENT 3: Create Bill / Invoice Guidance
    else if (promptLower.includes('create bill') || promptLower.includes('make invoice') || promptLower.includes('bill for')) {
      assistantReply = `🧾 **Ready to Create Bill!**\n\nTo quickly create a bill, go to **Business Suite -> Billing** or tell me the items and quantity (e.g. *"Bill 2 units of ${currentItems[0]?.name || 'Item'} for Walk-in"*).`;
      suggestions = ['Go to Billing Desk', 'Add new customer', 'View recent invoices'];
    }
    // GENERAL ASSISTANT / CHAT INTENT (Call LLM AI proxy API or fallback intelligent assistant)
    else {
      let aiText = '';
      try {
        const response = await fetch(`${API_ENDPOINT}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: `You are EasyTrader Shopkeeper Assistant (Drishti Copilot). You help retail shopkeepers manage stock, billing, invoices, customers, and app features. Keep your answers concise, practical, clear, and focused on shopkeeping efficiency in India (using ₹ for prices). Total items in stock right now: ${currentItems.length}.`,
              },
              ...history.slice(-4),
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 350,
          }),
        });

        if (response.ok) {
          const aiJson = await response.json();
          aiText = aiJson.choices?.[0]?.message?.content?.trim() || '';
        }
      } catch (e) {
        // Silent fallback if API proxy key is restricted or offline
      }

      if (!aiText) {
        aiText = `👋 Hello! I am your **EasyTrader Shopkeeper Copilot**!\n\nHere is how I can assist you right now:\n\n1. 📸 **Photo Stock Intake**: Upload a product photo or invoice picture, tell me price/quantity, and I'll add it directly to your stock!\n2. 📦 **Stock Management**: Ask me to check low stock, update prices, or reorder items.\n3. 🧾 **Billing & Invoices**: Ask me how to create bills, export GST reports, or manage customer credit balance.\n4. 📣 **Marketing**: Generate WhatsApp promotional posters for your shop.`;
      }

      assistantReply = aiText;
      suggestions = ['Add stock from photo', 'Check low stock items', 'How to generate WhatsApp bill', 'Create invoice'];
    }

    return NextResponse.json({
      success: true,
      reply: assistantReply,
      executedAction,
      suggestions,
      totalItemsInStock: currentItems.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'AI Copilot processing failed' }, { status: 500 });
  }
}

function extractProductName(text: string): string | null {
  const match = text.match(/(?:product|item|name|add)\s*(?:is|=|:)?\s*([a-zA-Z0-9\s]+?)(?:\s*(?:price|qty|quantity|rs|rupees|category|at|₹)|$)/i);
  if (match && match[1] && match[1].trim().length > 1) {
    return match[1].trim();
  }
  const clean = text.replace(/add\s*stock|add\s*item|price|qty|quantity|units|pcs|rs|rupees|₹|\d+/gi, '').trim();
  return clean.length > 2 ? clean : null;
}

function extractNumber(text: string, regexes: RegExp[]): number | null {
  for (const regex of regexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0) return num;
    }
  }
  return null;
}

function extractCategory(text: string): string | null {
  const categories = ['Grocery', 'Dairy', 'Snacks', 'Beverages', 'Electronics', 'Clothing', 'Personal Care', 'Stationery'];
  for (const cat of categories) {
    if (text.toLowerCase().includes(cat.toLowerCase())) return cat;
  }
  return null;
}
