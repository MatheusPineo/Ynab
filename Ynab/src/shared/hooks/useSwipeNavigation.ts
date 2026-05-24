import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface SwipeConfig {
  minSwipeDistance?: number;
  edgeThreshold?: number;
}

const TABS = [
  "/dashboard",
  "/accounts",
  "/transactions",
  "/budget",
  "/goals",

  "/settings"
];

export const useSwipeNavigation = (config?: SwipeConfig) => {
  const navigate = useNavigate();
  const location = useLocation();

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const minSwipeDistance = config?.minSwipeDistance || 70;
  const edgeThreshold = config?.edgeThreshold || 35; // Distância limite da borda em px

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Ignorar toques multitouch (gestos de pinça, etc.)
      if (e.touches.length > 1) return;

      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;

      // Verificar se o toque inicial começou em um elemento que deve ignorar gestos
      let target = e.target as HTMLElement | null;
      while (target) {
        if (
          target.classList?.contains("no-swipe") ||
          target.classList?.contains("recharts-wrapper") ||
          target.classList?.contains("recharts-responsive-container") ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.getAttribute("role") === "slider" ||
          target.getAttribute("role") === "dialog"
        ) {
          return; // Aborta e não rastreia este toque
        }
        target = target.parentElement;
      }

      touchStartX.current = startX;
      touchStartY.current = startY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const touch = e.changedTouches[0];
      const distanceX = touch.clientX - touchStartX.current;
      const distanceY = touch.clientY - touchStartY.current;

      const absX = Math.abs(distanceX);
      const absY = Math.abs(distanceY);

      // O gesto deve ser majoritariamente horizontal
      const isHorizontal = absX > absY * 1.5;

      if (isHorizontal && absX > minSwipeDistance) {
        const startX = touchStartX.current;
        const screenWidth = window.innerWidth;

        // 1. Swipe das Bordas -> Navegação de Histórico (Voltar/Avançar)
        if (startX <= edgeThreshold && distanceX > 0) {
          // Começou na borda esquerda e deslizou para a direita -> Voltar
          navigate(-1);
        } else if (startX >= screenWidth - edgeThreshold && distanceX < 0) {
          // Começou na borda direita e deslizou para a esquerda -> Avançar
          navigate(1);
        } 
        // 2. Swipe no Centro da Tela -> Trocar Abas Principais
        else {
          const currentPath = location.pathname;
          const currentIndex = TABS.indexOf(currentPath);

          if (currentIndex !== -1) {
            if (distanceX < 0) {
              // Deslizou para a esquerda -> Próxima Aba
              const nextIndex = currentIndex + 1;
              if (nextIndex < TABS.length) {
                navigate(TABS[nextIndex]);
              }
            } else {
              // Deslizou para a direita -> Aba Anterior
              const prevIndex = currentIndex - 1;
              if (prevIndex >= 0) {
                navigate(TABS[prevIndex]);
              }
            }
          }
        }
      }

      // Resetar estados
      touchStartX.current = null;
      touchStartY.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [navigate, location.pathname, minSwipeDistance, edgeThreshold]);
};
