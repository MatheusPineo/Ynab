import React, { useState, useRef } from "react";
import { Edit2, Trash2 } from "lucide-react";

interface SwipeableTransactionCardProps {
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

export const SwipeableTransactionCard: React.FC<SwipeableTransactionCardProps> = ({
  onEdit,
  onDelete,
  children,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwipingHorizontal = useRef<boolean | null>(null);
  const currentOffset = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwipingHorizontal.current = null;
    currentOffset.current = offsetX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);

    // Determina a direção se ainda não estiver definida
    if (isSwipingHorizontal.current === null) {
      if (absX > absY * 1.5 && absX > 10) {
        isSwipingHorizontal.current = true;
      } else if (absY > absX * 1.5 && absY > 10) {
        isSwipingHorizontal.current = false;
      }
    }

    // Se estiver deslizando horizontalmente, calcula o deslocamento e impede o scroll vertical
    if (isSwipingHorizontal.current === true) {
      if (e.cancelable) {
        e.preventDefault();
      }

      let nextOffset = currentOffset.current + diffX;

      // Adiciona limites elásticos
      if (nextOffset > 90) {
        nextOffset = 90 + (nextOffset - 90) * 0.25; // Resistência ao passar de 90px
      } else if (nextOffset < -90) {
        nextOffset = -90 + (nextOffset + -90) * 0.25; // Resistência ao passar de -90px
      }

      setOffsetX(nextOffset);
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    touchStartY.current = null;
    isSwipingHorizontal.current = null;

    // Encaixa (snap) nas posições pré-definidas ou retorna ao centro
    if (offsetX > 45) {
      setOffsetX(80); // Abre ação de Editar à esquerda (deslizar para a direita)
    } else if (offsetX < -45) {
      setOffsetX(-80); // Abre ação de Excluir à direita (deslizar para a esquerda)
    } else {
      setOffsetX(0);
    }
  };

  const triggerEdit = () => {
    onEdit();
    setOffsetX(0); // Fecha o swipe
  };

  const triggerDelete = () => {
    onDelete();
    setOffsetX(0); // Fecha o swipe
  };

  return (
    <div className="relative overflow-hidden rounded-xl w-full select-none">
      {/* Camada inferior de Ações (Aparece por trás ao deslizar) */}
      <div className="absolute inset-0 flex justify-between items-stretch w-full h-full">
        {/* Ação de Editar (Revelada ao deslizar para a DIREITA) */}
        <div
          onClick={triggerEdit}
          style={{
            opacity: offsetX > 10 ? Math.min(1, offsetX / 60) : 0,
            transition: "opacity 150ms linear",
          }}
          className="flex items-center bg-blue-600 dark:bg-blue-500 text-white font-bold text-xs px-5 rounded-l-xl cursor-pointer hover:bg-blue-700 active:opacity-90"
        >
          <div className="flex flex-col items-center gap-1">
            <Edit2 className="h-4 w-4" />
            <span>Editar</span>
          </div>
        </div>

        {/* Ação de Excluir (Revelada ao deslizar para a ESQUERDA) */}
        <div
          onClick={triggerDelete}
          style={{
            opacity: offsetX < -10 ? Math.min(1, Math.abs(offsetX) / 60) : 0,
            transition: "opacity 150ms linear",
          }}
          className="flex items-center bg-rose-600 dark:bg-rose-500 text-white font-bold text-xs px-5 rounded-r-xl cursor-pointer hover:bg-rose-700 active:opacity-90 ml-auto"
        >
          <div className="flex flex-col items-center gap-1">
            <Trash2 className="h-4 w-4" />
            <span>Excluir</span>
          </div>
        </div>
      </div>

      {/* Camada superior do Conteúdo (O item original que desliza) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: touchStartX.current === null ? "transform 250ms cubic-bezier(0.16, 1, 0.3, 1)" : "none",
        }}
        className="relative z-10 w-full cursor-grab active:cursor-grabbing bg-transparent"
      >
        {children}
      </div>
    </div>
  );
};
