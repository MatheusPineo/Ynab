import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const isAtTop = useRef(true);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        // Encontra o contêiner rolável ancestral ou usa o elemento em si
        let parent: HTMLElement | null = containerRef.current;
        let foundScrollTop = 0;
        while (parent) {
          if (parent.scrollTop > 0) {
            foundScrollTop = parent.scrollTop;
            break;
          }
          parent = parent.parentElement;
        }
        isAtTop.current = foundScrollTop === 0 && window.scrollY === 0;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    containerRef.current?.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      containerRef.current?.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRefreshing) return;
    
    // Verifica se estamos no topo da página para iniciar o arrasto
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    let parentScrollTop = 0;
    let el = containerRef.current;
    while (el) {
      if (el.scrollTop > 0) {
        parentScrollTop = el.scrollTop;
        break;
      }
      el = el.parentElement;
    }

    if (scrollTop === 0 && parentScrollTop === 0) {
      isAtTop.current = true;
      touchStartY.current = e.touches[0].clientY;
    } else {
      isAtTop.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null || !isAtTop.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;

    if (deltaY > 0) {
      // Aplicar resistência para uma física natural e elástica
      const distance = Math.min(80, Math.pow(deltaY, 0.8));
      setPullDistance(distance);

      // Prevenir o scroll padrão do navegador (efeito rebote nativo) se estivermos arrastando para baixo no topo
      if (e.cancelable) {
        e.preventDefault();
      }
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (touchStartY.current === null || isRefreshing) return;

    touchStartY.current = null;

    if (pullDistance >= 50) {
      setIsRefreshing(true);
      setPullDistance(50); // Trava o spinner na altura de carregamento
      
      try {
        await onRefresh();
      } catch (err) {
        console.error("Erro ao recarregar dados:", err);
      } finally {
        // Suaviza o retorno após finalizar
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 600);
      }
    } else {
      setPullDistance(0);
    }
  };

  const rotation = Math.min(360, (pullDistance / 50) * 360);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-full"
    >
      {/* Indicador de Pull to Refresh */}
      <div
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 10 ? Math.min(1, pullDistance / 50) : 0,
          transition: touchStartY.current === null ? "all 300ms cubic-bezier(0.16, 1, 0.3, 1)" : "none",
        }}
        className="w-full flex items-center justify-center overflow-hidden shrink-0 select-none pointer-events-none"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/90 border border-border/40 text-primary shadow-glow backdrop-blur-md">
          <Loader2
            style={{
              transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
              transition: isRefreshing ? "none" : "transform 100ms linear",
            }}
            className={`h-4 w-4 shrink-0 ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span className="text-[10px] sm:text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {isRefreshing ? "Atualizando..." : pullDistance >= 50 ? "Solte para atualizar" : "Puxe para atualizar"}
          </span>
        </div>
      </div>

      {/* Conteúdo Renderizado */}
      <div
        style={{
          transform: `translateY(${isRefreshing ? 0 : pullDistance * 0.25}px)`,
          transition: touchStartY.current === null ? "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)" : "none",
        }}
        className="w-full h-full"
      >
        {children}
      </div>
    </div>
  );
};
