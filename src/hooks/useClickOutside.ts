import { useEffect, useRef } from "react";

/**
 * A custom hook that detects clicks outside of a specified element.
 * Useful for closing modals, dropdowns, and popups.
 *
 * @param handleClose - The callback function to execute when a click outside is detected.
 * @param showPopUp - Boolean to enable/disable the listener.
 * @returns A React ref to be attached to the element to monitor.
 */
export const useClickOutside = <T extends HTMLElement = HTMLElement>(
  handleClose: () => void,
  showPopUp: boolean,
) => {
  const ref = useRef<T>(null);
  // Store the handler in a ref to avoid re-binding the event listener when the handler changes
  const handlerRef = useRef(handleClose);

  // Update the ref when the handler changes
  useEffect(() => {
    handlerRef.current = handleClose;
  }, [handleClose]);

  useEffect(() => {
    if (!showPopUp) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (ref.current && !ref.current.contains(target)) {
        handlerRef.current(); // Close popup if clicked outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showPopUp]);

  return ref;
};

export default useClickOutside;
