import { useEffect, RefObject } from 'react';

/**
 * A hook that handles clicks outside of the specified element
 * 
 * @param ref The reference to the element to detect clicks outside of
 * @param handler The callback function to call when a click outside is detected
 * @param exceptRefs Additional refs that should not trigger the handler
 */
export function useClickOutside(
  ref: RefObject<HTMLElement>,
  handler: () => void,
  exceptRefs: RefObject<HTMLElement>[] = []
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // If click is on the ref element, do nothing
      if (!ref.current || ref.current.contains(target)) {
        return;
      }
      
      // If click is on any of the except refs, do nothing
      for (const exceptRef of exceptRefs) {
        if (exceptRef.current && exceptRef.current.contains(target)) {
          return;
        }
      }
      
      handler();
    };
    
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, exceptRefs]);
}
