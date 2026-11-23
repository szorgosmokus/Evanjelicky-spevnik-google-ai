import { useEffect, useState } from 'react';

interface OrientationState {
  isLandscape: boolean;
  isCompactLandscape: boolean;
}

function readOrientation(): OrientationState {
  if (typeof window === 'undefined') {
    return { isLandscape: false, isCompactLandscape: false };
  }
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isLandscape = width > height;
  const isCompactLandscape = isLandscape && width >= 560 && height <= 540;
  return { isLandscape, isCompactLandscape };
}

export function useOrientation(): OrientationState {
  const [state, setState] = useState<OrientationState>(readOrientation);

  useEffect(() => {
    const update = () => {
      setState(readOrientation());
    };

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    window.screen?.orientation?.addEventListener?.('change', update);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.screen?.orientation?.removeEventListener?.('change', update);
    };
  }, []);

  return state;
}
