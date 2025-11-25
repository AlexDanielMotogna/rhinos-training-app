import { Response } from 'express';

/**
 * SSE Manager
 * Manages Server-Sent Events connections for real-time updates
 */

interface SSEClient {
  id: string;
  response: Response;
  pollId?: string;
}

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();

  /**
   * Add a new SSE client connection
   */
  addClient(clientId: string, response: Response, pollId?: string): void {
    // Set SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for nginx
    });

    // Send initial connection message
    this.sendEvent(response, 'connected', { clientId, timestamp: new Date().toISOString() });

    // Store client
    this.clients.set(clientId, { id: clientId, response, pollId });

    console.log(`[SSE] Client ${clientId} connected${pollId ? ` to poll ${pollId}` : ''}`);
    console.log(`[SSE] Total clients: ${this.clients.size}`);

    // Handle client disconnect
    response.on('close', () => {
      this.removeClient(clientId);
    });
  }

  /**
   * Remove a client connection
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      console.log(`[SSE] Client ${clientId} disconnected`);
      console.log(`[SSE] Total clients: ${this.clients.size}`);
    }
  }

  /**
   * Send event to specific client
   */
  sendToClient(clientId: string, event: string, data: any): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }

    return this.sendEvent(client.response, event, data);
  }

  /**
   * Broadcast event to all clients watching a specific poll
   */
  broadcastToPoll(pollId: string, event: string, data: any): number {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.pollId === pollId) {
        if (this.sendEvent(client.response, event, data)) {
          count++;
        }
      }
    });
    console.log(`[SSE] Broadcasted ${event} to ${count} clients for poll ${pollId}`);
    return count;
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcastToAll(event: string, data: any): number {
    let count = 0;
    this.clients.forEach((client) => {
      if (this.sendEvent(client.response, event, data)) {
        count++;
      }
    });
    console.log(`[SSE] Broadcasted ${event} to ${count} clients`);
    return count;
  }

  /**
   * Send SSE event to a response
   */
  private sendEvent(response: Response, event: string, data: any): boolean {
    try {
      response.write(`event: ${event}\n`);
      response.write(`data: ${JSON.stringify(data)}\n\n`);
      return true;
    } catch (error) {
      console.error('[SSE] Error sending event:', error);
      return false;
    }
  }

  /**
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get number of clients watching a specific poll
   */
  getPollClientCount(pollId: string): number {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.pollId === pollId) {
        count++;
      }
    });
    return count;
  }
}

// Singleton instance
export const sseManager = new SSEManager();
