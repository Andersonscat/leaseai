// Simple in-memory rate limiter for Gemini API
// Prevents exceeding free tier quota: 5 requests per minute

class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 15;
  private readonly windowMs = 60 * 1000; // 1 minute

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    // If we're at the limit, wait
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest) + 100; // Add 100ms buffer
      
      console.warn(`⏳ Rate limit: waiting ${Math.ceil(waitTime / 1000)}s before next Gemini API call`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Clean up again after waiting
      this.requests = this.requests.filter(time => Date.now() - time < this.windowMs);
    }
    
    // Record this request
    this.requests.push(Date.now());
  }

  getStats() {
    const now = Date.now();
    const recentRequests = this.requests.filter(time => now - time < this.windowMs);
    return {
      requestsInWindow: recentRequests.length,
      maxRequests: this.maxRequests,
      remaining: this.maxRequests - recentRequests.length,
    };
  }
}

export const geminiRateLimiter = new RateLimiter();
