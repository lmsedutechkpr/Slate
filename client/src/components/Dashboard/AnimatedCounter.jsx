import { useState, useEffect, useRef } from 'react';

const AnimatedCounter = ({ 
  value, 
  duration = 1000, 
  className = '',
  prefix = '',
  suffix = '',
  onComplete = null
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousValue = useRef(0);
  const animationRef = useRef(null);

  useEffect(() => {
    if (value !== previousValue.current) {
      setIsAnimating(true);
      
      const startValue = previousValue.current;
      const endValue = value;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (endValue - startValue) * easeOutCubic;
        
        setDisplayValue(Math.floor(currentValue));
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayValue(endValue);
          setIsAnimating(false);
          previousValue.current = endValue;
          onComplete?.();
        }
      };
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [value, duration, onComplete]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const formatValue = (val) => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    } else if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'K';
    }
    return val.toLocaleString();
  };

  return (
    <span 
      className={`transition-all duration-200 ${
        isAnimating ? 'scale-110 text-primary-600' : 'scale-100'
      } ${className}`}
    >
      {prefix}{formatValue(displayValue)}{suffix}
    </span>
  );
};

export default AnimatedCounter;
