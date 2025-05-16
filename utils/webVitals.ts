import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

// Types for web vitals metrics
type WebVitalMetric = {
  id: string;
  name: string;
  value: number;
  delta: number;
  navigationType?: string;
};

/**
 * Helper function to log web vitals to console, analytics, or server
 * 
 * @param metric Web vitals metric object
 */
const logMetric = (metric: WebVitalMetric) => {
  // In development, log to console for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}: ${Math.round(metric.value)}`, metric);
  }
  
  // In production, you could send metrics to your analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Google Analytics, you would replace this with your actual analytics code
    // window.gtag('event', metric.name.toLowerCase(), {
    //   value: Math.round(metric.value),
    //   metric_id: metric.id,
    //   metric_value: metric.value,
    //   metric_delta: metric.delta,
    // });
    
    // Or send to your own server endpoint
    // fetch('/api/metrics', {
    //   method: 'POST', 
    //   body: JSON.stringify(metric)
    // });
  }
};

/**
 * Report web vitals metrics
 * Usage: 
 * import { reportWebVitals } from '@/utils/webVitals';
 * reportWebVitals();
 */
export function reportWebVitals(): void {
  try {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      // Core Web Vitals
      onCLS(logMetric);     // Cumulative Layout Shift
      onFCP(logMetric);     // First Contentful Paint
      onLCP(logMetric);     // Largest Contentful Paint
      onINP(logMetric);     // Interaction to Next Paint
      onTTFB(logMetric);    // Time to First Byte
    }
  } catch (err) {
    console.error('[Web Vitals] Error measuring web vitals:', err);
  }
}

/**
 * Report web vitals on route change
 * For Next.js App Router
 */
export function onRouteChange(): void {
  // Report web vitals on each route change
  reportWebVitals();
} 