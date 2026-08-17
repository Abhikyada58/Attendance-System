/**
 * Background Queue Service — Module 27
 *
 * A lightweight in-memory job queue for background processing.
 * Prevents heavy tasks (like report generation or bulk notifications)
 * from blocking HTTP requests or overwhelming the database.
 */

import { logger } from '../utils/logger';
import { metrics, increment } from './metrics.service';

type JobFunction = () => Promise<void>;

interface Job {
  id: string;
  name: string;
  task: JobFunction;
  retries: number;
}

const MAX_CONCURRENCY = 5;
const MAX_RETRIES = 3;

class QueueService {
  private queue: Job[] = [];
  private activeCount = 0;

  /** Enqueue a job to run in the background */
  enqueue(name: string, task: JobFunction) {
    const id = Math.random().toString(36).substring(2, 9);
    this.queue.push({ id, name, task, retries: 0 });
    increment(`queue.${name}.enqueued`);
    
    // Kick off processing if we have capacity
    this.processQueue();
    return id;
  }

  private async processQueue() {
    if (this.activeCount >= MAX_CONCURRENCY || this.queue.length === 0) return;

    this.activeCount++;
    const job = this.queue.shift()!;
    const startTime = Date.now();

    try {
      metrics.jobStarted(`queue_${job.name}`);
      await job.task();
      const duration = Date.now() - startTime;
      metrics.jobCompleted(`queue_${job.name}`, duration);
      logger.debug('queue', 'JOB_COMPLETED', `Job ${job.name} (${job.id}) completed in ${duration}ms`);
    } catch (err: any) {
      metrics.jobFailed(`queue_${job.name}`);
      if (job.retries < MAX_RETRIES) {
        job.retries++;
        logger.warn('queue', 'JOB_RETRY', `Job ${job.name} failed, retrying (${job.retries}/${MAX_RETRIES})`, err);
        // Put back at the end of the queue
        this.queue.push(job);
      } else {
        logger.error('queue', 'JOB_DEAD_LETTER', `Job ${job.name} failed after ${MAX_RETRIES} retries`, err);
      }
    } finally {
      this.activeCount--;
      // Process next item
      this.processQueue();
    }
  }

  /** Get queue status for monitoring */
  getStats() {
    return {
      pending: this.queue.length,
      active: this.activeCount,
    };
  }
}

export const backgroundQueue = new QueueService();
