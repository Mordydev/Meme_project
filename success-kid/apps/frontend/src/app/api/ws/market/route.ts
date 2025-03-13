import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // This is a simplified approach for websocket demonstration purposes
  // In production, you would use a dedicated WebSocket solution
  
  const { searchParams } = new URL(request.url);
  
  // Set headers for SSE (Server-Sent Events) as a simple way to stream data
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };
  
  // Create a stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Keep track of the interval for cleanup
      let intervalId: NodeJS.Timeout;
      
      // Function to send price updates
      const sendPriceUpdate = () => {
        // Generate random price change
        const basePrice = 0.00897;
        const priceChange = basePrice * (Math.random() * 0.02 - 0.01); // -1% to +1%
        const newPrice = basePrice + priceChange;
        const percentChange = (priceChange / basePrice) * 100;
        
        // Create message
        const message = {
          type: 'market:price_update',
          data: {
            price: newPrice,
            priceChange,
            priceChangePercent: percentChange,
            timestamp: new Date().toISOString()
          }
        };
        
        // Send the message
        controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
      };
      
      // Function to send transaction updates
      const sendTransactionUpdate = () => {
        // Generate random transaction
        const transactionTypes = ['buy', 'sell', 'transfer'];
        const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
        const amount = Math.floor(Math.random() * 100000) + 1000; // 1,000 to 101,000
        const price = 0.00897;
        const value = type === 'transfer' ? null : amount * price;
        const isSignificant = amount > 50000; // Significant if > 50,000 tokens
        
        // Generate addresses
        const address1 = `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`;
        const address2 = `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`;
        
        // Create message
        const message = {
          type: 'market:new_transaction',
          data: {
            hash: `0x${Math.random().toString(16).substring(2, 66)}`,
            type,
            amount,
            price: type === 'transfer' ? null : price,
            value,
            timestamp: new Date().toISOString(),
            fromAddress: type === 'buy' ? '0x0000000000000000000000000000000000000000' : address1,
            toAddress: type === 'sell' ? '0x0000000000000000000000000000000000000000' : type === 'buy' ? address1 : address2,
            isSignificant
          }
        };
        
        // Send the message
        controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
      };
      
      // Occasionally send milestone updates (very rare)
      const checkMilestone = () => {
        // 1% chance of milestone update
        if (Math.random() < 0.01) {
          const milestones = [
            { id: 'milestone_1m', value: 1000000, label: '$1M', description: 'Major growth milestone' },
            { id: 'milestone_5m', value: 5000000, label: '$5M', description: 'Expansion milestone' },
          ];
          
          const milestone = milestones[Math.floor(Math.random() * milestones.length)];
          
          // Create message
          const message = {
            type: 'market:milestone_reached',
            data: {
              ...milestone,
              achievedAt: new Date().toISOString()
            }
          };
          
          // Send the message
          controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
        }
      };
      
      // Send initial heartbeat
      controller.enqueue(`data: {"type":"connection:established","data":{"status":"connected"}}\n\n`);
      
      // Set interval to send updates
      intervalId = setInterval(() => {
        // 80% chance of price update each interval
        if (Math.random() < 0.8) {
          sendPriceUpdate();
        }
        
        // 40% chance of transaction update each interval
        if (Math.random() < 0.4) {
          sendTransactionUpdate();
        }
        
        // Check for milestone updates
        checkMilestone();
      }, 5000); // Send update every 5 seconds
      
      // Clean up interval on close
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
      });
    }
  });
  
  return new Response(stream, { headers });
}
