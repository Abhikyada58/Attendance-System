/**
 * Webhook Service - Module 30
 * 
 * Handles the secure delivery of webhook payloads to external integrations.
 * Uses HMAC-SHA256 to sign payloads to prevent tampering and spoofing.
 */

import { prisma } from '../utils/prisma';
import crypto from 'crypto';
import fetch from 'node-fetch'; // using node-fetch for outgoing HTTP (assumes it's installed or we use native fetch in node 18+)

export const webhookService = {
  /**
   * Dispatches an event to all subscribed webhooks for a tenant.
   * This should ideally be called from a background queue (e.g., bullmq).
   */
  async dispatchEvent(tenantId: string, eventType: string, payload: any) {
    // 1. Find all active endpoints subscribed to this event for this tenant
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        instituteId: tenantId,
        isActive: true,
        events: {
          has: eventType
        }
      }
    });

    if (endpoints.length === 0) return;

    const eventId = crypto.randomUUID();
    const timestamp = Date.now().toString();
    const payloadString = JSON.stringify(payload);

    // 2. Dispatch to each endpoint
    for (const endpoint of endpoints) {
      // Create HMAC signature: hmac(secret, timestamp + "." + payload)
      const signaturePayload = `${timestamp}.${payloadString}`;
      const signature = crypto
        .createHmac('sha256', endpoint.secret)
        .update(signaturePayload)
        .digest('hex');

      try {
        // Log delivery attempt
        const delivery = await prisma.webhookDelivery.create({
          data: {
            endpointId: endpoint.id,
            eventId,
            eventType,
            status: 'RETRYING', // Initially pending/retrying
            payload
          }
        });

        // Fire HTTP POST
        // Note: In Node 18+, global fetch is available.
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-attendx-event': eventType,
            'x-attendx-delivery': delivery.id,
            'x-attendx-timestamp': timestamp,
            'x-attendx-signature': `t=${timestamp},v1=${signature}`
          },
          body: payloadString,
          // Reasonable timeout to prevent hanging the worker
          signal: AbortSignal.timeout(5000) 
        });

        const responseText = await response.text();

        // Update delivery status based on HTTP success
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: response.ok ? 'SUCCESS' : 'FAILED',
            statusCode: response.status,
            response: responseText.substring(0, 1000) // Truncate large responses
          }
        });

      } catch (error: any) {
        console.error(`Webhook Delivery Failed to ${endpoint.url}:`, error.message);
        
        // Log failure if it didn't even reach the network or timed out
        await prisma.webhookDelivery.create({
          data: {
            endpointId: endpoint.id,
            eventId,
            eventType,
            status: 'FAILED',
            response: error.message
          }
        });
      }
    }
  }
};
